#!/usr/bin/env node

/**
 * Usage: node sync-versions.js [version]
 * If version is not provided, it will use the version from package.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// eslint-disable-next-line no-undef
const projectRoot = path.resolve(__dirname, '..', '..');

let version;
if (process.argv.length > 2) {
  version = process.argv[2];
} else {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    version = packageJson.version;
  } catch (error) {
    console.error(`Error reading package.json: ${error.message}`);
    process.exit(1);
  }
}

if (!version.match(/^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/)) {
  console.error('Error: Version does not follow semver format (e.g., 1.2.3 or 1.2.3-beta.1)');
  process.exit(1);
}

const [mainVersion, preRelease] = version.split('-');
const [major, minor, patch] = mainVersion.split('.').map(Number);

let versionCode = 0;

function updateBuildGradle() {
  const gradlePath = path.join(projectRoot, 'android/app/build.gradle');

  if (!fs.existsSync(gradlePath)) {
    return;
  }

  try {
    let gradleContent = fs.readFileSync(gradlePath, 'utf8');

    const versionCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
    if (versionCodeMatch) {
      const currentVersionCode = parseInt(versionCodeMatch[1]);
      versionCode = Math.max(versionCode, currentVersionCode + 1);
    }

    gradleContent = gradleContent.replace(/versionName\s+["'](.+?)["']/, `versionName "${version}"`);

    gradleContent = gradleContent.replace(/versionCode\s+(\d+)/, `versionCode ${versionCode}`);

    fs.writeFileSync(gradlePath, gradleContent);
  } catch (error) {
    console.error(`Error updating build.gradle: ${error.message}`);
  }
}

function updateInfoPlist() {
  try {
    const iosDir = path.join(projectRoot, 'ios');
    if (!fs.existsSync(iosDir)) {
      return;
    }

    const xcodeproj = fs.readdirSync(iosDir).find((file) => file.endsWith('.xcodeproj') && !file.includes('Pods'));

    if (!xcodeproj) {
      return;
    }

    const plistPath = path.join(iosDir, xcodeproj.replace('.xcodeproj', ''), 'Info.plist');

    if (!fs.existsSync(plistPath)) {
      return;
    }

    execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${version}" "${plistPath}"`, {
      stdio: 'inherit',
    });
    execSync(`/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${versionCode}" "${plistPath}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error updating iOS Info.plist: ${error.message}`);
  }
}

function updateAppJson() {
  const appJsonPath = path.join(projectRoot, 'app.json');

  if (!fs.existsSync(appJsonPath)) {
    return;
  }

  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

    if (appJson.expo) {
      appJson.expo.version = version;

      if (appJson.expo.android) {
        appJson.expo.android.versionCode = versionCode;
      } else {
        appJson.expo.android = { versionCode };
      }

      if (appJson.expo.ios) {
        appJson.expo.ios.buildNumber = String(versionCode);
      } else {
        appJson.expo.ios = { buildNumber: String(versionCode) };
      }

      fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
      console.log(
        `Updated app.json: expo.version=${version}, android.versionCode=${versionCode}, ios.buildNumber=${versionCode}`,
      );
    }
  } catch (error) {
    console.error(`Error updating app.json: ${error.message}`);
  }
}

updateBuildGradle();
updateInfoPlist();
updateAppJson();
