import NitroOtaBundleManager
internal import Expo
// @generated begin react-native-google-cast-import - expo prebuild (DO NOT MODIFY) sync-4cd300bca26a1d1fcc83f4baf37b0e62afcc1867
#if canImport(GoogleCast) && os(iOS)
import GoogleCast
#endif
// @generated end react-native-google-cast-import
import React
import ReactAppDependencyProvider
// React Native Orientation Director @generated begin @react-native-orientation-director/library-import - expo prebuild (DO NOT MODIFY) sync-086b1a32084aa583b0c6bb0d2f672026498a6649
import OrientationDirector
// React Native Orientation Director @generated end @react-native-orientation-director/library-import

@main
class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
// @generated begin react-native-google-cast-didFinishLaunchingWithOptions - expo prebuild (DO NOT MODIFY) sync-b83f3fabf49797475a3f26a5bfeb5cfd51fa39c4
#if canImport(GoogleCast) && os(iOS)
    let receiverAppID = kGCKDefaultMediaReceiverApplicationID
    let criteria = GCKDiscoveryCriteria(applicationID: receiverAppID)
    let options = GCKCastOptions(discoveryCriteria: criteria)
    options.disableDiscoveryAutostart = false
    options.startDiscoveryAfterFirstTapOnCastButton = true
    options.suspendSessionsWhenBackgrounded = true
    GCKCastContext.setSharedInstanceWith(options)
    GCKCastContext.sharedInstance().useDefaultExpandedMediaControls = true
#endif
// @generated end react-native-google-cast-didFinishLaunchingWithOptions
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // The window is created and React Native is started by `SceneDelegate` under the
    // scene-based life cycle (required by the iOS 27 SDK).
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
// React Native Orientation Director @generated begin @react-native-orientation-director/supportedInterfaceOrientations-implementation - expo prebuild (DO NOT MODIFY) sync-68858d1d7ce6b3de98fb0b6949250dd1c78f36f4

  public override func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return SharedOrientationDirectorImpl.shared.supportedInterfaceOrientations
  }

// React Native Orientation Director @generated end @react-native-orientation-director/supportedInterfaceOrientations-implementation
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
