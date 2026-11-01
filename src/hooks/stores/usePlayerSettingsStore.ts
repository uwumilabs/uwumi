import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { constants } from '@/constants/config';
import { storage } from './MMKV';

/** The player menu's speeds, which the default speed is one of */
export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export interface PlayerSettings {
  /** How far into an episode, in percent, it counts as watched */
  watchedPercent: number;
  /** Lock the player to landscape while it's open */
  rotateToLandscape: boolean;
  /** How long the controls stay up without input, in ms */
  controlsHideMs: number;
  /** Skip buttons from AniSkip's timestamps, for anime */
  aniSkip: boolean;
  /** The jump the skip button makes where AniSkip has no timestamps, in seconds */
  skipIntroSeconds: number;
  /** The controls' picture-in-picture button */
  pipButton: boolean;
  /** Switch to picture-in-picture when leaving the player mid-playback */
  autoPip: boolean;
  /** Double tap a side to seek */
  doubleTapSeek: boolean;
  /** The speed videos start at */
  defaultSpeed: number;
}

interface PlayerSettingsState extends PlayerSettings {
  update: (settings: Partial<PlayerSettings>) => void;
}

export const usePlayerSettingsStore = create<PlayerSettingsState>()(
  persist(
    (set) => ({
      watchedPercent: constants.PROGRESS_COMPLETION_PERCENTAGE,
      rotateToLandscape: true,
      controlsHideMs: 5000,
      aniSkip: true,
      skipIntroSeconds: 85,
      pipButton: true,
      autoPip: true,
      doubleTapSeek: true,
      defaultSpeed: 1,
      update: (settings) => set(settings),
    }),
    {
      name: 'playerSettings',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) ?? null,
        removeItem: (name) => storage.remove(name),
      })),
    },
  ),
);
