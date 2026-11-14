import { TextTrackType } from 'react-native-video/src';

const SUBTITLE_EXTENSIONS = ['srt', 'vtt', 'ttml', 'dfxp'];

/** The subtitle files the player takes, for a hint: ".srt, .vtt, .ttml or .dfxp" */
export const SUBTITLE_FILE_TYPES = `${SUBTITLE_EXTENSIONS.slice(0, -1)
  .map((extension) => `.${extension}`)
  .join(', ')} or .${SUBTITLE_EXTENSIONS.at(-1)}`;

export const isSubtitleFile = (name: string) =>
  SUBTITLE_EXTENSIONS.includes(name.split('.').pop()?.toLowerCase() ?? '');

// Providers often leave out a subtitle's type (NetflixMirror sends .srt), and ExoPlayer fails the whole source
// when a track doesn't parse as the type it's given
export const subtitleType = (uri: string) => {
  const path = uri.split(/[?#]/)[0].toLowerCase();
  if (path.endsWith('.srt')) return TextTrackType.SUBRIP;
  if (path.endsWith('.ttml') || path.endsWith('.dfxp')) return TextTrackType.TTML;
  return TextTrackType.VTT;
};

/** A provider's seek-preview sprite list (thumbnails.vtt), which comes with the subtitles but isn't one */
export const isThumbnailTrack = (track: { kind?: string; lang?: string }) =>
  track.kind === 'thumbnails' || track.lang === 'thumbnails';
