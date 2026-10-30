import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from './MMKV';
import { usePreferencesStore } from './usePreferencesStore';

/** Where a manga's reading got to on one provider. Chapter ids are the provider's, so each provider has its own. */
export interface MangaProgress {
  lastChapterId: string;
  lastChapterTitle: string;
  read: string[];
  updatedAt: number;
}

interface MangaProgressState {
  progress: Record<string, MangaProgress>;
  markRead: (key: string, chapter: { id: string; title: string }) => void;
  clearAll: () => void;
}

/** The progress key: the AniList id and the provider, as chapter ids differ between providers */
export const mangaProgressKey = (anilistId: string, provider: string) => `${anilistId}|${provider}`;

export const useMangaProgressStore = create<MangaProgressState>()(
  persist(
    (set) => ({
      progress: {},
      markRead: (key, chapter) => {
        if (usePreferencesStore.getState().incognito) return;
        set((state) => {
          const previous = state.progress[key];
          const read = previous?.read.includes(chapter.id) ? previous.read : [...(previous?.read ?? []), chapter.id];
          return {
            progress: {
              ...state.progress,
              [key]: { lastChapterId: chapter.id, lastChapterTitle: chapter.title, read, updatedAt: Date.now() },
            },
          };
        });
      },
      clearAll: () => set({ progress: {} }),
    }),
    {
      name: 'mangaProgress',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) ?? null,
        removeItem: (name) => storage.remove(name),
      })),
    },
  ),
);
