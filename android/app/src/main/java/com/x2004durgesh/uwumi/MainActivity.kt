package com.x2004durgesh.uwumi
import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

// React Native Orientation Director @generated begin @react-native-orientation-director/system-intent-import - expo prebuild (DO NOT MODIFY) sync-e6b9f54e19ab3cfd8689165dc8aa1ae37ba84e44
import android.content.Intent
// React Native Orientation Director @generated end @react-native-orientation-director/system-intent-import
// React Native Orientation Director @generated begin @react-native-orientation-director/system-configuration-import - expo prebuild (DO NOT MODIFY) sync-e946440a29a0e93549862b7c63f1655b232ef6fb
import android.content.res.Configuration
// React Native Orientation Director @generated end @react-native-orientation-director/system-configuration-import
// React Native Orientation Director @generated begin @react-native-orientation-director/library-import - expo prebuild (DO NOT MODIFY) sync-7169e02357214d7bab1282e0a498c9c731ada6ad
import com.orientationdirector.implementation.ConfigurationChangedBroadcastReceiver
// React Native Orientation Director @generated end @react-native-orientation-director/library-import
class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)
  }
// React Native Orientation Director @generated begin @react-native-orientation-director/supportedInterfaceOrientationsFor-implementation - expo prebuild (DO NOT MODIFY) sync-7a5cdf10057b2ddf1bcf4593bf408862cbed5473

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)

    val orientationDirectorCustomAction =
      packageName + "." + ConfigurationChangedBroadcastReceiver.CUSTOM_INTENT_ACTION

    val intent =
      Intent(orientationDirectorCustomAction).apply {
        putExtra("newConfig", newConfig)
        setPackage(packageName)
      }

    this.sendBroadcast(intent)
  }

// React Native Orientation Director @generated end @react-native-orientation-director/supportedInterfaceOrientationsFor-implementation

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
