// The app target imports Expo modules as internal (see AppDelegate.swift), so this module is internal too
internal import ExpoModulesCore
import Foundation
import Network
import os

/**
 * Serves streams to a Cast receiver on the local network. The receiver is a browser: it can't send the Referer or
 * User-Agent a provider checks, and it needs CORS headers the provider's CDN doesn't send. Bytes are copied through
 * natively, Range requests forwarded, and HLS playlists rewritten so every URI in them comes back through here.
 */
@ExpoModule("CastProxyModule")
final class CastProxyModule: Module {
  /// Starts the server if it isn't running; returns its address on the local network
  @JS
  func start() throws -> String {
    try CastProxyServer.shared.start()
  }

  /// The server's URL for `url`, which it fetches with `headersJson`'s headers
  @JS
  func register(url: String, headersJson: String) throws -> String {
    try CastProxyServer.shared.register(url: url, headersJson: headersJson)
  }

  @JS
  func stop() {
    CastProxyServer.shared.stop()
  }
}

struct CastProxyError: Error, CustomStringConvertible {
  let description: String
  init(_ description: String) { self.description = description }
}

/// Connections and upstream requests all run on one serial queue, so the per-request state needs no locks
final class CastProxyServer: NSObject, URLSessionDataDelegate {
  static let shared = CastProxyServer()

  private static let chunk = 256 * 1024
  private static let log = Logger(subsystem: "com.x2004durgesh.uwumi", category: "CastProxy")
  private static let cors = [
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Content-Type",
  ]

  private let queue = DispatchQueue(label: "uwumi.cast-proxy")
  private let lock = NSLock()
  private var listener: NWListener?
  private var port: UInt16 = 0
  private var headersBySession: [String: [String: String]] = [:]
  private var relays: [Int: Relay] = [:]

  private lazy var urlSession: URLSession = {
    let delegateQueue = OperationQueue()
    delegateQueue.underlyingQueue = queue
    delegateQueue.maxConcurrentOperationCount = 1
    return URLSession(configuration: .ephemeral, delegate: self, delegateQueue: delegateQueue)
  }()

  private final class Relay {
    let connection: NWConnection
    let target: String
    let session: String
    let method: String
    var response: HTTPURLResponse?
    var playlist = false
    var headSent = false
    var body = Data()
    var inFlight = 0

    init(connection: NWConnection, target: String, session: String, method: String) {
      self.connection = connection
      self.target = target
      self.session = session
      self.method = method
    }
  }

  func start() throws -> String {
    lock.lock()
    defer { lock.unlock() }
    if listener == nil {
      let created = try NWListener(using: .tcp, on: .any)
      let ready = DispatchSemaphore(value: 0)
      created.stateUpdateHandler = { state in
        switch state {
        case .ready, .failed, .cancelled: ready.signal()
        default: break
        }
      }
      created.newConnectionHandler = { [weak self] connection in self?.accept(connection) }
      created.start(queue: queue)
      _ = ready.wait(timeout: .now() + 2)
      created.stateUpdateHandler = nil
      guard let assigned = created.port?.rawValue, assigned != 0 else {
        created.cancel()
        throw CastProxyError("The cast server couldn't start")
      }
      listener = created
      port = assigned
    }
    guard let address = Self.lanAddress() else { throw CastProxyError("Not on a local network") }
    return "http://\(address):\(port)"
  }

  func register(url: String, headersJson: String) throws -> String {
    let base = try start()
    let parsed = try JSONSerialization.jsonObject(with: Data(headersJson.utf8)) as? [String: Any]
    let session = String(UUID().uuidString.prefix(8)).lowercased()
    lock.lock()
    headersBySession[session] = parsed?.compactMapValues { $0 as? String } ?? [:]
    lock.unlock()
    return base + Self.path(session: session, url: url)
  }

  func stop() {
    lock.lock()
    listener?.cancel()
    listener = nil
    port = 0
    headersBySession.removeAll()
    lock.unlock()
  }

  // MARK: - Connections

  private func accept(_ connection: NWConnection) {
    connection.start(queue: queue)
    receiveHead(connection, buffer: Data())
  }

