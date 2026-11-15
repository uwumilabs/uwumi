package com.x2004durgesh.uwumi.modules

import android.util.Base64
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.ByteArrayInputStream
import java.io.File
import java.io.InputStream
import java.io.OutputStream
import java.io.RandomAccessFile
import java.net.HttpURLConnection
import java.net.Inet4Address
import java.net.InetAddress
import java.net.NetworkInterface
import java.net.ServerSocket
import java.net.Socket
import java.net.URL
import java.net.URLDecoder
import java.net.URLEncoder
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

/**
 * Serves streams to a Cast receiver on the local network. The receiver is a browser: it can't send the Referer or
 * User-Agent a provider checks, and it needs CORS headers the provider's CDN doesn't send. Bytes are copied through
 * natively, Range requests forwarded, and HLS playlists rewritten so every URI in them comes back through here.
 */
class CastProxyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CastProxyModule")

    Function("start") { CastProxyServer.start() }

    Function("register") { url: String, headersJson: String -> CastProxyServer.register(url, headersJson) }

    Function("stop") { CastProxyServer.stop() }
  }
}

private object CastProxyServer {
  private const val TAG = "CastProxy"
  private const val BUFFER = 64 * 1024
  private val pool = Executors.newCachedThreadPool()
  private val headersBySession = ConcurrentHashMap<String, Map<String, String>>()
  private var socket: ServerSocket? = null

  private val CORS = mapOf(
    "Access-Control-Allow-Origin" to "*",
    "Access-Control-Allow-Headers" to "*",
    "Access-Control-Allow-Methods" to "GET, HEAD, OPTIONS",
    "Access-Control-Expose-Headers" to "Content-Length, Content-Range, Content-Type",
  )
  private val URI_ATTRIBUTE = Regex("URI=\"([^\"]+)\"")

  @Synchronized
  fun start(): String {
    val server = socket ?: ServerSocket(0, 50, InetAddress.getByName("0.0.0.0")).also { created ->
      socket = created
      pool.execute { accept(created) }
    }
    return "http://${lanAddress()}:${server.localPort}"
  }

  @Synchronized
  fun stop() {
    socket?.close()
    socket = null
    headersBySession.clear()
  }

  fun register(url: String, headersJson: String): String {
    val base = start()
    val session = UUID.randomUUID().toString().take(8)
    val json = JSONObject(headersJson)
    headersBySession[session] = json.keys().asSequence().associateWith { json.getString(it) }
    return base + path(session, url)
  }

