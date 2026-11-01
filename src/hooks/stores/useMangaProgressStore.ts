import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from './MMKV';
import { usePreferencesStore } from './usePreferencesStore';

/** Where a manga's reading got to on one provider. Chapter ids are the provider's, so each provider has its own. */
export interface MangaProgress {
  lastChapterId: string;
  lastChapterTitle: string;
  /** The page reached in the last chapter, of how many it has */
  lastPage?: number;
  pageCount?: number;
  /** The manga, for Continue reading and History */
  title?: string;
  image?: string;
  /** Taken out of Continue reading and History; its read chapters stay */
  hidden?: boolean;
  read: string[];
  updatedAt: number;
}

interface MangaProgressState {
  progress: Record<string, MangaProgress>;
  markRead: (key: string, chapter: { id: string; title: string }, manga?: { title?: string; image?: string }) => void;
  setPage: (key: string, chapterId: string, page: number, pageCount: number) => void;
  hide: (key: string) => void;
  hideAll: () => void;
  clearAll: () => void;
}

/** The progress key: the AniList id and the provider, as chapter ids differ between providers */
export const mangaProgressKey = (anilistId: string, provider: string) => `${anilistId}|${provider}`;

/** The key's parts */
export const parseMangaProgressKey = (key: string) => {
  const [anilistId, provider] = key.split('|');
  return { anilistId, provider };
};

/** The page to reopen a chapter at: where it was left, unless it was read to the end */
export const resumePage = (progress: MangaProgress | undefined, chapterId: string) =>
  progress?.lastChapterId === chapterId && progress.lastPage && progress.lastPage < (progress.pageCount ?? Infinity)
    ? progress.lastPage
    : 1;

export const useMangaProgressStore = create<MangaProgressState>()(
  persist(
    (set) => ({
      progress: {},
      markRead: (key, chapter, manga) => {
        if (usePreferencesStore.getState().incognito) return;
        set((state) => {
          const previous = state.progress[key];
          const read = previous?.read.includes(chapter.id) ? previous.read : [...(previous?.read ?? []), chapter.id];
          const sameChapter = previous?.lastChapterId === chapter.id;
          return {
            progress: {
              ...state.progress,
              [key]: {
                lastChapterId: chapter.id,
                lastChapterTitle: chapter.title,
                lastPage: sameChapter ? previous.lastPage : undefined,
                pageCount: sameChapter ? previous.pageCount : undefined,
                title: manga?.title || previous?.title,
                image: manga?.image || previous?.image,
                read,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },
      setPage: (key, chapterId, page, pageCount) => {
        if (usePreferencesStore.getState().incognito) return;
        set((state) => {
          const previous = state.progress[key];
          if (!previous || previous.lastChapterId !== chapterId || previous.lastPage === page) return state;
          return {
            progress: { ...state.progress, [key]: { ...previous, lastPage: page, pageCount, updatedAt: Date.now() } },
          };
        });
      },
      hide: (key) =>
        set((state) =>
          state.progress[key]
            ? { progress: { ...state.progress, [key]: { ...state.progress[key], hidden: true } } }
            : state,
        ),
      hideAll: () =>
        set((state) => ({
          progress: Object.fromEntries(
            Object.entries(state.progress).map(([key, value]) => [key, { ...value, hidden: true }]),
          ),
        })),
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
