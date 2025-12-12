import { themes } from '@/themes/theme';
import { useThemeStore } from './stores/useThemeStore';

export const useCurrentTheme = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  return themes[currentTheme];
};
