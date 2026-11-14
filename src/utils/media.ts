import { MediaFormat, TvType, type IAnimeResult, type IMovieResult } from 'react-native-consumet';
import { MediaType, type MetaProvider } from '@/constants/types';

/** Where each media type's catalogue (search, feeds, info) comes from */
export const META_PROVIDERS: Record<MediaType, MetaProvider> = {
  [MediaType.ANIME]: 'anilist',
  [MediaType.MANGA]: 'anilist-manga',
  [MediaType.MOVIE]: 'tmdb',
};

export const mediaTypeLabel = (mediaType: MediaType) =>
  mediaType === MediaType.ANIME ? 'Anime' : mediaType === MediaType.MANGA ? 'Manga' : 'Movies & TV';

/** A title as search, feeds and favorites list it */
export type MediaItem = IAnimeResult | IMovieResult;

/** The media types in the order the tabs list them, with the tabs' names */
export const MEDIA_TABS = [
  { mediaType: MediaType.ANIME, label: 'Anime' },
  { mediaType: MediaType.MANGA, label: 'Manga' },
  { mediaType: MediaType.MOVIE, label: 'Movies' },
] as const;

/** A title's name, which providers give as a string or as romaji/english: romaji first, as AniList's cards show it */
export const infoTitle = (info?: { title?: string | { english?: string; romaji?: string; native?: string } }) =>
  typeof info?.title === 'string'
    ? info.title
    : info?.title?.romaji || info?.title?.english || info?.title?.native || undefined;

/** A movie, rather than a show with episodes: a movie's one episode has no number to show */
export const isMovieType = (type?: string) => type === MediaFormat.MOVIE || type === TvType.MOVIE;
