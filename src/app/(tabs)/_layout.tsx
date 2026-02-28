import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useCurrentTheme, usePureBlackBackground } from '@/hooks';
import { hexToRGB } from '@/constants/utils';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TabLayout() {
  const currentTheme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);

  return (
    <NativeTabs
      backBehavior="history"
      backgroundColor={pureBlackBackground ? currentTheme?.amoledSurfaceVariant : currentTheme?.segment}
      indicatorColor={currentTheme?.default}
      rippleColor={hexToRGB(currentTheme?.accent, 0.5)}
      labelStyle={{ fontSize: 13, fontWeight: '700', color: currentTheme?.foreground }}
      iconColor={currentTheme?.foreground}
      labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Anime</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon drawable="anime_icon" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="manga">
        <NativeTabs.Trigger.Label>Manga</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon drawable="manga_icon" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="movies">
        <NativeTabs.Trigger.Label>Movies</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon drawable="movies_icon" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon drawable="more_icon" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
