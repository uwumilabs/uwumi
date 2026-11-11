import { create } from 'zustand';
import { Uniwind } from 'uniwind';
import { storage } from '@/hooks/stores/MMKV';
import { themes, ThemeName } from '@/themes/theme';

const themeNames = Object.keys(themes) as ThemeName[];

/** A theme's family, without its light or dark: `cloudflare-dark` → `cloudflare` */
export const themeBase = (name: string) => name.replace(/-(light|dark)$/i, '');

interface ThemeState {
  themeName: ThemeName;
  isDark: boolean;
  setTheme: (theme: ThemeName) => void;
  /** The same family's other mode, or the first theme in that mode */
  toggleTheme: () => void;
}

const getInitialTheme = (): ThemeName => {
  const saved = storage.getString('theme');
  if (saved && themeNames.includes(saved as ThemeName)) return saved as ThemeName;
  return themeNames.find((t) => t.endsWith('-dark')) ?? themeNames[0];
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const setTheme = (theme: ThemeName) => {
    if (!themeNames.includes(theme)) return;
    Uniwind.setTheme(theme);
    storage.set('theme', theme);
    set({ themeName: theme, isDark: theme.includes('dark') });
  };
  const initial = getInitialTheme();
  return {
    themeName: initial,
    isDark: initial.includes('dark'),
    setTheme,
    toggleTheme: () => {
      const current = get().themeName;
      const toDark = current.includes('light');
      const preferred = `${themeBase(current)}-${toDark ? 'dark' : 'light'}` as ThemeName;
      const next = themeNames.includes(preferred)
        ? preferred
        : themeNames.find((t) => (toDark ? t.includes('dark') : t.includes('light')));
      if (next) setTheme(next);
    },
  };
});

interface PureBlackState {
  pureBlackBackground: boolean;
  setPureBlackBackground: (value: boolean) => void;
}

export const usePureBlackBackground = create<PureBlackState>((set) => ({
  pureBlackBackground: storage.getString('pureBlack') === 'true',
  setPureBlackBackground: (value: boolean) => {
    storage.set('pureBlack', value.toString());
    set({ pureBlackBackground: value });
  },
}));
