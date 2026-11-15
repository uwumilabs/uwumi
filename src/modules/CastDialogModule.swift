// The app target imports Expo modules as internal (see AppDelegate.swift), so this module is internal too
internal import ExpoModulesCore
import GoogleCast
import UIKit

/// Colours Google's Cast dialogs: the device list, the connected device's controls and "No devices available"
@ExpoModule("CastDialogModule")
final class CastDialogModule: Module {
  @JS
  func setTheme(name: String, background: String, text: String, secondaryText: String, accent: String) async {
    await MainActor.run {
      let style = GCKUIStyle.sharedInstance()
      let dialogs = style.castViews.deviceControl
      let accentColor = UIColor(hex: accent)
      dialogs.backgroundColor = UIColor(hex: background)
      dialogs.headingTextColor = UIColor(hex: text)
      dialogs.bodyTextColor = UIColor(hex: text)
      dialogs.captionTextColor = UIColor(hex: secondaryText)
      dialogs.iconTintColor = UIColor(hex: text)
      dialogs.buttonTextColor = accentColor
      dialogs.volumeSliderMinimumTrackTintColor = accentColor
      dialogs.volumeSliderThumbTintColor = accentColor
      style.apply()
    }
  }
}

private extension UIColor {
  convenience init(hex: String) {
    let value = UInt32(hex.dropFirst(), radix: 16) ?? 0
    self.init(
      red: CGFloat((value >> 16) & 0xFF) / 255,
      green: CGFloat((value >> 8) & 0xFF) / 255,
      blue: CGFloat(value & 0xFF) / 255,
      alpha: 1
    )
  }
}
