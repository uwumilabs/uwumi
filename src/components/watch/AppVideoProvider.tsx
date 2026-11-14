import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { VideoProvider, defaultTheme, usePlaybackRate, type SheetProps } from 'react-native-video-toolkit';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { PLAYBACK_RATES, usePlayerSettingsStore } from '@/hooks/stores/usePlayerSettingsStore';
import { BottomSheet } from '@/components/native/BottomSheet';
import { Slider } from './slider/Slider';

export const VIDEO_PORTAL_HOST = 'video-player';

// The player's settings menu opens in the app's native bottom sheet
const VideoSheet = ({ open, onOpenChange, children, style }: SheetProps) => (
  <BottomSheet open={open} onOpenChange={onOpenChange}>
    <View style={[{ width: '100%' }, style]}>{children}</View>
  </BottomSheet>
);

const videoComponents = { Sheet: VideoSheet, Slider };

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
  const config = useMemo(
    () => ({
      useCustomVideoTracks: true,
      enableFullscreen: false,
      enablePictureInPicture: pipButton,
      enableScreenRotation: rotateToLandscape,
      autoHideDelay: controlsHideMs,
      enableDoubleTapGestures: doubleTapSeek,
      playbackRates: PLAYBACK_RATES,
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
    }),
    [theme],
  );
  return (
    <VideoProvider theme={videoTheme} config={config} components={videoComponents} portalHost={VIDEO_PORTAL_HOST}>
      <DefaultSpeed />
      {children}
    </VideoProvider>
  );
};
