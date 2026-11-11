import { useMemo } from 'react';
import type { NativeStackNavigationOptions } from 'expo-router';
import { useCurrentTheme } from './useCurrentTheme';

export const useNativeHeaderOptions = (): NativeStackNavigationOptions => {
  const theme = useCurrentTheme();
  const background = theme.screenBackground;

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
