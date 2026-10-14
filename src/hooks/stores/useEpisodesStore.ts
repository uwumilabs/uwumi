import { EpisodeDisplayMode, MediaType } from '@/constants/types';
import { create } from 'zustand';
import { IAnimeEpisode, IMovieEpisode } from 'react-native-consumet';

// Type for episode with navigation-relevant fields
export type EpisodeItem = IAnimeEpisode | IMovieEpisode;

// Route params needed for episode navigation
export interface EpisodeRouteParams {
  [key: string]: string | undefined;
  mediaType: MediaType;
  provider: string;
  id: string;
  mediaId: string;
  episodeId: string;
  episodeDubId?: string;
  isDubbed?: string;
  uniqueId: string;
  poster: string;
  title: string;
  description: string;
  episodeNumber: string;
  seasonNumber: string;
  type: string;
}

interface EpisodesIdState {
  currentUniqueId: string | null;
  currentEpisodeId: string | null;
  setEpisodeIds: (currenteid: string | null, currentuid: string | null) => void;
}

export const useEpisodesIdStore = create<EpisodesIdState>((set) => ({
  currentUniqueId: null,
  currentEpisodeId: null,
  setEpisodeIds: (currenteid, currentuid) => {
    set({ currentEpisodeId: currenteid, currentUniqueId: currentuid });
  },
}));

interface AdjacentEpisodes {
  prevEpisode: EpisodeItem | null;
  nextEpisode: EpisodeItem | null;
  currentIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
}

const NO_ADJACENT_EPISODES: AdjacentEpisodes = {
  prevEpisode: null,
  nextEpisode: null,
  currentIndex: -1,
  hasPrev: false,
  hasNext: false,
};

/** The episodes either side of `currentUniqueId`, or none at the list's ends. */
export const getAdjacentEpisodes = (episodes: EpisodeItem[], currentUniqueId: string | null): AdjacentEpisodes => {
  if (!currentUniqueId) return NO_ADJACENT_EPISODES;
  const currentIndex = episodes.findIndex((ep) => ep.uniqueId === currentUniqueId);
  if (currentIndex === -1) return NO_ADJACENT_EPISODES;
  return {
    prevEpisode: currentIndex > 0 ? episodes[currentIndex - 1] : null,
    nextEpisode: currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null,
    currentIndex,
    hasPrev: currentIndex > 0,
    hasNext: currentIndex < episodes.length - 1,
  };
};

/** Route params for opening `episode` in the watch screen, or null if it can't be played. */
export const buildEpisodeRouteParams = (
  episode: EpisodeItem | null,
  context: { mediaType: MediaType; provider: string; id: string; mediaId: string; type: string },
): EpisodeRouteParams | null => {
  if (!episode || !episode.id || !episode.uniqueId) {
    return null;
  }

  const { mediaType, provider, id, mediaId, type } = context;

  // Extract image - handle both string and object formats
  const poster = typeof episode.image === 'string' ? episode.image : (episode.image?.hd ?? '');

  return {
    mediaType,
    provider,
    id,
    mediaId,
    episodeId: episode.id,
    ...(episode.dubId ? { episodeDubId: episode.dubId as string } : {}),
    ...(episode.isDubbed ? { isDubbed: String(episode.isDubbed) } : {}),
    uniqueId: episode.uniqueId as string,
    poster,
    title: episode.title ?? '',
    description: episode.description ?? '',
    episodeNumber: String(episode.number ?? episode.episode ?? ''),
    seasonNumber: String(episode.season ?? ''),
    type,
  };
};

interface EpisodeDisplayState {
  displayMode: EpisodeDisplayMode;
  setDisplayMode: (mode: EpisodeDisplayMode) => void;
}

export const useEpisodeDisplayStore = create<EpisodeDisplayState>((set) => ({
  displayMode: EpisodeDisplayMode.FullMetadata,
  setDisplayMode: (mode) => set({ displayMode: mode }),
}));

// Keyed by `${mediaType}-${showId}`, so each show keeps its own season for the session
interface SeasonState {
  seasons: Record<string, number>;
  setSeason: (showKey: string, season: number) => void;
}

export const useSeasonStore = create<SeasonState>((set) => ({
  seasons: {},
  setSeason: (showKey, season) => set((state) => ({ seasons: { ...state.seasons, [showKey]: season } })),
}));
