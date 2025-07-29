package com.x2004durgesh.uwumi.fullscreen

import android.os.Build
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class FullscreenModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FullscreenModule")

    // Add async versions for better performance
    AsyncFunction("enterFullscreen") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      
      activity.runOnUiThread {
        try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // For Android 11+ (API 30+) - Batch all operations
            val controller = activity.window.insetsController
            if (controller != null) {
              // Set behavior first, then hide
              controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
              controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
            }
            // Batch window color changes
            activity.window.apply {
              navigationBarColor = 0x00000000
              statusBarColor = 0x00000000
            }
          } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // For Android 9-10 (API 28-29) - Batch all UI flags
            activity.window.apply {
              @Suppress("DEPRECATION")
              attributes.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
              
              // Batch all system UI flags in one call
              @Suppress("DEPRECATION")
              decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_FULLSCREEN
              )
              
              // Batch color changes
              navigationBarColor = 0x00000000
              statusBarColor = 0x00000000
            }
          } else {
            // For older versions - batch operations
            activity.window.apply {
              @Suppress("DEPRECATION")
              addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
              navigationBarColor = 0x00000000
              statusBarColor = 0x00000000
            }
          }
          promise.resolve(true)
        } catch (e: Exception) {
          // Log error but don't crash
          android.util.Log.e("FullscreenModule", "Error entering fullscreen", e)
          promise.resolve(false)
        }
      }
    }

    AsyncFunction("exitFullscreen") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      
      activity.runOnUiThread {
        try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // For Android 11+ (API 30+) - Batch operations
            val controller = activity.window.insetsController
            if (controller != null) {
              // Show system bars and reset behavior
              controller.show(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
              controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_BARS_BY_TOUCH
            }
          } else {
            // For Android 10 and below (API 29-) - Batch all flag operations
            activity.window.apply {
              @Suppress("DEPRECATION")
              clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
              
              @Suppress("DEPRECATION")
              decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
            }
          }
          promise.resolve(true)
        } catch (e: Exception) {
          // Log error but don't crash
          android.util.Log.e("FullscreenModule", "Error exiting fullscreen", e)
          promise.resolve(false)
        }
      }
    }

    Function("isFullscreen") {
      val activity = appContext.currentActivity ?: return@Function false

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        // For Android 11+ (API 30+)
        val controller = activity.window.insetsController
        return@Function controller?.systemBarsBehavior ==
                WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      } else {
        // For Android 10 and below (API 29-)
        @Suppress("DEPRECATION") val flags = activity.window.decorView.systemUiVisibility
        return@Function (flags and View.SYSTEM_UI_FLAG_FULLSCREEN) != 0
      }
    }
  }
}
