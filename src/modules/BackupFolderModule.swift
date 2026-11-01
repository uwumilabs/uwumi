// The app target imports Expo modules as internal (see AppDelegate.swift), so this module is internal too
internal import ExpoModulesCore
import Foundation

/**
 * A folder outside the app, picked once, that backups can be written to at any later launch. iOS only lets the app
 * into a picked folder until it closes; a bookmark of it, saved by the app, opens it again.
 */
@ExpoModule("BackupFolder")
final class BackupFolderModule: Module {
  /// A bookmark of a folder just picked through the system picker (which still has access to it), as base64
  @JS
  func bookmark(uri: String) throws -> String {
    guard let url = URL(string: uri) else { throw BackupFolderError("Not a folder: \(uri)") }
    let accessing = url.startAccessingSecurityScopedResource()
    defer { if accessing { url.stopAccessingSecurityScopedResource() } }
    return try url.bookmarkData().base64EncodedString()
  }

  /// The folder's name, to show where backups go
  @JS
  func name(bookmark: String) throws -> String {
    try withFolder(bookmark) { $0.lastPathComponent }
  }

  /// Writes a file into the folder, numbered when the name is taken; returns the name it got
  @JS
  func write(bookmark: String, name: String, contents: String) throws -> String {
    try withFolder(bookmark) { folder in
      let base = (name as NSString).deletingPathExtension
      var fileName = name
      var copy = 2
      while FileManager.default.fileExists(atPath: folder.appendingPathComponent(fileName).path) {
        fileName = "\(base) (\(copy)).json"
        copy += 1
      }
      try Data(contents.utf8).write(to: folder.appendingPathComponent(fileName), options: .atomic)
      return fileName
    }
  }

  /// The names of the files in the folder
  @JS
  func list(bookmark: String) throws -> [String] {
    try withFolder(bookmark) { try FileManager.default.contentsOfDirectory(atPath: $0.path) }
  }

  @JS
  func remove(bookmark: String, name: String) throws {
    try withFolder(bookmark) { try FileManager.default.removeItem(at: $0.appendingPathComponent(name)) }
  }

  private func withFolder<T>(_ bookmark: String, _ body: (URL) throws -> T) throws -> T {
    guard let data = Data(base64Encoded: bookmark) else { throw BackupFolderError("The backup location is unreadable") }
    var stale = false
    let folder: URL
    do {
      folder = try URL(resolvingBookmarkData: data, bookmarkDataIsStale: &stale)
    } catch {
      throw BackupFolderError("The backup location is gone. Choose it again")
    }
    guard folder.startAccessingSecurityScopedResource() else {
      throw BackupFolderError("uwumi can't open the backup location any more. Choose it again")
    }
    defer { folder.stopAccessingSecurityScopedResource() }
    return try body(folder)
  }
}

private struct BackupFolderError: LocalizedError {
  let errorDescription: String?
  init(_ message: String) { errorDescription = message }
}
