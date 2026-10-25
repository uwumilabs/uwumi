# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# @generated begin expo-build-properties - expo prebuild (DO NOT MODIFY)
# Room (WorkManager, pulled in by nitro-ota) creates its generated database by reflection at launch
-keep class * extends androidx.room.RoomDatabase { <init>(); }
# Nitro creates its Kotlin hybrid objects from C++ over JNI, which R8 can't see
-keep class com.margelo.nitro.** { *; }
# ffmpeg-kit's native code finds FFmpegKitConfig/AbiDetect and their callbacks by name
-keep class com.arthenica.ffmpegkit.** { *; }
# @generated end expo-build-properties