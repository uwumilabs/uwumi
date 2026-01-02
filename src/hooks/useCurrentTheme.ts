import { themes } from '@/themes/theme';
import { useThemeStore } from './stores/useThemeStore';
import { useMemo } from 'react';

export const useCurrentTheme = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);

  return useMemo(() => {
    const fallbackKey = (Object.keys(themes)[0] ?? 'default-dark') as keyof typeof themes;
    const baseTheme = themes[currentTheme as keyof typeof themes] ?? themes[fallbackKey];
    return {
      ...baseTheme,
      amoledSurfaceVariant: '#0c0c0c',
    };
  }, [currentTheme]);
};
