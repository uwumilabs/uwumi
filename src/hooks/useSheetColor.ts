import { useCurrentTheme, usePureBlackBackground, useThemeStore } from '@/hooks';

export function useSheetColor() {
  const isDark = useThemeStore((state) => state.isDark);
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const currentTheme = useCurrentTheme();

  const sheetColor =
    isDark && pureBlackBackground
      ? currentTheme.color5
      : isDark && !pureBlackBackground
        ? currentTheme.color3
        : currentTheme.background;

  return sheetColor;
}
