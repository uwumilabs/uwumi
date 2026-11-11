import { useMemo } from 'react';
import { themes } from '@/themes/theme';
import { usePureBlackBackground, useThemeStore } from './stores/useThemeStore';

const AMOLED_SURFACE = '#0c0c0c';

/** The theme's colours, and the ones pure black changes: screens go black, sheets and the TV rail near black */
export const useCurrentTheme = () => {
  const themeName = useThemeStore((state) => state.themeName);
  const isDark = useThemeStore((state) => state.isDark);
  const pureBlack = usePureBlackBackground((state) => state.pureBlackBackground);

  return useMemo(() => {
    const theme = themes[themeName];
    return {
      ...theme,
      screenBackground: pureBlack ? '#000000' : theme.background,
      sheetBackground: isDark && pureBlack ? AMOLED_SURFACE : theme.background,
      railBackground: pureBlack ? AMOLED_SURFACE : theme.segment,
    };
  }, [themeName, isDark, pureBlack]);
};
