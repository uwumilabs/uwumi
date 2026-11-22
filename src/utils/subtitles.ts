import { SUB_LANGUAGE } from '@/constants/config';
import type { SubtitleTrack } from '@/constants/types';

type SubtitleFormat = NonNullable<SubtitleTrack['format']>;

// The toolkit draws subtitle files itself, and reads only these
const SUBTITLE_EXTENSIONS: SubtitleFormat[] = ['srt', 'vtt'];

/** For a hint */
export const SUBTITLE_FILE_TYPES = SUBTITLE_EXTENSIONS.map((extension) => `.${extension}`).join(' or ');

/**
 * A subtitle file's format from its name or URL. Providers often leave it out of the URL; then it's unset, and the
 * player tells from the file.
 */
export const subtitleFormat = (name: string): SubtitleFormat | undefined => {
  const extension = name.split(/[?#]/)[0].split('/').pop()?.split('.').pop()?.toLowerCase();
  return SUBTITLE_EXTENSIONS.find((format) => format === extension);
};

export const isSubtitleFile = (name: string) => subtitleFormat(name) !== undefined;

// OpenSubtitles' own ids for regional variants, which aren't ISO 639-2
const ISO_FOR_OPENSUBTITLES_ID: Record<string, string> = {
  pob: 'por',
  pom: 'por',
  spn: 'spa',
  spl: 'spa',
  scc: 'srp',
  zhc: 'chi',
  zht: 'chi',
  zhe: 'chi',
};

// Longest first, so "Portuguese (BR)" isn't taken for "Portuguese"
const LANGUAGE_NAMES = (Object.keys(SUB_LANGUAGE) as (keyof typeof SUB_LANGUAGE)[]).sort((a, b) => b.length - a.length);

/**
 * A subtitle's language as an ISO 639-2 code (`eng`), from an OpenSubtitles language id or a provider's name ("English",
 * "Portuguese - Brazilian Portuguese"). MP4 needs these codes, and the player matches languages across tracks and
 * episodes by code. A 2-letter code passes through as it is.
 */
export const subtitleLanguageCode = (lang?: string): string | undefined => {
  const text = lang?.trim().toLowerCase();
  if (!text) return undefined;
  if (/^[a-z]{2}$/.test(text)) return text;
  if (/^[a-z]{3}$/.test(text)) return ISO_FOR_OPENSUBTITLES_ID[text] ?? text;
  const name = LANGUAGE_NAMES.find((key) => text.startsWith(key.toLowerCase()));
  return name && (ISO_FOR_OPENSUBTITLES_ID[SUB_LANGUAGE[name]] ?? SUB_LANGUAGE[name]);
};

/** A provider's seek-preview sprite list (thumbnails.vtt), which comes with the subtitles but isn't one */
export const isThumbnailTrack = (track: { kind?: string; lang?: string }) =>
  track.kind === 'thumbnails' || track.lang === 'thumbnails';
