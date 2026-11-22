import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SUBTITLE_STYLE, type SubtitleStyle } from '@/utils/subtitleStyle';
import { persistStorage } from './MMKV';

/** The player menu's speeds, which the default speed is one of */
export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export interface PlayerSettings extends SubtitleStyle {
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
  pipButton: boolean;
  /** Switch to picture-in-picture when leaving the player mid-playback */
  autoPip: boolean;
  doubleTapSeek: boolean;
  defaultSpeed: number;
}

interface PlayerSettingsState extends PlayerSettings {
  update: (settings: Partial<PlayerSettings>) => void;
}

export const usePlayerSettingsStore = create<PlayerSettingsState>()(
  persist(
    (set) => ({
      watchedPercent: 85,
      rotateToLandscape: true,
      controlsHideMs: 5000,
      aniSkip: true,
      skipIntroSeconds: 85,
      pipButton: true,
      autoPip: true,
      doubleTapSeek: true,
      defaultSpeed: 1,
      ...DEFAULT_SUBTITLE_STYLE,
      update: (settings) => set(settings),
    }),
    {
      name: 'playerSettings',
      storage: persistStorage,
    },
  ),
);
