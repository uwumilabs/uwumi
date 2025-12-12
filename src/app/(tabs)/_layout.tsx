import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useCurrentTheme, usePureBlackBackground } from '@/hooks';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { hexToRGB } from '@/constants/utils';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TabLayout() {
  const currentTheme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);

  SystemNavigationBar.setNavigationColor(
    pureBlackBackground ? currentTheme?.segment : currentTheme?.surface || 'black',
  );

  return (
    <NativeTabs
      backBehavior="history"
      backgroundColor={pureBlackBackground ? currentTheme?.segment : currentTheme?.surface}
      indicatorColor={currentTheme?.default}
      rippleColor={hexToRGB(currentTheme?.accent, 0.5)}
      labelStyle={{ fontSize: 13, fontWeight: '700', color: currentTheme?.foreground }}
      iconColor={currentTheme?.foreground}
      labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="index">
        <Label>Anime</Label>
        <Icon drawable="anime_icon" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="manga">
        <Label>Manga</Label>
        <Icon drawable="manga_icon" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="movies">
        <Label>Movies</Label>
        <Icon drawable="movies_icon" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Label>More</Label>
        <Icon drawable="more_icon" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
