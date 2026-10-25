import NitroOtaBundleManager
internal import Expo
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // The window is created and React Native is started by `SceneDelegate` under the
    // scene-based life cycle (required by the iOS 27 SDK).
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
// React Native Orientation Director @generated begin @react-native-orientation-director/supportedInterfaceOrientationsFor-implementation - expo prebuild (DO NOT MODIFY) sync-147d50248b7b55d1acbe02fc03ff4cde90a30975

  public override func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return OrientationDirector.getSupportedInterfaceOrientationsForWindow()
  }

// React Native Orientation Director @generated end @react-native-orientation-director/supportedInterfaceOrientationsFor-implementation
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    // Check for OTA bundle
            if let bundlePath = NitroOtaBundleManager.shared.getStoredBundlePath() {
            let bundleURL = URL(fileURLWithPath: bundlePath)
            return bundleURL
            }

            // Fallback to default bundle
            return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
