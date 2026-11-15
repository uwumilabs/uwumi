import { useMemo } from 'react';
import { themes } from '@/themes/theme';
import { isDarkTheme, usePureBlackBackground, useThemeStore } from './stores/useThemeStore';

const AMOLED_SURFACE = '#0c0c0c';

/**
 * The theme's colours, and what pure black changes in dark themes: screens go black, sheets, bars and the TV rail
 * near black. `isPureBlack` is for className sites (`bg-black`).
 */
export const useCurrentTheme = () => {
  const themeName = useThemeStore((state) => state.themeName);
  const pureBlack = usePureBlackBackground((state) => state.pureBlackBackground);

  return useMemo(() => {
    const theme = themes[themeName];
    const isDark = isDarkTheme(themeName);
    const isPureBlack = pureBlack && isDark;
    return {
      ...theme,
      isDark,
      isPureBlack,
      screenBackground: isPureBlack ? '#000000' : theme.background,
      sheetBackground: isPureBlack ? AMOLED_SURFACE : theme.background,
      barBackground: isPureBlack ? AMOLED_SURFACE : theme.surface,
      railBackground: isPureBlack ? AMOLED_SURFACE : theme.segment,
    };
  }, [themeName, pureBlack]);
};