  private func receiveHead(_ connection: NWConnection, buffer: Data) {
    connection.receive(minimumIncompleteLength: 1, maximumLength: 16 * 1024) { [weak self] data, _, complete, error in
      guard let self else { return }
      var buffer = buffer
      if let data { buffer.append(data) }
      if let end = buffer.range(of: Data("\r\n\r\n".utf8)) {
        self.handle(connection, head: String(decoding: buffer[..<end.lowerBound], as: UTF8.self))
      } else if complete || error != nil || buffer.count > 64 * 1024 {
        // A receiver that upgrades to HTTPS sends a TLS handshake here instead
        Self.log.warning("Not an HTTP request from \(String(describing: connection.endpoint), privacy: .public)")
        connection.cancel()
      } else {
        self.receiveHead(connection, buffer: buffer)
      }
    }
  }

  private func handle(_ connection: NWConnection, head: String) {
    let lines = head.components(separatedBy: "\r\n")
    let request = lines.first?.split(separator: " ").map(String.init) ?? []
    var requestHeaders: [String: String] = [:]
    for line in lines.dropFirst() {
      guard let colon = line.firstIndex(of: ":") else { continue }
      requestHeaders[line[..<colon].trimmingCharacters(in: .whitespaces).lowercased()] =
        line[line.index(after: colon)...].trimmingCharacters(in: .whitespaces)
    }
    guard request.count >= 2 else { return connection.cancel() }
    let method = request[0]
    Self.log.info(
      "\(method, privacy: .public) \(request[1].components(separatedBy: "/").last ?? "", privacy: .public) from \(String(describing: connection.endpoint), privacy: .public)"
    )
    if method == "OPTIONS" { return reply(connection, status: 204, headers: [:], body: nil) }

    let parts = request[1].components(separatedBy: "/")
    lock.lock()
    let headers = parts.count >= 4 && parts[1] == "p" ? headersBySession[parts[2]] : nil
    lock.unlock()
    guard let headers, let target = Self.decode(parts[3]) else {
      return reply(connection, status: 404, headers: ["Content-Length": "0"], body: nil)
    }
    if target.hasPrefix("file://") {
      serveFile(connection, target: target, method: method, range: requestHeaders["range"])
    } else {
      relay(connection, target: target, method: method, headers: headers, session: parts[2], range: requestHeaders["range"])
    }
  }

  private func reply(_ connection: NWConnection, status: Int, headers: [String: String], body: Data?) {
    var data = Data(Self.head(status, headers).utf8)
    if let body { data.append(body) }
    connection.send(content: data, isComplete: true, completion: .contentProcessed { _ in connection.cancel() })
  }

  private func finish(_ connection: NWConnection) {
    connection.send(content: nil, isComplete: true, completion: .contentProcessed { _ in connection.cancel() })
  }

  // MARK: - Upstream

  private func relay(
    _ connection: NWConnection, target: String, method: String, headers: [String: String], session: String, range: String?
  ) {
    guard let url = URL(string: target) else { return reply(connection, status: 404, headers: ["Content-Length": "0"], body: nil) }
    var request = URLRequest(url: url)
    request.httpMethod = method == "HEAD" ? "HEAD" : "GET"
    headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
    // Otherwise the body arrives unzipped while Content-Length still counts the zipped bytes
    request.setValue("identity", forHTTPHeaderField: "Accept-Encoding")
    if let range { request.setValue(range, forHTTPHeaderField: "Range") }
    let task = urlSession.dataTask(with: request)
    relays[task.taskIdentifier] = Relay(connection: connection, target: target, session: session, method: method)
    connection.stateUpdateHandler = { [weak task] state in
      switch state {
      case .failed, .cancelled: task?.cancel()
      default: break
      }
    }
    task.resume()
  }

