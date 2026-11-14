import type { Directory } from 'expo-file-system';
import { DOWNLOADS_DIR, ensureDirectory, fsDirectory, fsFile } from '@/utils/files';
import { excludeFromBackup } from '@/modules/excludeFromBackup';

/** Downloads store their file relative to the downloads folder, which iOS moves with the app container */
export const resolveOutputFile = (file: string) => (file.startsWith('/') ? file : `${DOWNLOADS_DIR}/${file}`);

export const relativeOutputFile = (path: string) => path.slice(DOWNLOADS_DIR.length + 1);

/** A folder for downloads, kept out of iCloud backups: episodes are large and can be downloaded again */
export const ensureDownloadsFolder = (path: string) => {
  try {
    ensureDirectory(path);
    excludeFromBackup(path);
  } catch (error) {
    // Writing into it fails later with FFmpeg's own error, which the download shows
    console.error(`❌ Failed to create directory ${path}:`, error);
  }
};

/** The folder beside a download that holds its seek-preview sprites ("E01 - Name.thumbs") */
export const thumbnailsDir = (outputFile: string) => outputFile.replace(/\.[^./]+$/, '') + '.thumbs';

export const deleteOutputFile = (outputFile: string) => {
  try {
    const file = fsFile(resolveOutputFile(outputFile));
    if (file.exists) file.delete();
    const sprites = fsDirectory(resolveOutputFile(thumbnailsDir(outputFile)));
    if (sprites.exists) sprites.delete();
    // The show's and season's folders go with their last episode
    const root = fsDirectory(DOWNLOADS_DIR).uri.replace(/\/$/, '');
    const insideRoot = (folder: Directory) => folder.uri.replace(/\/$/, '').startsWith(`${root}/`);
    for (let folder = file.parentDirectory; insideRoot(folder) && folder.exists && folder.list().length === 0; ) {
      const parent = folder.parentDirectory;
      folder.delete();
      folder = parent;
    }
  } catch (error) {
    console.error(`❌ Failed to delete file: ${outputFile}`, error);
  }
};

// Characters that break file paths: separators, reserved ones, control characters
const pathSegment = (s: string) =>
  s
    // eslint-disable-next-line no-control-regex
    .replace(/[/\\:*?"<>|\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** <Title>/Season <N>/E01 - <Episode name>.mp4, the season folder only when the source has seasons */
export const outputPathFor = ({
  showName,
  season,
  episode,
  name,
}: {
  showName?: string;
  season?: number;
  episode: number;
  name?: string;
}) => {
  let showDir = DOWNLOADS_DIR;
  if (showName) {
    showDir = `${DOWNLOADS_DIR}/${pathSegment(showName)}`;
    if (season) showDir += `/Season ${season}`;
    ensureDownloadsFolder(showDir);
  }
  const episodeLabel = `E${String(episode).padStart(2, '0')}`;
  const episodeName = pathSegment(name ?? '');
  // Skip names that only repeat the number, e.g. "Episode 1"
  const filename =
    episodeName && !/^episode\s*\d+$/i.test(episodeName)
      ? `${episodeLabel} - ${episodeName}.mp4`
      : `${episodeLabel}.mp4`;
  return `${showDir}/${filename}`;
};
