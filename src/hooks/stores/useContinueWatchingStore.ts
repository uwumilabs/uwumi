import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/hooks/stores/MMKV';
import { MediaType } from '@/constants/types';
import { usePreferencesStore } from './usePreferencesStore';

// The home row shows the first 10 per media type; History shows them all
const MAX_ENTRIES = 100;

export interface ContinueWatchingEntry {
  key: string;
  mediaType: MediaType;
  showId: string;
  showTitle: string;
  showImage?: string;
  uniqueId: string;
  hasNextEpisode?: boolean;
  watchParams: Record<string, string>;
  infoParams: Record<string, string>;
  updatedAt: number;
}

type RecordInput = Omit<ContinueWatchingEntry, 'key' | 'updatedAt' | 'showTitle'> & { showTitle?: string };

interface ContinueWatchingState {
  entries: ContinueWatchingEntry[];
  /** Puts the show first, keeping an earlier title and image if the new ones are missing. Not in incognito */
  record: (input: RecordInput) => void;
  remove: (key: string) => void;
  clearAll: () => void;
}

export const continueWatchingKey = (mediaType: MediaType, showId: string) => `${mediaType}-${showId}`;

export const useContinueWatchingStore = create<ContinueWatchingState>()(
  persist(
    (set) => ({
      entries: [],
      record: (input) => {
        if (usePreferencesStore.getState().incognito) return;
        set((state) => {
          const key = continueWatchingKey(input.mediaType, input.showId);
          const previous = state.entries.find((entry) => entry.key === key);
          const entry: ContinueWatchingEntry = {
            ...input,
            key,
            showTitle: input.showTitle || previous?.showTitle || '',
            showImage: input.showImage || previous?.showImage,
            infoParams: { ...previous?.infoParams, ...input.infoParams },
            updatedAt: Date.now(),
          };
          return {
            entries: [entry, ...state.entries.filter((existing) => existing.key !== key)].slice(0, MAX_ENTRIES),
          };
        });
      },
      remove: (key) => set((state) => ({ entries: state.entries.filter((entry) => entry.key !== key) })),
      clearAll: () => set({ entries: [] }),
    }),
    {
      name: 'continueWatching',
      storage: persistStorage,
    },
  ),
);
