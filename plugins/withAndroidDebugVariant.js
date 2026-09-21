const { withDangerousMod, withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Expo prebuild only generates android/app/src/main and a stock build.gradle.
// This plugin re-applies the app's Android debug customizations on every prebuild:
//   1. the whole debug source set (label "uwumi debug", debug icons, cleartext/network config)
//   2. the debug buildType tweaks in app/build.gradle (versionNameSuffix, optional applicationIdSuffix)

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 1. Copy plugins/android-debug -> android/app/src/debug
function withDebugSourceSet(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const src = path.join(config.modRequest.projectRoot, 'plugins', 'android-debug');
      const dest = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'debug');
      copyRecursive(src, dest);
      return config;
    },
  ]);
}

// 2. Inject build.gradle customizations that prebuild would otherwise wipe.

// 2a. debug buildType tweaks — injected after `signingConfig signingConfigs.debug`
const DEBUG_BUILD_TYPE_EXTRAS = `
            versionNameSuffix "-debug"
            // Only add .debug suffix when -PdebugSuffix is passed (for real devices)
            if (project.hasProperty('debugSuffix')) {
                applicationIdSuffix ".debug"
            }`;

// 2b. per-ABI split APKs + custom release APK naming — injected into android {}
// Built as an array so Groovy's ${...} interpolations aren't parsed by JS.
const SPLITS_AND_NAMING = [
  '',
  '    splits {',
  '        abi {',
  '            enable true',
  '            reset()',
  "            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'",
  '            universalApk false',
  '        }',
  '    }',
  '    applicationVariants.all { variant ->',
  '        variant.outputs.all { output ->',
  '            if (variant.buildType.name == "release") {',
  '                // Customize the output file name for release builds',
  '                def versionName = variant.versionName',
  '                // Get ABI name if it exists (like arm64-v8a)',
  '                def abiName = output.getFilter(com.android.build.OutputFile.ABI)',
  '                if (abiName != null) {',
  '                    outputFileName = "uwumi-${abiName}-v${versionName}.apk"',
  '                } else {',
  '                    outputFileName = "uwumi-universal-v${versionName}.apk"',
  '                }',
  '            }',
  '        }',
  '    }',
].join('\n');

function withBuildGradleCustomizations(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // 2a — debug buildType. Anchor on the buildTypes.debug block; the
    // signingConfigs.debug block is followed by storeFile, so this is unique.
    if (!contents.includes('versionNameSuffix "-debug"')) {
      const anchor = /(debug\s*\{\s*signingConfig\s+signingConfigs\.debug)/;
      if (anchor.test(contents)) {
        contents = contents.replace(anchor, `$1${DEBUG_BUILD_TYPE_EXTRAS}`);
      } else {
        console.warn(
          '[withAndroidDebugVariant] debug buildType anchor not found in app/build.gradle — ' +
            'versionNameSuffix/applicationIdSuffix NOT applied.',
        );
      }
    }

    // 2b — ABI splits + APK naming. Anchor on the namespace line (unique, always
    // present in the android {} block). Order inside android {} does not matter.
    if (!contents.includes('applicationVariants.all')) {
      const anchor = /(namespace\s+['"][^'"]+['"])/;
      if (anchor.test(contents)) {
        contents = contents.replace(anchor, `$1\n${SPLITS_AND_NAMING}`);
      } else {
        console.warn(
          '[withAndroidDebugVariant] namespace anchor not found in app/build.gradle — ' +
            'ABI splits / APK naming NOT applied.',
        );
      }
    }

    config.modResults.contents = contents;
    return config;
  });
}

// 3. Add the ffmpeg-kit ivy repo to the root build.gradle's allprojects block.
// The FFmpeg @aar is a transitive dep of :app, so :app must see this repo — the
// repo declared in the module's own build.gradle is not used for :app resolution.
const FFMPEG_IVY_REPO = [
  '    // FFmpeg AARs from the react-native-ffmpeg-kit fork\x27s GitHub Releases.',
  '    // Must be visible to :app so it can resolve the transitive @aar.',
  '    ivy {',
  '      url "https://github.com/2004durgesh/ffmpeg-kit/releases/download"',
  '      patternLayout {',
  '        artifact "[revision]/[artifact].[ext]"',
  '      }',
  '      metadataSources { artifact() }',
  '      content { includeGroup "com.arthenica.ffmpegkit" }',
  '    }',
].join('\n');

function withRootBuildGradleRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('2004durgesh/ffmpeg-kit/releases/download')) {
      return config; // already applied
    }

    const anchor = /(allprojects\s*\{\s*repositories\s*\{)/;
    if (anchor.test(contents)) {
      config.modResults.contents = contents.replace(anchor, `$1\n${FFMPEG_IVY_REPO}`);
    } else {
      console.warn(
        '[withAndroidDebugVariant] allprojects.repositories anchor not found in root build.gradle — ' +
          'the ffmpeg-kit ivy repo was NOT added; the FFmpeg @aar will fail to resolve.',
      );
    }
    return config;
  });
}

module.exports = function withAndroidDebugVariant(config) {
  config = withDebugSourceSet(config);
  config = withBuildGradleCustomizations(config);
  config = withRootBuildGradleRepo(config);
  return config;
};
