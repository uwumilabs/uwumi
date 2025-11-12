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

  SystemNavigationBar.setNavigationColor(pureBlackBackground ? currentTheme?.color5 : currentTheme?.color3 || 'black');

  return (
    <NativeTabs
      backBehavior="history"
      backgroundColor={pureBlackBackground ? currentTheme?.color5 : currentTheme?.color3}
      indicatorColor={currentTheme?.color4}
      rippleColor={hexToRGB(currentTheme?.color1, 0.5)}
      labelStyle={{ fontSize: 13, fontWeight: '700', color: currentTheme?.color1 }}
      iconColor={currentTheme?.color1}
      labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="index">
        <Label>Anime</Label>
        <Icon src={require('../../svg/anime-icon.svg')} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="manga">
        <Label>Manga</Label>
        <Icon src={require('../../svg/manga-icon.svg')} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="movies">
        <Label>Movies</Label>
        <Icon src={require('../../svg/movies-icon.svg')} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Label>More</Label>
        <Icon src={require('../../svg/more-icon.svg')} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
