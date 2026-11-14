import type { IAnimeEpisode, IMovieEpisode, MediaFormat, TvType } from 'react-native-consumet';
import { MediaType } from '@/constants/types';

export type EpisodeItem = IAnimeEpisode | IMovieEpisode;

export const episodeNumber = (episode: EpisodeItem) => (episode.number ?? episode.episode) as number | undefined;

export const episodeImage = (episode: EpisodeItem) =>
  typeof episode.image === 'string' ? episode.image : (episode.image?.hd ?? '');

/** "EP 12", or just "EP" when the provider gave no number */
export const episodeLabel = (number?: string | number) => `EP ${number ?? ''}`.trim();

/** "S2 · EP 12"; just the episode for a show without seasons */
export const seasonEpisodeLabel = (season: string | number | undefined, number?: string | number) =>
  season ? `S${season} · ${episodeLabel(number)}` : episodeLabel(number);

/** The episode's title, or "Episode 5" when the provider gave none */
export const episodeTitle = (episode: EpisodeItem, number: string | number | undefined = episodeNumber(episode)) =>
  episode.title || (number === undefined ? 'Episode' : `Episode ${number}`);

/** The episode list has the episode, but the provider found no match for it */
export const notOnProvider = (providerName: string) => ({
  title: `Not on ${providerName}`,
  detail: 'This episode isn’t available there. Try another provider.',
});

/** An episode's number, or its place in the list when the provider gave none */
export const listEpisodeNumber = (episode: EpisodeItem | undefined, index: number) =>
  (episode && episodeNumber(episode)) ?? index + 1;

/** A jump-bar range, "EP 1–50" */
export const episodeRangeLabel = (episodes: EpisodeItem[], start: number, end: number) =>
  `${episodeLabel(listEpisodeNumber(episodes[start], start))}–${listEpisodeNumber(episodes[end], end)}`;

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
  type?: MediaFormat | TvType;
}

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
