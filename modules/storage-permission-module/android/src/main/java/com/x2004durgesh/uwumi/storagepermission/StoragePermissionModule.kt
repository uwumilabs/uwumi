package com.x2004durgesh.uwumi.storagepermission

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class StoragePermissionModule : Module() {
  companion object {
    private const val REQUEST_CODE_STORAGE = 1001
    private const val REQUEST_CODE_MANAGE_STORAGE = 1002
  }

  private var pendingPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("StoragePermissionModule")

    // Get Android API level
    Function("getAndroidVersion") {
      return@Function Build.VERSION.SDK_INT
    }

    // Check if we have storage permission
    AsyncFunction("hasStoragePermission") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.resolve(false)
        return@AsyncFunction
      }

      try {
        val hasPermission = when {
          // Android 13+ (API 33+) - Check media permissions or manage storage
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
              Environment.isExternalStorageManager()
            } else {
              false
            }
          }
          // Android 11-12 (API 30-32) - Check MANAGE_EXTERNAL_STORAGE
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.R -> {
            Environment.isExternalStorageManager()
          }
          // Android 10 and below (API 29-) - Check WRITE_EXTERNAL_STORAGE
          else -> {
            ContextCompat.checkSelfPermission(
              activity,
              Manifest.permission.WRITE_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED
          }
        }
        promise.resolve(hasPermission)
      } catch (e: Exception) {
        android.util.Log.e("StoragePermission", "Error checking permission", e)
        promise.resolve(false)
      }
    }

    // Request storage permission
    AsyncFunction("requestStoragePermission") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "No current activity", null)
        return@AsyncFunction
      }

      try {
        when {
          // Android 13+ (API 33+) - Request MANAGE_EXTERNAL_STORAGE
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> {
            requestManageStoragePermission(activity, promise)
          }
          // Android 11-12 (API 30-32) - Request MANAGE_EXTERNAL_STORAGE
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.R -> {
            requestManageStoragePermission(activity, promise)
          }
          // Android 10 and below (API 29-) - Request WRITE_EXTERNAL_STORAGE
          else -> {
            requestLegacyStoragePermission(activity, promise)
          }
        }
      } catch (e: Exception) {
        android.util.Log.e("StoragePermission", "Error requesting permission", e)
        promise.reject("ERROR", "Failed to request permission: ${e.message}", e)
      }
    }

    // Open app settings
    AsyncFunction("openAppSettings") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "No current activity", null)
        return@AsyncFunction
      }

      try {
        val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
          data = Uri.fromParts("package", activity.packageName, null)
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        activity.startActivity(intent)
        promise.resolve(true)
      } catch (e: Exception) {
        android.util.Log.e("StoragePermission", "Error opening settings", e)
        promise.reject("ERROR", "Failed to open settings: ${e.message}", e)
      }
    }
  }

  private fun requestManageStoragePermission(activity: Activity, promise: Promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      if (Environment.isExternalStorageManager()) {
        promise.resolve(mapOf(
          "granted" to true,
          "status" to "granted"
        ))
        return
      }

      try {
        pendingPromise = promise
        val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
          data = Uri.fromParts("package", activity.packageName, null)
        }
        activity.startActivityForResult(intent, REQUEST_CODE_MANAGE_STORAGE)
        
        // Note: Since we can't intercept the result directly in Expo modules,
        // we'll resolve with a special status indicating user action is needed
        promise.resolve(mapOf(
          "granted" to false,
          "status" to "needs_settings"
        ))
      } catch (e: Exception) {
        android.util.Log.e("StoragePermission", "Failed to open manage storage settings", e)
        promise.reject("ERROR", "Failed to open storage settings: ${e.message}", e)
      }
    } else {
      promise.reject("UNSUPPORTED", "MANAGE_EXTERNAL_STORAGE not available on this Android version", null)
    }
  }

  private fun requestLegacyStoragePermission(activity: Activity, promise: Promise) {
    val permission = Manifest.permission.WRITE_EXTERNAL_STORAGE
    
    // Check if already granted
    if (ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED) {
      promise.resolve(mapOf(
        "granted" to true,
        "status" to "granted"
      ))
      return
    }

    // Check if we should show rationale
    val shouldShowRationale = ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
    
    if (shouldShowRationale) {
      promise.resolve(mapOf(
        "granted" to false,
        "status" to "denied",
        "canAskAgain" to true
      ))
      return
    }

    // Request permission
    pendingPromise = promise
    ActivityCompat.requestPermissions(activity, arrayOf(permission), REQUEST_CODE_STORAGE)
    
    // For simplicity, we'll resolve immediately since we can't easily intercept the result
    // The app should call hasStoragePermission() after this to check the result
    promise.resolve(mapOf(
      "granted" to false,
      "status" to "pending"
    ))
  }
}
