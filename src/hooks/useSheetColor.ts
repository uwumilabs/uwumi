import { useCurrentTheme, usePureBlackBackground, useThemeStore } from '@/hooks';

export function useSheetColor() {
  const isDark = useThemeStore((state) => state.isDark);
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const currentTheme = useCurrentTheme();

  const sheetColor =
    isDark && pureBlackBackground
      ? currentTheme.amoledSurfaceVariant
      : //   : isDark && !pureBlackBackground
        //     ? currentTheme.divider
        currentTheme.background;

  return sheetColor;
}
