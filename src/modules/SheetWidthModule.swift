// The app target imports Expo modules as internal (see AppDelegate.swift), so this module is internal too
internal import ExpoModulesCore
import UIKit

/// A view to place in a sheet's content: on an iPhone in landscape a sheet spans the screen, which neither SwiftUI nor
/// @expo/ui can change. Attached to the bottom edge instead, the sheet's width follows its preferred width, which this
/// sets to `maxWidth` (Material 3's sheet width, as on Android).
@ExpoModule("SheetWidthModule")
final class SheetWidthModule: Module {
  func definition() -> ModuleDefinition {
    View(SheetWidthView.self) {
      Prop("maxWidth") { (view: SheetWidthView, maxWidth: Double) in
        view.maxWidth = CGFloat(maxWidth)
        view.limitSheet()
      }
    }
  }
}

final class SheetWidthView: ExpoView {
  var maxWidth: CGFloat = 640

  override func didMoveToWindow() {
    super.didMoveToWindow()
    limitSheet()
  }

  func limitSheet() {
    guard window != nil, let controller = owningController() else {
      return
    }
    // The sheet's own hosting controller is the root of the owning controller's parents
    var root = controller
    while let parent = root.parent {
      root = parent
    }
    guard let sheet = root.sheetPresentationController else {
      return
    }
    sheet.animateChanges {
      sheet.prefersEdgeAttachedInCompactHeight = true
      sheet.widthFollowsPreferredContentSizeWhenEdgeAttached = true
      root.preferredContentSize = CGSize(width: maxWidth, height: root.preferredContentSize.height)
    }
  }

  private func owningController() -> UIViewController? {
    var responder: UIResponder? = next
    while let current = responder {
      if let controller = current as? UIViewController {
        return controller
      }
      responder = current.next
    }
    return nil
  }
}
