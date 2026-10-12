import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MediaType } from '@/constants/types';
import { storage } from './MMKV';

const MAX_RECENT_SEARCHES = 10;

interface RecentSearchesState {
  recent: Partial<Record<MediaType, string[]>>;
  addRecentSearch: (mediaType: MediaType, query: string) => void;
  removeRecentSearch: (mediaType: MediaType, query: string) => void;
  clearRecentSearches: (mediaType: MediaType) => void;
}

const sameQuery = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set) => ({
      recent: {},

      addRecentSearch: (mediaType, query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        set((state) => {
          const others = (state.recent[mediaType] ?? []).filter((q) => !sameQuery(q, trimmed));
          return { recent: { ...state.recent, [mediaType]: [trimmed, ...others].slice(0, MAX_RECENT_SEARCHES) } };
        });
      },

      removeRecentSearch: (mediaType, query) =>
        set((state) => ({
          recent: { ...state.recent, [mediaType]: (state.recent[mediaType] ?? []).filter((q) => q !== query) },
        })),

      clearRecentSearches: (mediaType) => set((state) => ({ recent: { ...state.recent, [mediaType]: [] } })),
    }),
    {
      name: 'recent-searches',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) ?? null,
        removeItem: (name) => storage.remove(name),
      })),
    },
  ),
);
