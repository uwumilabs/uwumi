import { create } from 'zustand';
import { storage } from '@/hooks/stores/MMKV';
import { Uniwind } from 'uniwind';
import { themes, ThemeName } from '@/themes/theme';

// export type ThemeName = Parameters<typeof Uniwind.setTheme>[0];

interface ThemeState {
  themeName: ThemeName;
  currentTheme: ThemeName;
  isLight: boolean;
  isDark: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

const themeNames = Object.keys(themes) as ThemeName[];

const getInitialTheme = (): ThemeName => {
  const saved = storage.getString('theme');
  if (saved && themeNames.includes(saved as ThemeName)) return saved as ThemeName;
  return (themeNames.find((t) => t.endsWith('-dark')) as ThemeName) || themeNames[0];
};

const computeFlags = (theme: ThemeName) => ({
  isLight: theme.includes('light'),
  isDark: theme.includes('dark'),
});

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();
  const flags = computeFlags(initialTheme);

  const setTheme = (newTheme: ThemeName) => {
    if (!themeNames.includes(newTheme)) return;
    Uniwind.setTheme(newTheme);
    storage.set('theme', newTheme);
    set({ themeName: newTheme, currentTheme: newTheme, ...computeFlags(newTheme) });
  };

  const toggleTheme = () => {
    const current = get().themeName;
    const base = current.replace(/-(light|dark)$/i, '');
    const prefersDark = current.includes('light');
    const preferred = `${base}-${prefersDark ? 'dark' : 'light'}` as ThemeName;

    if (themeNames.includes(preferred)) {
      setTheme(preferred);
      return;
    }

    const fallback = themeNames.find((t) => (prefersDark ? t.includes('dark') : t.includes('light'))) as
      | ThemeName
      | undefined;

    if (fallback) setTheme(fallback);
  };

  return {
    themeName: initialTheme,
    currentTheme: initialTheme,
    ...flags,
    setTheme,
    toggleTheme,
  };
});

interface PureBlackState {
  pureBlackBackground: boolean;
  setPureBlackBackground: (value: boolean) => void;
}

const getInitialPureBlack = (): boolean => {
  const saved = storage.getString('pureBlack');
  return saved ? saved === 'true' : false;
};

export const usePureBlackBackground = create<PureBlackState>((set) => ({
  pureBlackBackground: getInitialPureBlack(),
  setPureBlackBackground: (value: boolean) => {
    storage.set('pureBlack', value.toString());
    set({ pureBlackBackground: value });
  },
}));
