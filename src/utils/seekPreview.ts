/** One seek-bar preview: the tile of a sprite sheet that shows `start`–`end` */
export interface SeekPreviewCue {
  start: number;
  end: number;
  /** The sheet the tile is cut from */
  uri: string;
  x: number;
  y: number;
  w: number;
  h: number;
  sheetWidth: number;
  sheetHeight: number;
}

const toSeconds = (time: string) =>
  time
    .trim()
    .split(':')
    .reduce((total, part) => total * 60 + Number(part), 0);

const formatVttTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s}`;
};

/** A sprite path from a VTT, made absolute against the VTT's own URL */
const resolveUrl = (path: string, base: string) => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  const [protocol, rest = ''] = base.split('//');
  if (path.startsWith('//')) return `${protocol}${path}`;
  if (path.startsWith('/')) return `${protocol}//${rest.split('/')[0]}${path}`;
  const dir = base.split(/[?#]/)[0]!;
  return `${dir.slice(0, dir.lastIndexOf('/') + 1)}${path}`;
};

/**
 * A WebVTT sprite list ("00:00:05.000 --> 00:00:10.000" then "sprite_0.webp#xywh=160,0,160,90") as cues. A sheet's
 * size isn't in the file, so it's the extent of its tiles.
 */
export const parseThumbnailVtt = (text: string, vttUrl: string): SeekPreviewCue[] => {
  const cues: Omit<SeekPreviewCue, 'sheetWidth' | 'sheetHeight'>[] = [];
  for (const block of text.replace(/\r/g, '').split(/\n{2,}/)) {
    const lines = block.split('\n');
    const timing = lines.findIndex((line) => line.includes('-->'));
    const target = timing >= 0 ? lines[timing + 1]?.trim() : undefined;
    if (!target) continue;
    const [from, to] = lines[timing]!.split('-->');
    const [path, fragment] = target.split('#xywh=');
    const [x, y, w, h] = (fragment ?? '').split(',').map(Number);
    if (![x, y, w, h].every((n) => Number.isFinite(n)) || !path) continue;
    cues.push({
      start: toSeconds(from!),
      end: toSeconds(to!.trim().split(/\s/)[0]!),
      uri: resolveUrl(path, vttUrl),
      x: x!,
      y: y!,
      w: w!,
      h: h!,
    });
  }

  const sheets = new Map<string, { width: number; height: number }>();
  for (const cue of cues) {
    const sheet = sheets.get(cue.uri) ?? { width: 0, height: 0 };
    sheets.set(cue.uri, { width: Math.max(sheet.width, cue.x + cue.w), height: Math.max(sheet.height, cue.y + cue.h) });
  }
  return cues
    .map((cue) => ({ ...cue, sheetWidth: sheets.get(cue.uri)!.width, sheetHeight: sheets.get(cue.uri)!.height }))
    .sort((a, b) => a.start - b.start);
};

/** The cues as a WebVTT sprite list, with each sheet named by `name` (e.g. a local file name) */
export const toThumbnailVtt = (cues: SeekPreviewCue[], name: (uri: string) => string) =>
  [
    'WEBVTT',
    ...cues.map(
      (cue) =>
        `${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}\n${name(cue.uri)}#xywh=${cue.x},${cue.y},${cue.w},${cue.h}`,
    ),
  ].join('\n\n') + '\n';

/** The cue showing `time` (cues sorted by start) */
export const findCue = (cues: SeekPreviewCue[], time: number) => {
  let low = 0;
  let high = cues.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const cue = cues[mid]!;
    if (time < cue.start) high = mid - 1;
    else if (time >= cue.end) low = mid + 1;
    else return cue;
  }
  return cues[Math.min(Math.max(high, 0), cues.length - 1)];
};
