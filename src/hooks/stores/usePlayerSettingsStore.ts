import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import {
  DEFAULT_SUBTITLE_STYLE,
  isDefaultSubtitleStyle,
  pickSubtitleStyle,
  type SubtitleStyle,
} from '@/utils/subtitleStyle';
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

/** The viewer's subtitle style, as an object that changes only when one of its settings does */
export const useSubtitleStyle = () => usePlayerSettingsStore(useShallow(pickSubtitleStyle));

/** One subtitle style setting and its setter, for the settings screen and the player menu */
export const useSubtitleSetting = <K extends keyof SubtitleStyle>(key: K) => {
  const value = usePlayerSettingsStore((state) => state[key]);
  const update = usePlayerSettingsStore((state) => state.update);
  return [value, (next: SubtitleStyle[K]) => update({ [key]: next })] as const;
};

export const useIsDefaultSubtitleStyle = () => usePlayerSettingsStore(isDefaultSubtitleStyle);

export const resetSubtitleStyle = () => usePlayerSettingsStore.getState().update(DEFAULT_SUBTITLE_STYLE);
