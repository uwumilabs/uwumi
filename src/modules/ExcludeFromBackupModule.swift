import ExpoModulesCore

@ExpoModule("ExcludeFromBackup")
public final class ExcludeFromBackupModule: Module {
  // A folder's flag covers everything inside it
  @JS
  func exclude(path: String) throws {
    var url = URL(fileURLWithPath: path)
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try url.setResourceValues(values)
  }
}