  // A file-like last part, for receivers that look at the extension
  private fun path(session: String, url: String): String {
    val name = url.substringBefore('?').substringAfterLast('/').ifEmpty { "media" }
    val encoded = Base64.encodeToString(url.toByteArray(), Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
    return "/p/$session/$encoded/${URLEncoder.encode(name, "UTF-8")}"
  }

  private fun accept(server: ServerSocket) {
    while (!server.isClosed) {
      val client = runCatching { server.accept() }.getOrNull() ?: break
      pool.execute { runCatching { handle(client) }.onFailure { Log.w(TAG, "Request failed", it) } }
    }
  }

  private fun handle(client: Socket) = client.use { connection ->
    connection.soTimeout = 30_000
    val input = BufferedInputStream(connection.getInputStream())
    val out = BufferedOutputStream(connection.getOutputStream(), BUFFER)
    val request = readLine(input)?.split(' ') ?: return
    val requestHeaders = generateSequence { readLine(input)?.takeIf { it.isNotEmpty() } }
      .mapNotNull { line -> line.indexOf(':').takeIf { it > 0 }?.let { line.take(it).trim().lowercase() to line.drop(it + 1).trim() } }
      .toMap()
    val method = request.getOrNull(0) ?: return
    // A receiver that upgrades to HTTPS sends a TLS handshake here instead
    if (method !in listOf("GET", "HEAD", "OPTIONS")) {
      Log.w(TAG, "Not an HTTP request from ${connection.inetAddress}")
      return
    }
    Log.i(TAG, "$method ${request.getOrNull(1)?.substringAfterLast('/')} from ${connection.inetAddress}")
    if (method == "OPTIONS") return writeHead(out, 204, emptyMap()).also { out.flush() }

    val parts = request.getOrNull(1)?.split('/') ?: return
    val headers = parts.takeIf { it.size >= 4 && it[1] == "p" }?.let { headersBySession[it[2]] }
      ?: return writeHead(out, 404, mapOf("Content-Length" to "0")).also { out.flush() }
    val target = String(Base64.decode(parts[3], Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING))
    if (target.startsWith("file://")) serveFile(target, method, requestHeaders["range"], out)
    else relay(target, method, headers, parts[2], requestHeaders["range"], out)
  }

  private fun relay(target: String, method: String, headers: Map<String, String>, session: String, range: String?, out: OutputStream) {
    val upstream = (URL(target).openConnection() as HttpURLConnection).apply {
      instanceFollowRedirects = true
      connectTimeout = 15_000
      readTimeout = 30_000
      requestMethod = if (method == "HEAD") "HEAD" else "GET"
      headers.forEach { (name, value) -> setRequestProperty(name, value) }
      // Otherwise the body arrives unzipped while Content-Length still counts the zipped bytes
      setRequestProperty("Accept-Encoding", "identity")
      range?.let { setRequestProperty("Range", it) }
    }
    try {
      val status = upstream.responseCode
      Log.i(TAG, "  upstream $status ${upstream.contentType} for ${URL(target).host}")
      val body = BufferedInputStream((if (status >= 400) upstream.errorStream else upstream.inputStream) ?: ByteArrayInputStream(ByteArray(0)), BUFFER)
      val playlist = method != "HEAD" && status < 400 && isPlaylist(upstream.contentType, target, body)
      if (playlist) {
        val rewritten = rewrite(body.bufferedReader().readText(), upstream.url.toString(), session).toByteArray()
        writeHead(out, 200, mapOf("Content-Type" to "application/vnd.apple.mpegurl", "Content-Length" to rewritten.size.toString()))
        out.write(rewritten)
      } else {
        val forwarded = listOf("Content-Type", "Content-Length", "Content-Range")
          .mapNotNull { name -> upstream.getHeaderField(name)?.let { name to it } }.toMap()
        writeHead(out, status, forwarded + ("Accept-Ranges" to (upstream.getHeaderField("Accept-Ranges") ?: "bytes")))
        if (method != "HEAD") body.copyTo(out, BUFFER)
      }
      out.flush()
    } finally {
      upstream.disconnect()
    }
  }

  private fun serveFile(target: String, method: String, range: String?, out: OutputStream) {
    val file = File(URLDecoder.decode(target.removePrefix("file://"), "UTF-8"))
    if (!file.isFile) return writeHead(out, 404, mapOf("Content-Length" to "0")).also { out.flush() }
    val length = file.length()
    val (start, end) = range?.removePrefix("bytes=")?.split('-')?.let { (from, to) ->
      (from.toLongOrNull() ?: 0L) to (to.toLongOrNull() ?: (length - 1))
    } ?: (0L to length - 1)
    val type = if (file.extension.equals("mkv", true)) "video/x-matroska" else "video/mp4"
    val headers = mutableMapOf("Content-Type" to type, "Content-Length" to (end - start + 1).toString(), "Accept-Ranges" to "bytes")
    if (range != null) headers["Content-Range"] = "bytes $start-$end/$length"
    writeHead(out, if (range != null) 206 else 200, headers)
    if (method != "HEAD") {
      RandomAccessFile(file, "r").use { raf ->
        raf.seek(start)
        val buffer = ByteArray(BUFFER)
        var left = end - start + 1
        while (left > 0) {
          val read = raf.read(buffer, 0, minOf(buffer.size.toLong(), left).toInt())
          if (read < 0) break
          out.write(buffer, 0, read)
          left -= read
        }
      }
    }
    out.flush()
  }

  // Some CDNs send playlists as text/plain or octet-stream, so the first bytes decide too
  private fun isPlaylist(contentType: String?, target: String, body: BufferedInputStream): Boolean {
    if (contentType?.contains("mpegurl", ignoreCase = true) == true) return true
    if (target.substringBefore('?').endsWith(".m3u8", ignoreCase = true)) return true
    body.mark(7)
    val head = ByteArray(7)
    val read = body.read(head)
    body.reset()
    return read == 7 && String(head) == "#EXTM3U"
  }

  private fun rewrite(playlist: String, baseUrl: String, session: String): String {
    val base = URL(baseUrl)
    fun proxied(reference: String) = path(session, URL(base, reference.trim()).toString())
    return playlist.lines().joinToString("\n") { line ->
      when {
        line.isBlank() -> line
        line.startsWith("#") -> URI_ATTRIBUTE.replace(line) { "URI=\"${proxied(it.groupValues[1])}\"" }
        else -> proxied(line)
      }
    }
  }

  private fun writeHead(out: OutputStream, status: Int, headers: Map<String, String>) {
    val head = StringBuilder("HTTP/1.1 $status ${reason(status)}\r\n")
    (headers + CORS + ("Connection" to "close")).forEach { (name, value) -> head.append("$name: $value\r\n") }
    head.append("\r\n")
    out.write(head.toString().toByteArray(Charsets.ISO_8859_1))
  }

  private fun reason(status: Int) = when (status) {
    200 -> "OK"
    204 -> "No Content"
    206 -> "Partial Content"
    404 -> "Not Found"
    else -> "Status"
  }

  private fun readLine(input: InputStream): String? {
    val line = StringBuilder()
    while (true) {
      val byte = input.read()
      if (byte < 0) return if (line.isEmpty()) null else line.toString()
      if (byte == '\n'.code) return line.toString().trimEnd('\r')
      line.append(byte.toChar())
    }
  }

  // The Wi-Fi address the receiver can reach
  private fun lanAddress(): String =
    NetworkInterface.getNetworkInterfaces().asSequence()
      .filter { it.isUp && !it.isLoopback }
      .sortedByDescending { it.name.startsWith("wlan") }
      .flatMap { it.inetAddresses.asSequence() }
      .firstOrNull { it is Inet4Address && it.isSiteLocalAddress }
      ?.hostAddress ?: "127.0.0.1"
}
