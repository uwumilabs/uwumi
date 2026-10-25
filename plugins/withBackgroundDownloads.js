const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

// What downloads need in the Android manifest, which prebuild doesn't generate on its own.
//   react-native-background-actions starts its service as a dataSync foreground service: Android 14+ throws unless
//   the manifest declares that type (the library's own manifest doesn't)
//   POST_NOTIFICATIONS: the app requests it at startup, and Android 13+ denies it outright if it isn't declared
const PERMISSIONS = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.WAKE_LOCK',
  'android.permission.MANAGE_EXTERNAL_STORAGE',
  'android.permission.WRITE_SETTINGS',
];
const DOWNLOAD_SERVICE = 'com.asterinet.react.bgactions.RNBackgroundActionsTask';

const withBackgroundDownloads = (config) =>
  withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    manifest['uses-permission'] = manifest['uses-permission'] ?? [];
    for (const name of PERMISSIONS) {
      if (manifest['uses-permission'].some((permission) => permission.$['android:name'] === name)) continue;
      manifest['uses-permission'].push({
        $: {
          'android:name': name,
          ...(name.endsWith('MANAGE_EXTERNAL_STORAGE') && { 'tools:ignore': 'ScopedStorage' }),
        },
      });
    }

    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    application.service = (application.service ?? []).filter(
      (service) => service.$['android:name'] !== DOWNLOAD_SERVICE,
    );
    application.service.push({
      $: { 'android:name': DOWNLOAD_SERVICE, 'android:foregroundServiceType': 'dataSync' },
    });
    return config;
  });

module.exports = withBackgroundDownloads;
