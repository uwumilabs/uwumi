import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { VideoProvider, defaultTheme, usePlaybackRate, type SheetProps } from 'react-native-video-toolkit';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { PLAYBACK_RATES, usePlayerSettingsStore, useSubtitleStyle } from '@/hooks/stores/usePlayerSettingsStore';
import { BottomSheet } from '@/components/native/sheet/BottomSheet';
import { Slider } from './slider/Slider';
import { isTV } from '@/utils/tv';
import { captionsTheme } from '@/utils/subtitleStyle';
import { reportCaptionError } from './CaptionErrorToasts';

export const VIDEO_PORTAL_HOST = 'video-player';

const VideoSheet = ({ open, onOpenChange, children, style }: SheetProps) => (
  <BottomSheet open={open} onOpenChange={onOpenChange}>
    <View style={[{ width: '100%' }, style]}>{children}</View>
  </BottomSheet>
);

// TV keeps the toolkit's side panel: the native sheet takes Back as "close", so Back in a submenu would close the whole
// menu instead of going up one level, and its header scrolls away on a half-height sheet
const videoComponents = isTV ? { Slider } : { Sheet: VideoSheet, Slider };

// The player keeps its speed for the session; it starts at the default speed, and moves to a new default
const DefaultSpeed = () => {
  const defaultSpeed = usePlayerSettingsStore((state) => state.defaultSpeed);
  const { setPlaybackRate } = usePlaybackRate();
  useEffect(() => setPlaybackRate(defaultSpeed), [defaultSpeed, setPlaybackRate]);
  return null;
};

export const AppVideoProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useCurrentTheme();
  const rotateToLandscape = usePlayerSettingsStore((state) => state.rotateToLandscape);
  const controlsHideMs = usePlayerSettingsStore((state) => state.controlsHideMs);
  const pipButton = usePlayerSettingsStore((state) => state.pipButton);
  const doubleTapSeek = usePlayerSettingsStore((state) => state.doubleTapSeek);
  const subtitleStyle = useSubtitleStyle();
  const config = useMemo(
    () => ({
      useCustomVideoTracks: true,
      enableFullscreen: false,
      enablePictureInPicture: pipButton,
      enableScreenRotation: rotateToLandscape,
      autoHideDelay: controlsHideMs,
      enableDoubleTapGestures: doubleTapSeek,
      playbackRates: PLAYBACK_RATES,
      onCaptionError: reportCaptionError,
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
