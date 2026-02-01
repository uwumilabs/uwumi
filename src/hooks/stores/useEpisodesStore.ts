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
  prevUniqueId: string | null;
  nextUniqueId: string | null;
  setEpisodeIds: (
    currenteid: string | null,
    currentuid: string | null,
    prevuid?: string | null,
    nextuid?: string | null,
  ) => void;
}

export const useEpisodesIdStore = create<EpisodesIdState>((set) => ({
  currentUniqueId: null,
  currentEpisodeId: null,
  prevUniqueId: null,
  nextUniqueId: null,
  setEpisodeIds: (currenteid, currentuid, prevuid, nextuid) => {
    set({ currentEpisodeId: currenteid, currentUniqueId: currentuid, prevUniqueId: prevuid, nextUniqueId: nextuid });
  },
}));

interface AdjacentEpisodes {
  prevEpisode: EpisodeItem | null;
  nextEpisode: EpisodeItem | null;
  currentIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface EpisodesState {
  episodes: EpisodeItem[];
  setEpisodes: (episodes: EpisodeItem[]) => void;

  /**
   * Get adjacent (prev/next) episodes relative to the current uniqueId.
   * Returns null episodes if at boundaries.
   */
  getAdjacentEpisodes: (currentUniqueId: string | null) => AdjacentEpisodes;

  /**
   * Build route params for navigating to a specific episode.
   * Returns null if episode is invalid.
   */
  buildEpisodeRouteParams: (
    episode: EpisodeItem | null,
    context: {
      mediaType: MediaType;
      provider: string;
      id: string;
      mediaId: string;
      type: string;
    },
  ) => EpisodeRouteParams | null;
}

export const useEpisodesStore = create<EpisodesState>((set, get) => ({
  episodes: [],
  setEpisodes: (episodes: EpisodeItem[]) => set({ episodes }),

  getAdjacentEpisodes: (currentUniqueId: string | null): AdjacentEpisodes => {
    const { episodes } = get();

    if (!currentUniqueId || episodes.length === 0) {
      return {
        prevEpisode: null,
        nextEpisode: null,
        currentIndex: -1,
        hasPrev: false,
        hasNext: false,
      };
    }

    const currentIndex = episodes.findIndex((ep) => ep.uniqueId === currentUniqueId);

    if (currentIndex === -1) {
      return {
        prevEpisode: null,
        nextEpisode: null,
        currentIndex: -1,
        hasPrev: false,
        hasNext: false,
      };
    }

    const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
    const nextEpisode = currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

    return {
      prevEpisode,
      nextEpisode,
      currentIndex,
      hasPrev: currentIndex > 0,
      hasNext: currentIndex < episodes.length - 1,
    };
  },

  buildEpisodeRouteParams: (episode, context): EpisodeRouteParams | null => {
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
  },
}));

interface EpisodeDisplayState {
  displayMode: EpisodeDisplayMode;
  setDisplayMode: (mode: EpisodeDisplayMode) => void;
}

export const useEpisodeDisplayStore = create<EpisodeDisplayState>((set) => ({
  displayMode: EpisodeDisplayMode.FullMetadata,
  setDisplayMode: (mode) => set({ displayMode: mode }),
}));

interface SeasonState {
  seasonNumber: number;
  setSeasonNumber: (seasonNumber: number) => void;
  resetSeasonNumber: () => void;
}

export const useSeasonStore = create<SeasonState>((set) => ({
  seasonNumber: 0,
  setSeasonNumber: (seasonNumber) => set({ seasonNumber }),
  resetSeasonNumber: () => set({ seasonNumber: 0 }),
}));
