#!/usr/bin/env node

/**
 * sync-versions.js
 *
 * This script synchronizes the version from package.json to Android's build.gradle
 * and iOS's Info.plist files in an Expo/React Native project.
 *
 * Usage: node sync-versions.js [version]
 * If version is not provided, it will use the version from package.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define project root directory (2 levels up from script directory)
// eslint-disable-next-line no-undef
const projectRoot = path.resolve(__dirname, '..', '..');

// Get the version from command line args or from package.json
let version;
if (process.argv.length > 2) {
  version = process.argv[2];
  //console.log(`Using provided version: ${version}`);
} else {
  try {
    // Read the version from package.json at project root
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    version = packageJson.version;
    //console.log(`Using version from package.json: ${version}`);
  } catch (error) {
    console.error(`Error reading package.json: ${error.message}`);
    process.exit(1);
  }
}

// Check if version follows semver
if (!version.match(/^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/)) {
  console.error('Error: Version does not follow semver format (e.g., 1.2.3 or 1.2.3-beta.1)');
  process.exit(1);
}

// Parse version components
const [mainVersion, preRelease] = version.split('-');
const [major, minor, patch] = mainVersion.split('.').map(Number);

// // Calculate versionCode from semantic version
// // This creates a numeric representation where each component has dedicated digits
// // But we'll ensure it increments by at least 1 from the previous value
let versionCode = 0;

// Update Android build.gradle
function updateBuildGradle() {
  const gradlePath = path.join(projectRoot, 'android/app/build.gradle');

  if (!fs.existsSync(gradlePath)) {
    //console.log('Android build.gradle not found. Skipping Android version update.');
    return;
  }

  try {
    let gradleContent = fs.readFileSync(gradlePath, 'utf8');

    // Get current versionCode if available
    const versionCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
    if (versionCodeMatch) {
      const currentVersionCode = parseInt(versionCodeMatch[1]);
      // Use the higher value between calculated versionCode and current + 1
      versionCode = Math.max(versionCode, currentVersionCode + 1);
    }

    // Update versionName
    gradleContent = gradleContent.replace(/versionName\s+["'](.+?)["']/, `versionName "${version}"`);

    // Update versionCode
    gradleContent = gradleContent.replace(/versionCode\s+(\d+)/, `versionCode ${versionCode}`);

    fs.writeFileSync(gradlePath, gradleContent);
    //console.log(`Updated Android build.gradle: versionName="${version}", versionCode=${versionCode}`);
  } catch (error) {
    console.error(`Error updating build.gradle: ${error.message}`);
  }
}

// Update iOS Info.plist
function updateInfoPlist() {
  try {
    const iosDir = path.join(projectRoot, 'ios');
    if (!fs.existsSync(iosDir)) {
      //console.log('iOS directory not found. Skipping iOS version update.');
      return;
    }

    const xcodeproj = fs.readdirSync(iosDir).find((file) => file.endsWith('.xcodeproj') && !file.includes('Pods'));

    if (!xcodeproj) {
      //console.log('iOS .xcodeproj not found. Skipping iOS version update.');
      return;
    }

    const plistPath = path.join(iosDir, xcodeproj.replace('.xcodeproj', ''), 'Info.plist');

    if (!fs.existsSync(plistPath)) {
      //console.log('iOS Info.plist not found. Skipping iOS version update.');
      return;
    }

    // Use PlistBuddy to modify Info.plist
    execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${version}" "${plistPath}"`, {
      stdio: 'inherit',
    });
    execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${versionCode}" "${plistPath}"`, { stdio: 'inherit' });
    //console.log(`Updated iOS Info.plist: CFBundleShortVersionString=${version}, CFBundleVersion=${versionCode}`);
  } catch (error) {
    console.error(`Error updating iOS Info.plist: ${error.message}`);
  }
}

// Update Expo's app.json if present
function updateAppJson() {
  const appJsonPath = path.join(projectRoot, 'app.json');

  if (!fs.existsSync(appJsonPath)) {
    //console.log('app.json not found. Skipping Expo config update.');
    return;
  }

  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

    if (appJson.expo) {
      // Update version
      appJson.expo.version = version;

      // Update Android versionCode
      if (appJson.expo.android) {
        appJson.expo.android.versionCode = versionCode;
      } else {
        appJson.expo.android = { versionCode };
      }

      // Update iOS buildNumber
      if (appJson.expo.ios) {
        appJson.expo.ios.buildNumber = String(versionCode);
      } else {
        appJson.expo.ios = { buildNumber: String(versionCode) };
      }

      fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
      //console.log(
        `Updated app.json: expo.version=${version}, android.versionCode=${versionCode}, ios.buildNumber=${versionCode}`,
      );
    }
  } catch (error) {
    console.error(`Error updating app.json: ${error.message}`);
  }
}

// Execute updates
updateBuildGradle();
updateInfoPlist();
updateAppJson();

//console.log('Version synchronization complete!');
