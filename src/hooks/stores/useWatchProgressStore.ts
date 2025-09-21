import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '@/hooks/stores/MMKV';

interface WatchProgress {
  currentTime: number;
  duration: number;
  progress: number;
}

interface WatchProgressState {
  progresses: Record<string, WatchProgress>;
  setProgress: (episodeId: string, progress: WatchProgress) => void;
  getProgress: (episodeId: string) => WatchProgress | null;
  removeProgress: (episodeId: string) => void;
  clearAll: () => void;
}

export const useWatchProgressStore = create<WatchProgressState>()(
  persist(
    (set, get) => ({
      progresses: {},
      setProgress: (episodeId, progress) => {
        // console.log('Setting progress:', { episodeId, progress });
        set((state) => ({
          progresses: {
            ...state.progresses,
            [episodeId]: progress,
          },
        }));
        // console.log('New state:', get().progresses);
      },
      getProgress: (episodeId) => {
        const progress = get().progresses[episodeId] || null;
        // console.log('Getting progress:', { episodeId, progress });
        return progress;
      },
      removeProgress: (episodeId) => {
        //console.log('Removing progress:', episodeId);
        set((state) => {
          const { [episodeId]: _, ...rest } = state.progresses;
          return { progresses: rest };
        });
      },
      clearAll: () => {
        //console.log('Clearing all progress');
        set({ progresses: {} });
      },
    }),
    {
      name: 'watchProgress',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) ?? null,
        removeItem: (name) => storage.delete(name),
      })),
    },
  ),
);
