import { File as FsFile } from 'expo-file-system';
import { FFmpegKit, ReturnCode } from 'react-native-ffmpeg-kit';
import type { VideoTrack } from 'react-native-video/src';
import { fsFile } from '@/utils/files';
import { loadThumbnailVtt, toThumbnailVtt, type SeekPreviewCue } from '@/utils/seekPreview';
import { ensureDownloadsFolder, resolveOutputFile, thumbnailsDir } from './files';

/** The provider's sprite sheets, downloaded into `dir`; the cues then name the local copies */
const copyProviderSprites = async (vttUrl: string, headers: Record<string, string> | undefined, dir: string) => {
  const cues = await loadThumbnailVtt(vttUrl, headers);
  if (!cues.length) throw new Error('The sprite list is empty');
  const names = new Map<string, string>();
  for (const uri of new Set(cues.map((cue) => cue.uri))) {
    const extension = uri.split(/[?#]/)[0]!.match(/\.(webp|jpe?g|png)$/i)?.[0] ?? '.jpg';
    const name = `sheet_${names.size}${extension}`;
    await FsFile.downloadFileAsync(uri, fsFile(`${dir}/${name}`), { headers, idempotent: true });
    names.set(uri, name);
  }
  return cues.map((cue) => ({ ...cue, uri: names.get(cue.uri)! }));
};

const SPRITE_WIDTH = 160;
const SPRITE_COLUMNS = 10;
const SPRITES_PER_SHEET = 100;

/**
 * Sprite sheets cut from the downloaded file, for sources that send none. Only keyframes are decoded, so it's quick,
 * and each tile is the keyframe nearest its time.
 */
const cutSprites = async (file: string, dir: string, duration: number, video?: VideoTrack) => {
  const interval = duration > 3600 ? 10 : 5;
  const height = video?.width && video.height ? Math.round((SPRITE_WIDTH * video.height) / video.width / 2) * 2 : 90;
  const session = await FFmpegKit.executeWithArguments([
    '-skip_frame',
    'nokey',
    '-i',
    file,
    '-an',
    '-sn',
    '-vf',
    `fps=1/${interval},scale=${SPRITE_WIDTH}:${height},tile=${SPRITE_COLUMNS}x${SPRITES_PER_SHEET / SPRITE_COLUMNS}`,
    '-vsync',
    'vfr',
    '-q:v',
    '5',
    '-y',
    `${dir}/sprite_%03d.jpg`,
  ]);
  const returnCode = await session.getReturnCode();
  if (!ReturnCode.isSuccess(returnCode)) throw new Error(`FFmpeg exited with code ${returnCode.getValue()}`);

  return Array.from({ length: Math.ceil(duration / interval) }, (_, i): SeekPreviewCue => {
    const tile = i % SPRITES_PER_SHEET;
    return {
      start: i * interval,
      end: Math.min((i + 1) * interval, duration),
      uri: `sprite_${String(Math.floor(i / SPRITES_PER_SHEET) + 1).padStart(3, '0')}.jpg`,
      x: (tile % SPRITE_COLUMNS) * SPRITE_WIDTH,
      y: Math.floor(tile / SPRITE_COLUMNS) * height,
      w: SPRITE_WIDTH,
      h: height,
      sheetWidth: SPRITE_WIDTH * SPRITE_COLUMNS,
      sheetHeight: height * (SPRITES_PER_SHEET / SPRITE_COLUMNS),
    };
  });
};

/**
 * Seek-bar sprites beside a finished download: the provider's when it sent some, else cut from the file. Returns the
 * sprite list's path, relative like `outputFile`.
 */
export const saveThumbnails = async (
  download: { outputFile: string; thumbnailsVtt?: string; headers?: Record<string, string> },
  duration: number,
  video?: VideoTrack,
) => {
  const relativeDir = thumbnailsDir(download.outputFile);
  const dir = resolveOutputFile(relativeDir);
  ensureDownloadsFolder(dir);
  let cues: SeekPreviewCue[] | undefined;
  if (download.thumbnailsVtt) {
    cues = await copyProviderSprites(download.thumbnailsVtt, download.headers, dir).catch((error) => {
      console.warn("Couldn't copy the provider's seek-preview sprites; cutting them from the file", error);
      return undefined;
    });
  }
  if (!cues) {
    if (!(duration > 0)) throw new Error('Unknown duration');
    cues = await cutSprites(resolveOutputFile(download.outputFile), dir, duration, video);
  }
  const vtt = fsFile(`${dir}/thumbnails.vtt`);
  if (vtt.exists) vtt.delete();
  vtt.create();
  await vtt.write(toThumbnailVtt(cues, (name) => name));
  return `${relativeDir}/thumbnails.vtt`;
};
