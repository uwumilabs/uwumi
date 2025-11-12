import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '@/hooks/stores/MMKV';
import { constants } from '@/constants/config';

interface WatchProgress {
  currentTime: number;
  duration: number;
  progress: number;
  isCompleted?: boolean;
}

interface WatchProgressState {
  progresses: Record<string, WatchProgress>;
  setProgress: (uniqueId: string, progress: WatchProgress) => void;
  getProgress: (uniqueId: string) => WatchProgress | null;
  markAsCompleted: (uniqueId: string) => void;
  markAsIncomplete: (uniqueId: string) => void;
  removeProgress: (uniqueId: string) => void;
  clearAll: () => void;
}

export const useWatchProgressStore = create<WatchProgressState>()(
  persist(
    (set, get) => ({
      progresses: {},
      setProgress: (uniqueId, progress) => {
        // console.log('Setting progress:', { uniqueId, progress });
        const currentProgress = get().progresses[uniqueId];

        // Determine completion status:
        // 1. If explicitly set in the progress object, use that value
        // 2. Otherwise, auto-mark as completed if progress reaches PROGRESS_COMPLETION_PERCENTAGE +
        // 3. Preserve existing completed status if already marked
        const isCompleted =
          progress.isCompleted !== undefined
            ? progress.isCompleted
            : progress.progress >= constants.PROGRESS_COMPLETION_PERCENTAGE || currentProgress?.isCompleted || false;

        set((state) => ({
          progresses: {
            ...state.progresses,
            [uniqueId]: {
              ...progress,
              isCompleted,
            },
          },
        }));
        // console.log('New state:', get().progresses);
      },
      getProgress: (uniqueId) => {
        const progress = get().progresses[uniqueId] || null;
        // console.log('Getting progress:', { uniqueId, progress });
        return progress;
      },
      markAsCompleted: (uniqueId) => {
        set((state) => {
          const existing = state.progresses[uniqueId];
          if (!existing) {
            // Create new progress entry if doesn't exist
            return {
              progresses: {
                ...state.progresses,
                [uniqueId]: {
                  currentTime: 0,
                  duration: 0,
                  progress: 100,
                  isCompleted: true,
                },
              },
            };
          }
          return {
            progresses: {
              ...state.progresses,
              [uniqueId]: {
                ...existing,
                isCompleted: true,
              },
            },
          };
        });
      },
      markAsIncomplete: (uniqueId) => {
        set((state) => {
          const existing = state.progresses[uniqueId];
          if (!existing) return state;

          return {
            progresses: {
              ...state.progresses,
              [uniqueId]: {
                ...existing,
                currentTime: 0,
                progress: 0,
                isCompleted: false,
              },
            },
          };
        });
      },
      removeProgress: (uniqueId) => {
        //console.log('Removing progress:', uniqueId);
        set((state) => {
          const { [uniqueId]: _, ...rest } = state.progresses;
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
