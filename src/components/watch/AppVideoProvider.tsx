import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import {
  VideoProvider,
  defaultTheme,
  usePlaybackRate,
  type CaptionError,
  type SheetProps,
} from 'react-native-video-toolkit';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { PLAYBACK_RATES, usePlayerSettingsStore } from '@/hooks/stores/usePlayerSettingsStore';
import { BottomSheet } from '@/components/native/BottomSheet';
import { Slider } from './slider/Slider';
import { isTV } from '@/utils/tv';
import { captionsTheme, pickSubtitleStyle } from '@/utils/subtitleStyle';
import { useShallow } from 'zustand/react/shallow';

export const VIDEO_PORTAL_HOST = 'video-player';

// On phones the player's settings menu opens in the app's native bottom sheet
const VideoSheet = ({ open, onOpenChange, children, style }: SheetProps) => (
  <BottomSheet open={open} onOpenChange={onOpenChange}>
    <View style={[{ width: '100%' }, style]}>{children}</View>
  </BottomSheet>
);

// TV keeps the toolkit's side panel: the native sheet takes Back as "close", so Back in a submenu would close the whole
// menu instead of going up one level, and its header scrolls away on a half-height sheet
const videoComponents = isTV ? { Slider } : { Sheet: VideoSheet, Slider };

type CaptionErrorListener = (error: CaptionError) => void;
const captionErrorListeners = new Set<CaptionErrorListener>();

/** Subtitle files that didn't load or parse. The provider sits above the toasts, so the watch screen shows them. */
export const subscribeCaptionErrors = (listener: CaptionErrorListener) => {
  captionErrorListeners.add(listener);
  return () => {
    captionErrorListeners.delete(listener);
  };
};

const onCaptionError = (error: CaptionError) => captionErrorListeners.forEach((listener) => listener(error));

// The player keeps its speed for the session; it starts at the default speed, and moves to a new default
const DefaultSpeed = () => {
  const defaultSpeed = usePlayerSettingsStore((state) => state.defaultSpeed);
  const { setPlaybackRate } = usePlaybackRate();
  useEffect(() => setPlaybackRate(defaultSpeed), [defaultSpeed, setPlaybackRate]);
  return null;
};

/** The toolkit's player state, which is app-wide, in the app's theme and with the player settings */
export const AppVideoProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useCurrentTheme();
  const rotateToLandscape = usePlayerSettingsStore((state) => state.rotateToLandscape);
  const controlsHideMs = usePlayerSettingsStore((state) => state.controlsHideMs);
  const pipButton = usePlayerSettingsStore((state) => state.pipButton);
  const doubleTapSeek = usePlayerSettingsStore((state) => state.doubleTapSeek);
  const subtitleStyle = usePlayerSettingsStore(useShallow(pickSubtitleStyle));
  const config = useMemo(
    () => ({
      useCustomVideoTracks: true,
      enableFullscreen: false,
      enablePictureInPicture: pipButton,
      enableScreenRotation: rotateToLandscape,
      autoHideDelay: controlsHideMs,
      enableDoubleTapGestures: doubleTapSeek,
      playbackRates: PLAYBACK_RATES,
      onCaptionError,
    }),
    [pipButton, rotateToLandscape, controlsHideMs, doubleTapSeek],
  );
  const videoTheme = useMemo(
    () => ({
      colors: {
        ...defaultTheme.colors,
        sliderTrackActive: theme.accent,
        sliderTrackInactive: theme.default,
        sliderThumb: theme.accent,
        spinner: theme.accent,
        menuBackground: theme.sheetBackground,
        menuBorder: theme.border,
        buttonPrimaryBackground: theme.accent,
        buttonPrimaryText: theme.accentForeground,
        buttonSecondaryBorder: theme.border,
      },
      captions: captionsTheme(subtitleStyle),
    }),
    [theme, subtitleStyle],
  );
  return (
    <VideoProvider theme={videoTheme} config={config} components={videoComponents} portalHost={VIDEO_PORTAL_HOST}>
      <DefaultSpeed />
      {children}
    </VideoProvider>
  );
};
