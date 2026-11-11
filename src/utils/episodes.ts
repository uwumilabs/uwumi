import type { IAnimeEpisode, IMovieEpisode } from 'react-native-consumet';
import { MediaType } from '@/constants/types';

export type EpisodeItem = IAnimeEpisode | IMovieEpisode;

export const episodeNumber = (episode: EpisodeItem) => (episode.number ?? episode.episode) as number | undefined;

export const episodeImage = (episode: EpisodeItem) =>
  typeof episode.image === 'string' ? episode.image : (episode.image?.hd ?? '');

/** TMDB episodes carry their season; other providers' don't have one */
export const episodeSeason = (episode: EpisodeItem) => (episode as { season?: number }).season;

/** The show an episode is from, as the watch screen needs it besides the episode */
export interface EpisodeContext {
  mediaType: MediaType;
  provider: string;
  /** The info screen's id */
  id: string;
  /** The provider's id for the show, which movie providers fetch episodes with */
  mediaId?: string;
  type: string;
}

/** All strings, so Continue watching and downloads can save them and open them again */
export type WatchParams = {
  mediaType: MediaType;
  provider: string;
  id: string;
  mediaId?: string;
  /** Empty when the provider didn't find the title */
  episodeId?: string;
  isDubbed?: string;
  uniqueId: string;
  poster?: string;
  title?: string;
  episodeNumber?: string;
  seasonNumber?: string;
  type: string;
};

/** The values that are set, as strings: route params, and what's saved to open a route again */
export const routeParams = <T extends object>(values: T) =>
  Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) =>
      value === undefined || value === null || value === '' ? [] : [[key, String(value)]],
    ),
  ) as { [K in keyof T]: string };

export const watchParams = (episode: EpisodeItem, { mediaType, provider, id, mediaId, type }: EpisodeContext) =>
  routeParams({
    mediaType,
    provider,
    id,
    mediaId,
    episodeId: episode.id,
    isDubbed: episode.isDubbed || undefined,
    uniqueId: episode.uniqueId,
    poster: episodeImage(episode),
    title: episode.title,
    episodeNumber: episodeNumber(episode),
    seasonNumber: episodeSeason(episode),
    type,
  }) as unknown as WatchParams;

interface AdjacentEpisodes {
  prevEpisode: EpisodeItem | null;
  nextEpisode: EpisodeItem | null;
  currentIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export const getAdjacentEpisodes = (episodes: EpisodeItem[], uniqueId: string | undefined): AdjacentEpisodes => {
  const currentIndex = uniqueId ? episodes.findIndex((episode) => episode.uniqueId === uniqueId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < episodes.length - 1;
  return {
    prevEpisode: hasPrev ? episodes[currentIndex - 1] : null,
    nextEpisode: hasNext ? episodes[currentIndex + 1] : null,
    currentIndex,
    hasPrev,
    hasNext,
  };
};

// consumet's episode keys: `${anilistId}$ep=…` for anime, `${tmdbId}-${type}-s${season}-e${episode}` for TMDB titles
const ANIME_EPISODE = /^(\d+)\$ep=/;
const TMDB_EPISODE = /^(\d+)-(\w+)-s(\d+)-e\d+$/;

/** The title an episode's uniqueId belongs to (`type` and `season` for TMDB's), from the key's format */
export const titleOfUniqueId = (uniqueId: string) => {
  const anime = ANIME_EPISODE.exec(uniqueId);
  if (anime) return { mediaType: MediaType.ANIME, id: anime[1] };
  const tmdb = TMDB_EPISODE.exec(uniqueId);
  return tmdb ? { mediaType: MediaType.MOVIE, id: tmdb[1], type: tmdb[2], season: Number(tmdb[3]) } : undefined;
};
