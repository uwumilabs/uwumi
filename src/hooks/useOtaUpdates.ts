import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { githubOTA, OTAUpdateManager } from 'react-native-nitro-ota';
import { EXTERNAL_LINKS } from '@/constants/config';

/**
 * Branch holding the OTA bundle for one native build. Keyed by the binary's version so a JS bundle only
 * reaches the native code it was built against; `src/scripts/publish-ota.sh` pushes to the same name.
 */
export const otaBranch = (appVersion: string, platform: string) => `ota-${appVersion}-${platform}`;

/**
 * Silent OTA updates: once the app has rendered, confirm the running bundle and download any newer one
 * for this binary. It takes effect on the next launch, so playback or reading is never interrupted.
 */
export function useOtaUpdates(isAppReady: boolean) {
  useEffect(() => {
    // Dev builds load JS from Metro
    if (__DEV__ || !isAppReady) return;
    // The binary's version, not package.json's, which an OTA bundle could change
    const appVersion = Application.nativeApplicationVersion;
    if (!appVersion) return;

    const { downloadUrl, versionUrl } = githubOTA({
      githubUrl: EXTERNAL_LINKS.GITHUB_REPOSITORY,
      otaVersionPath: 'ota.version.json',
      ref: otaBranch(appVersion, Platform.OS),
    });
    const manager = new OTAUpdateManager(downloadUrl, versionUrl);

    // The UI rendered, so this bundle works; otherwise a crash before this point rolls it back
    manager.confirm();
    const unsubscribe = manager.onRollback((record) =>
      console.warn(`OTA: rolled back ${record.fromVersion} -> ${record.toVersion} (${record.reason})`),
    );

    let cancelled = false;
    (async () => {
      try {
        const update = await manager.checkForUpdatesJS(appVersion);
        if (cancelled || !update?.hasUpdate || !update.isCompatible) return;
        await manager.downloadUpdate();
      } catch (error) {
        // Includes the normal case of no OTA published for this version yet (404)
        console.warn('OTA: update check failed', error);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isAppReady]);
}
