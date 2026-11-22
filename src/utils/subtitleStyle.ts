import { Platform } from 'react-native';
import type { CaptionsTheme } from 'react-native-video-toolkit';

type Theme = Partial<CaptionsTheme>;

interface StyleOption {
  label: string;
  value: string;
  theme: Theme;
}

type SubtitleStyleSection = 'text' | 'background' | 'position';

export const SUBTITLE_STYLE_SECTIONS: { key: SubtitleStyleSection; title: string }[] = [
  { key: 'text', title: 'Text' },
  { key: 'background', title: 'Background' },
  { key: 'position', title: 'Position' },
];

const NO_BACKGROUND = 'none';

// The first option of each is the toolkit's own default, so it sets nothing
const SUBTITLE_CHOICES = {
  subtitleSize: {
    section: 'text',
    title: 'Text size',
    options: [
      { label: 'Auto', value: 'auto', theme: {} },
      { label: 'Small', value: 'small', theme: { fontSize: 16 } },
      { label: 'Medium', value: 'medium', theme: { fontSize: 20 } },
      { label: 'Large', value: 'large', theme: { fontSize: 24 } },
      { label: 'Extra large', value: 'xlarge', theme: { fontSize: 28 } },
    ],
  },
  subtitleFont: {
    section: 'text',
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
    section: 'text',
    title: 'Text colour',
    options: [
      { label: 'White', value: 'white', theme: {} },
      { label: 'Yellow', value: 'yellow', theme: { color: '#FFEB3B' } },
      { label: 'Cyan', value: 'cyan', theme: { color: '#4DD0E1' } },
      { label: 'Green', value: 'green', theme: { color: '#69F0AE' } },
      { label: 'Pink', value: 'pink', theme: { color: '#FF80AB' } },
    ],
  },
  subtitleBackground: {
    section: 'background',
    title: 'Background',
    options: [
      { label: 'Dark', value: 'dark', theme: {} },
      { label: 'Light', value: 'light', theme: { backgroundColor: 'rgba(0, 0, 0, 0.4)' } },
      { label: 'Solid', value: 'solid', theme: { backgroundColor: '#000000' } },
      { label: 'None', value: NO_BACKGROUND, theme: { backgroundColor: 'transparent' } },
    ],
  },
  subtitleEdge: {
    section: 'background',
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
    section: 'position',
    title: 'Position',
    options: [
      { label: 'On the picture', value: 'video', theme: {} },
      { label: 'In the black bars', value: 'bars', theme: { position: 'bars' } },
    ],
  },
  subtitleMargin: {
    section: 'position',
    title: 'Distance from bottom',
    options: [
      { label: 'Normal', value: 'normal', theme: {} },
      { label: 'Low', value: 'low', theme: { bottomMargin: 0.02 } },
      { label: 'High', value: 'high', theme: { bottomMargin: 0.1 } },
    ],
  },
} satisfies Record<string, { section: SubtitleStyleSection; title: string; options: StyleOption[] }>;

// Off by default
const SUBTITLE_TOGGLES = {
  subtitleBold: { section: 'text', title: 'Bold', theme: { fontWeight: 'bold' } },
  subtitleCaps: { section: 'text', title: 'All caps', theme: { textTransform: 'uppercase' } },
} satisfies Record<string, { section: SubtitleStyleSection; title: string; theme: Theme }>;

type SubtitleChoiceKey = keyof typeof SUBTITLE_CHOICES;
type SubtitleToggleKey = keyof typeof SUBTITLE_TOGGLES;
export type SubtitleStyle = Record<SubtitleChoiceKey, string> & Record<SubtitleToggleKey, boolean>;

const CHOICE_KEYS = Object.keys(SUBTITLE_CHOICES) as SubtitleChoiceKey[];
const TOGGLE_KEYS = Object.keys(SUBTITLE_TOGGLES) as SubtitleToggleKey[];

interface RowBase {
  section: SubtitleStyleSection;
  title: string;
  /** The rows' testIDs end with it: `subtitleSize` → `size` */
  id: string;
}

export type SubtitleStyleRow =
  | (RowBase & { kind: 'choice'; key: SubtitleChoiceKey; options: StyleOption[] })
  | (RowBase & { kind: 'toggle'; key: SubtitleToggleKey });

const rowId = (key: string) => key.replace('subtitle', '').toLowerCase();

/** Every setting, in the order the settings screen (by section) and the player menu list them */
export const SUBTITLE_STYLE_ROWS: SubtitleStyleRow[] = [
  ...CHOICE_KEYS.map((key) => ({ kind: 'choice' as const, key, id: rowId(key), ...SUBTITLE_CHOICES[key] })),
  ...TOGGLE_KEYS.map((key) => ({
    kind: 'toggle' as const,
    key,
    id: rowId(key),
    section: SUBTITLE_TOGGLES[key].section,
    title: SUBTITLE_TOGGLES[key].title,
  })),
];

/** A choice's option; an unknown value, such as one from an old backup, is the default */
export const subtitleChoice = (key: SubtitleChoiceKey, value: string): StyleOption => {
  const options: StyleOption[] = SUBTITLE_CHOICES[key].options;
  return options.find((option) => option.value === value) ?? options[0];
};

export const DEFAULT_SUBTITLE_STYLE = {
  ...Object.fromEntries(CHOICE_KEYS.map((key) => [key, SUBTITLE_CHOICES[key].options[0].value])),
  ...Object.fromEntries(TOGGLE_KEYS.map((key) => [key, false])),
} as SubtitleStyle;

/** The style's fields alone, for a selector that compares them shallowly */
export const pickSubtitleStyle = (settings: SubtitleStyle) =>
  Object.fromEntries([...CHOICE_KEYS, ...TOGGLE_KEYS].map((key) => [key, settings[key]])) as SubtitleStyle;

export const isDefaultSubtitleStyle = (style: SubtitleStyle) =>
  CHOICE_KEYS.every((key) => subtitleChoice(key, style[key]) === SUBTITLE_CHOICES[key].options[0]) &&
  TOGGLE_KEYS.every((key) => !style[key]);

/** The toolkit's `theme.captions` for a style */
export const captionsTheme = (style: SubtitleStyle): Theme =>
  Object.assign(
    {},
    ...CHOICE_KEYS.map((key) => subtitleChoice(key, style[key]).theme),
    ...TOGGLE_KEYS.filter((key) => style[key]).map((key) => SUBTITLE_TOGGLES[key].theme),
  );

/** "Auto size, white on dark" */
export const subtitleStyleSummary = (style: SubtitleStyle) => {
  const size = subtitleChoice('subtitleSize', style.subtitleSize).label;
  const color = subtitleChoice('subtitleColor', style.subtitleColor).label.toLowerCase();
  const background = subtitleChoice('subtitleBackground', style.subtitleBackground);
  return background.value === NO_BACKGROUND
    ? `${size} size, ${color}, no background`
    : `${size} size, ${color} on ${background.label.toLowerCase()}`;
};
