import { TextTrackType } from 'react-native-video/src';
import { SUB_LANGUAGE } from '@/constants/config';

// The toolkit draws subtitle files itself, and reads only these
const SUBTITLE_EXTENSIONS = ['srt', 'vtt'];

/** The subtitle files the player takes, for a hint: ".srt or .vtt" */
export const SUBTITLE_FILE_TYPES = `${SUBTITLE_EXTENSIONS.slice(0, -1)
  .map((extension) => `.${extension}`)
  .join(', ')} or .${SUBTITLE_EXTENSIONS.at(-1)}`;

export const isSubtitleFile = (name: string) =>
  SUBTITLE_EXTENSIONS.includes(name.split('.').pop()?.toLowerCase() ?? '');

// Providers often leave out a subtitle's type (NetflixMirror sends .srt), and the toolkit parses a file as the type
// it's given
export const subtitleType = (uri: string) =>
  uri.split(/[?#]/)[0].toLowerCase().endsWith('.srt') ? TextTrackType.SUBRIP : TextTrackType.VTT;

/**
 * A subtitle's language as an ISO 639-2 code (`eng`), from a code or a provider's name ("English", "Portuguese -
 * Brazilian Portuguese"). MP4 needs codes, and the player matches languages across tracks and episodes by code.
 */
export const subtitleLanguageCode = (lang?: string) => {
  if (!lang) return undefined;
  if (/^[a-z]{3}$/.test(lang)) return lang;
  const name = (Object.keys(SUB_LANGUAGE) as (keyof typeof SUB_LANGUAGE)[]).find((key) =>
    lang.toLowerCase().startsWith(key.toLowerCase()),
  );
  return name ? SUB_LANGUAGE[name] : undefined;
};

/** A provider's seek-preview sprite list (thumbnails.vtt), which comes with the subtitles but isn't one */
export const isThumbnailTrack = (track: { kind?: string; lang?: string }) =>
  track.kind === 'thumbnails' || track.lang === 'thumbnails';
