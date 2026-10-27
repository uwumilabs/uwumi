import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '@/hooks/stores/MMKV';
import { MediaType } from '@/constants/types';

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
  record: (input: RecordInput) => void;
  remove: (key: string) => void;
  clearAll: () => void;
}

export const continueWatchingKey = (mediaType: MediaType, showId: string) => `${mediaType}-${showId}`;

export const useContinueWatchingStore = create<ContinueWatchingState>()(
  persist(
    (set) => ({
      entries: [],
      record: (input) =>
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
        }),
      remove: (key) => set((state) => ({ entries: state.entries.filter((entry) => entry.key !== key) })),
      clearAll: () => set({ entries: [] }),
    }),
    {
      name: 'continueWatching',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) ?? null,
        removeItem: (name) => storage.remove(name),
      })),
    },
  ),
);
