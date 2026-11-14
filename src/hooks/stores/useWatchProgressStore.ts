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

// Saved progress this close to the end counts as finished
const RESTART_TAIL_SECONDS = 10;

/**
 * Where to start an episode: where it was left, or the start once it's watched or nearly over, as resuming at its
 * end would end it at once and roll on to the next. `duration` is the loaded video's, else the saved one
 */
export const resumeAt = (uniqueId: string, duration?: number) => {
  const saved = useWatchProgressStore.getState().progresses[uniqueId];
  const length = duration ?? saved?.duration ?? 0;
  return saved && !saved.isCompleted && saved.currentTime < length - RESTART_TAIL_SECONDS ? saved.currentTime : 0;
};

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
