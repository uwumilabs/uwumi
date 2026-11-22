import { Platform } from 'react-native';
import type { CaptionsTheme } from 'react-native-video-toolkit';

interface StyleOption {
  label: string;
  value: string;
  theme: Partial<CaptionsTheme>;
}

/**
 * The pick-one subtitle style settings, which the settings screen and the player menu both list. Each
 * setting's first option is its default, and matches the toolkit's own.
 */
export const SUBTITLE_STYLE = {
  subtitleSize: {
    title: 'Text size',
    options: [
      { label: 'Auto', value: 'auto', theme: { fontSize: 'auto' } },
      { label: 'Small', value: 'small', theme: { fontSize: 16 } },
      { label: 'Medium', value: 'medium', theme: { fontSize: 20 } },
      { label: 'Large', value: 'large', theme: { fontSize: 24 } },
      { label: 'Extra large', value: 'xlarge', theme: { fontSize: 28 } },
    ],
  },
  subtitleFont: {
    title: 'Font',
    options: [
      { label: 'System', value: 'system', theme: {} },
      { label: 'Serif', value: 'serif', theme: { fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }) } },
      {
        label: 'Monospace',
        value: 'mono',
        theme: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
      },
    ],
  },
  subtitleColor: {
    title: 'Text colour',
    options: [
      { label: 'White', value: 'white', theme: { color: '#FFFFFF' } },
      { label: 'Yellow', value: 'yellow', theme: { color: '#FFEB3B' } },
      { label: 'Cyan', value: 'cyan', theme: { color: '#4DD0E1' } },
      { label: 'Green', value: 'green', theme: { color: '#69F0AE' } },
      { label: 'Pink', value: 'pink', theme: { color: '#FF80AB' } },
    ],
  },
  subtitleBackground: {
    title: 'Background',
    options: [
      { label: 'Dark', value: 'dark', theme: { backgroundColor: 'rgba(0, 0, 0, 0.75)' } },
      { label: 'Light', value: 'light', theme: { backgroundColor: 'rgba(0, 0, 0, 0.4)' } },
      { label: 'Solid', value: 'solid', theme: { backgroundColor: '#000000' } },
      { label: 'None', value: 'none', theme: { backgroundColor: 'transparent' } },
    ],
  },
  subtitleEdge: {
    title: 'Edge',
    options: [
      { label: 'None', value: 'none', theme: {} },
      { label: 'Outline', value: 'outline', theme: { outlineWidth: 2, outlineColor: '#000000' } },
      {
        label: 'Drop shadow',
        value: 'shadow',
        theme: { shadowColor: 'rgba(0, 0, 0, 0.9)', shadowOffset: { width: 1, height: 1 }, shadowRadius: 3 },
      },
    ],
  },
  subtitlePosition: {
    title: 'Position',
    options: [
      { label: 'On the picture', value: 'video', theme: { position: 'video' } },
      { label: 'In the black bars', value: 'bars', theme: { position: 'bars' } },
    ],
  },
  subtitleMargin: {
    title: 'Distance from bottom',
    options: [
      { label: 'Normal', value: 'normal', theme: { bottomMargin: 0.05 } },
      { label: 'Low', value: 'low', theme: { bottomMargin: 0.02 } },
      { label: 'High', value: 'high', theme: { bottomMargin: 0.1 } },
    ],
  },
} satisfies Record<string, { title: string; options: StyleOption[] }>;

export type SubtitleStyleKey = keyof typeof SUBTITLE_STYLE;

export const SUBTITLE_STYLE_KEYS = Object.keys(SUBTITLE_STYLE) as SubtitleStyleKey[];

export type SubtitleStyle = Record<SubtitleStyleKey, string> & { subtitleBold: boolean; subtitleCaps: boolean };

/** A setting's chosen option; an unknown value, such as one from an old backup, is the default */
export const subtitleStyleOption = (key: SubtitleStyleKey, value: string | undefined): StyleOption => {
  const options: StyleOption[] = SUBTITLE_STYLE[key].options;
  return options.find((option) => option.value === value) ?? options[0];
};

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  ...(Object.fromEntries(SUBTITLE_STYLE_KEYS.map((key) => [key, SUBTITLE_STYLE[key].options[0].value])) as Record<
    SubtitleStyleKey,
    string
  >),
  subtitleBold: false,
  subtitleCaps: false,
};

/** The subtitle style fields of a settings object, for a selector that compares them shallowly */
export const pickSubtitleStyle = (settings: SubtitleStyle): SubtitleStyle => ({
  ...(Object.fromEntries(SUBTITLE_STYLE_KEYS.map((key) => [key, settings[key]])) as Record<SubtitleStyleKey, string>),
  subtitleBold: settings.subtitleBold,
  subtitleCaps: settings.subtitleCaps,
});

export const isDefaultSubtitleStyle = (style: SubtitleStyle) =>
  (Object.keys(DEFAULT_SUBTITLE_STYLE) as (keyof SubtitleStyle)[]).every(
    (key) => style[key] === DEFAULT_SUBTITLE_STYLE[key],
  );

/** The toolkit's `theme.captions` for a style */
export const captionsTheme = (style: SubtitleStyle): Partial<CaptionsTheme> => ({
  ...Object.assign({}, ...SUBTITLE_STYLE_KEYS.map((key) => subtitleStyleOption(key, style[key]).theme)),
  ...(style.subtitleBold ? { fontWeight: 'bold' } : null),
  ...(style.subtitleCaps ? { textTransform: 'uppercase' } : null),
});

/** A one-line summary for the settings row: "Auto size, white on dark" */
export const subtitleStyleSummary = (style: SubtitleStyle) => {
  const label = (key: SubtitleStyleKey) => subtitleStyleOption(key, style[key]).label.toLowerCase();
  const background = style.subtitleBackground === 'none' ? ', no background' : ` on ${label('subtitleBackground')}`;
  return `${subtitleStyleOption('subtitleSize', style.subtitleSize).label} size, ${label('subtitleColor')}${background}`;
};