  func urlSession(
    _ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    guard let relay = relays[dataTask.taskIdentifier], let http = response as? HTTPURLResponse else {
      return completionHandler(.cancel)
    }
    relay.response = http
    let type = http.value(forHTTPHeaderField: "Content-Type") ?? ""
    Self.log.info("  upstream \(http.statusCode) \(type, privacy: .public) for \(http.url?.host ?? "", privacy: .public)")
    let path = relay.target.components(separatedBy: "?")[0].lowercased()
    relay.playlist = relay.method != "HEAD" && http.statusCode < 400
      && (type.localizedCaseInsensitiveContains("mpegurl") || path.hasSuffix(".m3u8"))
    completionHandler(.allow)
  }

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    guard let relay = relays[dataTask.taskIdentifier] else { return }
    // Some CDNs send playlists as text/plain or octet-stream, so the first bytes decide too
    if !relay.headSent, !relay.playlist, relay.body.isEmpty, (relay.response?.statusCode ?? 500) < 400,
       data.starts(with: Data("#EXTM3U".utf8)) {
      relay.playlist = true
    }
    if relay.playlist { return relay.body.append(data) }
    sendHead(relay)
    relay.inFlight += data.count
    if relay.inFlight > 4 << 20 { dataTask.suspend() }
    relay.connection.send(content: data, completion: .contentProcessed { [weak dataTask] error in
      relay.inFlight -= data.count
      guard error == nil else { dataTask?.cancel(); return }
      if relay.inFlight < 1 << 20, dataTask?.state == .suspended { dataTask?.resume() }
    })
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    guard let relay = relays.removeValue(forKey: task.taskIdentifier) else { return }
    if let error { Self.log.warning("Upstream failed: \(error.localizedDescription, privacy: .public)") }
    if relay.playlist, error == nil, let base = relay.response?.url ?? URL(string: relay.target) {
      let body = Data(Self.rewrite(String(decoding: relay.body, as: UTF8.self), base: base, session: relay.session).utf8)
      return reply(relay.connection, status: 200,
                   headers: ["Content-Type": "application/vnd.apple.mpegurl", "Content-Length": "\(body.count)"], body: body)
    }
    if !relay.headSent {
      guard relay.response != nil else { return reply(relay.connection, status: 502, headers: ["Content-Length": "0"], body: nil) }
      sendHead(relay)
    }
    finish(relay.connection)
  }

  private func sendHead(_ relay: Relay) {
    guard !relay.headSent, let response = relay.response else { return }
    relay.headSent = true
    var headers: [String: String] = [:]
    for name in ["Content-Type", "Content-Length", "Content-Range"] {
      if let value = response.value(forHTTPHeaderField: name) { headers[name] = value }
    }
    headers["Accept-Ranges"] = response.value(forHTTPHeaderField: "Accept-Ranges") ?? "bytes"
    relay.connection.send(content: Data(Self.head(response.statusCode, headers).utf8), completion: .contentProcessed { _ in })
  }

  // MARK: - Files

  private func serveFile(_ connection: NWConnection, target: String, method: String, range: String?) {
    guard let url = URL(string: target), let handle = try? FileHandle(forReadingFrom: url),
          let size = (try? FileManager.default.attributesOfItem(atPath: url.path)[.size] as? NSNumber)?.int64Value
    else { return reply(connection, status: 404, headers: ["Content-Length": "0"], body: nil) }
    var start: Int64 = 0
    var end = size - 1
    if let range, let spec = range.components(separatedBy: "=").last {
      let bounds = spec.components(separatedBy: "-")
      start = Int64(bounds[0]) ?? 0
      if bounds.count > 1, let last = Int64(bounds[1]) { end = last }
    }
    var headers = [
      "Content-Type": url.pathExtension.lowercased() == "mkv" ? "video/x-matroska" : "video/mp4",
      "Content-Length": "\(end - start + 1)",
      "Accept-Ranges": "bytes",
    ]
    if range != nil { headers["Content-Range"] = "bytes \(start)-\(end)/\(size)" }
    connection.send(content: Data(Self.head(range != nil ? 206 : 200, headers).utf8), completion: .contentProcessed { _ in })
    guard method != "HEAD" else {
      try? handle.close()
      return finish(connection)
    }
    try? handle.seek(toOffset: UInt64(start))
    sendChunks(connection, handle: handle, left: end - start + 1)
  }

  private func sendChunks(_ connection: NWConnection, handle: FileHandle, left: Int64) {
    guard left > 0, let chunk = try? handle.read(upToCount: Int(min(left, Int64(Self.chunk)))), !chunk.isEmpty else {
      try? handle.close()
      return finish(connection)
    }
    connection.send(content: chunk, completion: .contentProcessed { [weak self] error in
      guard error == nil else {
        try? handle.close()
        return connection.cancel()
      }
      self?.sendChunks(connection, handle: handle, left: left - Int64(chunk.count))
    })
  }

  // MARK: - Helpers

  // A file-like last part, for receivers that look at the extension
  private static func path(session: String, url: String) -> String {
    let name = url.components(separatedBy: "?")[0].components(separatedBy: "/").last.flatMap { $0.isEmpty ? nil : $0 } ?? "media"
    let encoded = Data(url.utf8).base64EncodedString()
      .replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    return "/p/\(session)/\(encoded)/\(name.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? "media")"
  }

  private static func decode(_ encoded: String) -> String? {
    var base64 = encoded.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
    base64 += String(repeating: "=", count: (4 - base64.count % 4) % 4)
    return Data(base64Encoded: base64).map { String(decoding: $0, as: UTF8.self) }
  }

  private static func rewrite(_ playlist: String, base: URL, session: String) -> String {
    func proxied(_ reference: String) -> String {
      let trimmed = reference.trimmingCharacters(in: .whitespaces)
      return path(session: session, url: URL(string: trimmed, relativeTo: base)?.absoluteString ?? trimmed)
    }
    let uriAttribute = try? NSRegularExpression(pattern: "URI=\"([^\"]+)\"")
    return playlist.components(separatedBy: "\n").map { raw -> String in
      let line = raw.trimmingCharacters(in: CharacterSet(charactersIn: "\r"))
      if line.trimmingCharacters(in: .whitespaces).isEmpty { return line }
      guard line.hasPrefix("#") else { return proxied(line) }
      guard let uriAttribute else { return line }
      var result = line
      for match in uriAttribute.matches(in: line, range: NSRange(line.startIndex..., in: line)).reversed() {
        guard let whole = Range(match.range, in: line), let value = Range(match.range(at: 1), in: line) else { continue }
        result.replaceSubrange(whole, with: "URI=\"\(proxied(String(line[value])))\"")
      }
      return result
    }.joined(separator: "\n")
  }

  private static func head(_ status: Int, _ headers: [String: String]) -> String {
    let reason = [200: "OK", 204: "No Content", 206: "Partial Content", 404: "Not Found", 502: "Bad Gateway"][status] ?? "Status"
    var head = "HTTP/1.1 \(status) \(reason)\r\n"
    for (name, value) in headers.merging(cors, uniquingKeysWith: { own, _ in own }) { head += "\(name): \(value)\r\n" }
    return head + "Connection: close\r\n\r\n"
  }

  // The Wi-Fi address the receiver can reach
  private static func lanAddress() -> String? {
    var addresses: UnsafeMutablePointer<ifaddrs>?
    guard getifaddrs(&addresses) == 0, let first = addresses else { return nil }
    defer { freeifaddrs(addresses) }
    var fallback: String?
    for pointer in sequence(first: first, next: { $0.pointee.ifa_next }) {
      let interface = pointer.pointee
      guard let address = interface.ifa_addr, address.pointee.sa_family == UInt8(AF_INET) else { continue }
      let name = String(cString: interface.ifa_name)
      guard name != "lo0" else { continue }
      var host = [CChar](repeating: 0, count: Int(NI_MAXHOST))
      getnameinfo(address, socklen_t(address.pointee.sa_len), &host, socklen_t(host.count), nil, 0, NI_NUMERICHOST)
      let ip = String(cString: host)
      if name == "en0" { return ip }
      if fallback == nil, ip.hasPrefix("192.168.") || ip.hasPrefix("10.") || ip.hasPrefix("172.") { fallback = ip }
    }
    return fallback
  }
}
