import { requireOptionalNativeModule } from 'expo';
import { themes, type ThemeName } from '@/themes/theme';

interface CastDialogModule {
  setTheme: (name: string, background: string, text: string, secondaryText: string, accent: string) => Promise<void>;
}

/** CastDialogModule.kt and .swift beside this file. Missing from builds made before it. */
const castDialogModule = requireOptionalNativeModule<CastDialogModule>('CastDialogModule');

/** uwumi's dialog colours. plugins/withCastDialogTheme.js picks the same ones for Android's styles. */
const castDialogColors = (name: ThemeName) => {
  const theme = themes[name];
  return [theme.overlay, theme.overlayForeground, theme.muted, theme.accent] as const;
};

/** Gives Google's Cast dialogs the theme's colours; call it before opening one */
export const themeCastDialog = (name: ThemeName) => castDialogModule?.setTheme(name, ...castDialogColors(name));
