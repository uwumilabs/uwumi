// The app target imports Expo modules as internal (see AppDelegate.swift), so this module is internal too
internal import ExpoModulesCore

@ExpoModule("ExcludeFromBackup")
final class ExcludeFromBackupModule: Module {
  // A folder's flag covers everything inside it
  @JS
  func exclude(path: String) throws {
    var url = URL(fileURLWithPath: path)
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try url.setResourceValues(values)
  }
}
