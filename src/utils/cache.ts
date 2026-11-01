import { Platform } from 'react-native';
import { Image } from 'expo-image';
import { Paths } from 'expo-file-system';
import { useDownloadStore } from '@/hooks/stores/useDownloadStore';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';

// Cleared through expo-image rather than deleted from under its cache
const IMAGE_CACHE = Platform.OS === 'ios' ? 'com.hackemist.SDImageCache' : 'image_manager_disk_cache';
// The download store empties it itself, and only while no download is writing to it
const DOWNLOAD_TEMP = 'ffmpeg_temp';
// Expo's own state, and the assets (fonts) it has loaded from here
const KEEP = /^(\.|ExponentAsset-)/;

/** What the cache folder holds: video stream cache, images, WebView data, download leftovers */
export const cacheSize = () => Paths.cache.size ?? 0;

/**
 * Empties the cache folder, as the system's "Clear cache" would, keeping only what's in use. Video segments,
 * posters and thumbnails download again as they're needed.
 */
export const clearCache = async () => {
  await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()]);
  for (const entry of Paths.cache.list()) {
    if (KEEP.test(entry.name) || entry.name === IMAGE_CACHE || entry.name === DOWNLOAD_TEMP) continue;
    try {
      entry.delete();
    } catch {
      // In use, or already gone
    }
  }
  const downloading = Object.values(useDownloadStore.getState().downloads).some(
    ({ status }) => status === 'pending' || status === 'downloading',
  );
  if (!downloading) await useDownloadStore.getState().cleanupTempFiles();
};

export const clearCacheOnLaunch = () => {
  if (usePreferencesStore.getState().clearCacheOnLaunch) clearCache();
};
