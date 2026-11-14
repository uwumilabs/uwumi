import { Platform, Share } from 'react-native';
import { seasonEpisodeLabel } from './episodes';
import { openBrowserAsync } from 'expo-web-browser';
import * as IntentLauncher from 'expo-intent-launcher';
import { File as FsFile } from 'expo-file-system';
import { Image as ExpoImage } from 'expo-image';
import { infoShareLink } from './routes';
import { CACHE_DIR, ensureDirectory, fileUri } from './files';

// In the app's own task: Android's default opens a second uwumi card in recents
export const openBrowser = (url: string) => openBrowserAsync(url, { createTask: false });

const FLAG_GRANT_READ_URI_PERMISSION = 1;

/**
 * Hands a downloaded video to another app. Android: an "Open with" for video players, through expo-file-system's
 * FileProvider, as other apps can't read the app's storage directly. iOS: the share sheet (Open in VLC, Save to Files).
 */
export const openVideoInOtherApp = async (fileUri: string, title?: string) => {
  if (Platform.OS === 'android') {
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: new FsFile(fileUri).contentUri,
      type: 'video/*',
      flags: FLAG_GRANT_READ_URI_PERMISSION,
      ...(title && { extra: { title } }),
    });
    return;
  }
  await Share.share({ url: fileUri, title });
};

/**
 * Shares an image. iOS shares the file itself, from the image cache, named after `title`. Android can only share text
 * without a native share module, so it shares the image's link, which chat apps show as a preview.
 */
export const shareImage = async (uri: string, title?: string) => {
  const cached = Platform.OS === 'ios' ? await ExpoImage.getCachePathAsync(uri) : null;
  if (cached) {
    const extension = /\.(jpe?g|png|webp|gif)(?:\?|$)/i.exec(uri)?.[1] ?? 'jpg';
    const base = (title ?? '').replace(/[\\/:*?"<>|]/g, '').trim() || 'image';
    const file = new FsFile(ensureDirectory(`${CACHE_DIR}/share`), `${base}.${extension}`);
    if (file.exists) file.delete();
    new FsFile(cached.startsWith('file:') ? cached : fileUri(cached)).copy(file);
    await Share.share({ url: file.uri });
    return;
  }
  await Share.share({ message: title ? `${title}\n${uri}` : uri });
};

/** Shares a link to a title's info page, or to one of its episodes */
export const shareMedia = (target: Parameters<typeof infoShareLink>[0]) => {
  const { title, episode, season } = target;
  const label = episode ? `${title ?? ''} · ${seasonEpisodeLabel(season, episode)}` : title;
  return Share.share({ message: `Watch ${label} on uwumi\n${infoShareLink(target)}` });
};
