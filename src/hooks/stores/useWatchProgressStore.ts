import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/hooks/stores/MMKV';
import { usePlayerSettingsStore } from './usePlayerSettingsStore';
import { usePreferencesStore } from './usePreferencesStore';

interface WatchProgress {
  currentTime: number;
  duration: number;
  /** Percent of the episode watched */
  progress: number;
  isCompleted?: boolean;
}

interface WatchProgressState {
  progresses: Record<string, WatchProgress>;
  /**
   * Where playback got to. Not saved in incognito, nor when it's behind the saved point (a rewatch keeps the
   * furthest point); it counts as watched from the player setting's percent on
   */
  savePlayback: (uniqueId: string, currentTime: number, duration: number) => void;
  /** Marks the episode watched, or unwatched when it was; returns whether it's now watched */
  toggleWatched: (uniqueId: string) => boolean;
  clearAll: () => void;
}

export const isWatchedPercent = (percent: number) => percent >= usePlayerSettingsStore.getState().watchedPercent;

export const useWatchProgressStore = create<WatchProgressState>()(
  persist(
    (set, get) => ({
      progresses: {},
      savePlayback: (uniqueId, currentTime, duration) => {
        if (usePreferencesStore.getState().incognito || !(duration > 0)) return;
        const saved = get().progresses[uniqueId];
        if (saved && currentTime <= (saved.currentTime ?? 0)) return;
        const progress = (currentTime / duration) * 100;
        set((state) => ({
          progresses: {
            ...state.progresses,
            [uniqueId]: {
              currentTime,
              duration,
              progress,
              isCompleted: isWatchedPercent(progress) || !!saved?.isCompleted,
            },
          },
        }));
      },
      toggleWatched: (uniqueId) => {
        const saved = get().progresses[uniqueId];
        const watched = !saved?.isCompleted;
        const duration = saved?.duration ?? 0;
        set((state) => ({
          progresses: {
            ...state.progresses,
            [uniqueId]: {
              currentTime: watched ? duration : 0,
              duration,
              progress: watched ? 100 : 0,
              isCompleted: watched,
            },
          },
        }));
        return watched;
      },
      clearAll: () => set({ progresses: {} }),
    }),
    {
      name: 'watchProgress',
      storage: persistStorage,
    },
  ),
);
