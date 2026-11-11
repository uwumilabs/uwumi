import { Directory, File as FsFile, Paths } from 'expo-file-system';

// Plain paths, as FFmpeg takes them and downloads store them; fsFile/fsDirectory turn them back into URIs
const pathFromUri = (uri: string) => decodeURIComponent(uri.replace(/^file:\/\//, '')).replace(/\/$/, '');

const APP_DIR_NAME = __DEV__ ? 'uwumi-dev' : 'uwumi';
export const UWUMI_DIR = `${pathFromUri(Paths.document.uri)}/${APP_DIR_NAME}`;
export const CACHE_DIR = pathFromUri(Paths.cache.uri);
// In the app's own storage, so files can't be deleted from under the app
export const DOWNLOADS_DIR = `${UWUMI_DIR}/downloads`;

/** A plain path as a file:// URI, each segment encoded, so names with spaces, # or ? survive */
export const fileUri = (path: string) => `file://${path.split('/').map(encodeURIComponent).join('/')}`;
export const fsFile = (path: string) => new FsFile(fileUri(path));
export const fsDirectory = (path: string) => new Directory(fileUri(path));

export const ensureDirectory = (path: string) => {
  const folder = fsDirectory(path);
  if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
  return folder;
};
