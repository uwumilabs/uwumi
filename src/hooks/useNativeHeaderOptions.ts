import { useMemo } from 'react';
import type { NativeStackNavigationOptions } from 'expo-router';
import { useCurrentTheme } from './useCurrentTheme';
import { usePureBlackBackground } from './stores/useThemeStore';

/** The native stack header in the theme's colours, over a screen in the same background */
export const useNativeHeaderOptions = (): NativeStackNavigationOptions => {
  const theme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const background = pureBlackBackground ? '#000' : theme.background;

  return useMemo(
    () => ({
      headerStyle: { backgroundColor: background },
      headerTintColor: theme.foreground,
      headerTitleStyle: { color: theme.foreground },
      headerTitleAlign: 'center',
      headerShadowVisible: false,
      headerBackButtonDisplayMode: 'minimal',
      contentStyle: { backgroundColor: background },
    }),
    [background, theme.foreground],
  );
};
