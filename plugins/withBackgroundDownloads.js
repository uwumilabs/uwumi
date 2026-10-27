const fs = require('fs');
const path = require('path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

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
// The download notification's small icon (taskIcon in useDownloadStore); without it the service throws
// "Task icon not found". 96 px is 24 dp at xxxhdpi, and Android scales it down for lower densities
const NOTIFICATION_ICON = 'assets/images/notification.png';
const NOTIFICATION_ICON_RES = 'app/src/main/res/drawable-xxxhdpi/notification_icon.png';

// Downloads live in the app's files (DOWNLOADS_DIR in src/constants/config.ts; uwumi-dev in debug builds). Android's
// backup stops for an app over 25 MB, so episodes would also cost the extensions and settings their backup; they stay
// out of it, as iOS keeps them out of iCloud. fullBackupContent covers Android 11 and older, dataExtractionRules 12+
const DOWNLOAD_EXCLUDES = ['uwumi/downloads', 'uwumi-dev/downloads']
  .map((dir) => `    <exclude domain="file" path="${dir}" />`)
  .join('\n');
const BACKUP_RULES = {
  backup_rules: `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
${DOWNLOAD_EXCLUDES.replace(/^ {2}/gm, '')}
</full-backup-content>
`,
  data_extraction_rules: `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup>
${DOWNLOAD_EXCLUDES}
  </cloud-backup>
  <device-transfer>
${DOWNLOAD_EXCLUDES}
  </device-transfer>
</data-extraction-rules>
`,
};

const withBackupRules = (config) =>
  withDangerousMod(config, [
    'android',
    async (config) => {
      const dir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(dir, { recursive: true });
      for (const [name, xml] of Object.entries(BACKUP_RULES)) fs.writeFileSync(path.join(dir, `${name}.xml`), xml);
      return config;
    },
  ]);

const withNotificationIcon = (config) =>
  withDangerousMod(config, [
    'android',
    async (config) => {
      const target = path.join(config.modRequest.platformProjectRoot, NOTIFICATION_ICON_RES);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(config.modRequest.projectRoot, NOTIFICATION_ICON), target);
      return config;
    },
  ]);

const withBackgroundDownloads = (config) =>
  withAndroidManifest(withBackupRules(withNotificationIcon(config)), (config) => {
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
    application.$['android:fullBackupContent'] = '@xml/backup_rules';
    application.$['android:dataExtractionRules'] = '@xml/data_extraction_rules';
    application.service = (application.service ?? []).filter(
      (service) => service.$['android:name'] !== DOWNLOAD_SERVICE,
    );
    application.service.push({
      $: { 'android:name': DOWNLOAD_SERVICE, 'android:foregroundServiceType': 'dataSync' },
    });
    return config;
  });

module.exports = withBackgroundDownloads;
