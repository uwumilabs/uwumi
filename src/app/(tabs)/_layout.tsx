import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { BookImage, Ellipsis, TvMinimalPlay } from '@tamagui/lucide-icons';
import { View } from 'tamagui';
import { useThemeStore, useCurrentTheme, usePureBlackBackground } from '@/hooks';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import AnimeIcon from '@/components/SVG/AnimeIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TabLayout() {
  const themeName = useThemeStore((state) => state.themeName);
  const currentTheme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const insets = useSafeAreaInsets();

  SystemNavigationBar.setNavigationColor(pureBlackBackground ? currentTheme?.color5 : currentTheme?.color3 || 'black');

  // Memoize TabBarCapsule component
  const TabBarCapsule = useCallback(
    ({ focused, children }: { focused: boolean; children: React.ReactNode }) => {
      return (
        <View
          width={focused ? 70 : 30}
          height={30}
          alignItems="center"
          justifyContent="center"
          borderRadius={100}
          animation="quick"
          backgroundColor={focused ? currentTheme?.color4 : 'transparent'}>
          {children}
        </View>
      );
    },
    [currentTheme?.color4],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeName === 'dark' ? '#fff' : '#000',
        tabBarInactiveTintColor: themeName === 'dark' ? '#ccc' : '#333',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: 'bold',
        },
        tabBarStyle: {
          height: 64 + insets.bottom, //bcoz of edge-to-edge support
          backgroundColor: pureBlackBackground ? currentTheme?.color5 : currentTheme?.color3,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Anime',
          tabBarIcon: ({ focused, color }) => (
            <TabBarCapsule focused={focused}>
              <AnimeIcon color={color} />
            </TabBarCapsule>
          ),
        }}
      />
      <Tabs.Screen
        name="manga"
        options={{
          title: 'Manga',
          tabBarIcon: ({ focused, color }) => (
            <TabBarCapsule focused={focused}>
              <BookImage color={color} />
            </TabBarCapsule>
          ),
        }}
      />
      <Tabs.Screen
        name="movies"
        options={{
          title: 'Movies',
          tabBarIcon: ({ focused, color }) => (
            <TabBarCapsule focused={focused}>
              <TvMinimalPlay color={color} />
            </TabBarCapsule>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused, color }) => (
            <TabBarCapsule focused={focused}>
              <Ellipsis color={color} />
            </TabBarCapsule>
          ),
        }}
      />
    </Tabs>
  );
}
