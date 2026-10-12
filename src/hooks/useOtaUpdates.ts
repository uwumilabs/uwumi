import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { getStoredOtaVersion, OTAUpdateManager } from 'react-native-nitro-ota';
import { EXTERNAL_LINKS } from '@/constants/config';
import { useOtaUpdateStore } from './stores/useOtaUpdateStore';

/**
 * OTA bundles are assets on the binary's own GitHub release (tag v<version>, as release-it creates it), so a
 * JS bundle only reaches the native code it was built against; `src/scripts/publish-ota.sh` uploads them.
 */
export const otaAssetUrl = (appVersion: string, name: string) =>
  `${EXTERNAL_LINKS.GITHUB_REPOSITORY}/releases/download/v${appVersion}/${name}`;

/**
 * The OTA bundle this session is running, or null for the built-in one. Read at startup: once an update
 * downloads, the stored version moves ahead of what's running until the next launch.
 */
export const runningOtaVersion = getStoredOtaVersion();

/**
 * OTA updates: once the app has rendered, confirm the running bundle and download any newer one for this
 * binary, reporting progress to useOtaUpdateStore (shown by OtaUpdateToast). It takes effect on the next
 * launch unless the user restarts from the toast, so playback or reading is never interrupted.
 */
export function useOtaUpdates(isAppReady: boolean) {
  useEffect(() => {
    // Dev builds load JS from Metro
    if (__DEV__ || !isAppReady) return;
    // The binary's version, not package.json's, which an OTA bundle could change
    const appVersion = Application.nativeApplicationVersion;
    if (!appVersion) return;

    const manager = new OTAUpdateManager(
      otaAssetUrl(appVersion, `ota-${Platform.OS}.zip`),
      otaAssetUrl(appVersion, `ota-${Platform.OS}.json`),
    );

    // The UI rendered, so this bundle works; otherwise a crash before this point rolls it back
    manager.confirm();
    const unsubscribe = manager.onRollback((record) =>
      console.warn(`OTA: rolled back ${record.fromVersion} -> ${record.toVersion} (${record.reason})`),
    );

    const { setDownloading, setPercent, setReady, reset } = useOtaUpdateStore.getState();
    let cancelled = false;
    (async () => {
      try {
        const update = await manager.checkForUpdatesJS(appVersion);
        // No metadata means the response wasn't our manifest: nitro-ota reads an error page such as GitHub's
        // "Not Found" (no OTA for this version yet, or mid-publish) as a new version
        if (cancelled || !update?.metadata || !update.hasUpdate || !update.isCompatible) return;
        setDownloading();
        let lastPercent = -1;
        await manager.downloadUpdate((received, total) => {
          if (total <= 0) return;
          const percent = Math.floor((received / total) * 100);
          // A failed patch falls back to the full bundle, so this can restart from 0
          if (percent === lastPercent) return;
          lastPercent = percent;
          setPercent(percent);
        });
        if (!cancelled) setReady();
      } catch (error) {
        reset();
        console.warn('OTA: update failed', error);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isAppReady]);
}
