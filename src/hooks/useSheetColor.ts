import { useCurrentTheme, usePureBlackBackground, useThemeStore } from '@/hooks';

export function useSheetColor() {
  const themeName = useThemeStore((state) => state.themeName);
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const currentTheme = useCurrentTheme();

  const sheetColor =
    themeName === 'dark' && pureBlackBackground
      ? currentTheme.color5
      : themeName === 'dark' && !pureBlackBackground
        ? currentTheme.color3
        : currentTheme.background;

  return sheetColor;
}
