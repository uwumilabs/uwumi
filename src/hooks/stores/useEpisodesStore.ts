import { create } from 'zustand';
import { EpisodeDisplayMode } from '@/constants/types';

interface NowPlayingState {
  /** The episode the watch screen is playing, while it's open */
  currentUniqueId: string | null;
  setCurrentUniqueId: (uniqueId: string | null) => void;
}

export const useEpisodesIdStore = create<NowPlayingState>((set) => ({
  currentUniqueId: null,
  setCurrentUniqueId: (currentUniqueId) => set({ currentUniqueId }),
}));

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
