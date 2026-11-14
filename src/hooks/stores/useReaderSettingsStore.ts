import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './MMKV';

export type ReaderBackground = 'theme' | 'black' | 'gray' | 'white';
/** Mihon's tap zone layouts */
export type TapZonesLayout = 'l-shaped' | 'kindlish' | 'edge' | 'right-left' | 'disabled';
export type InvertTapZones = 'none' | 'horizontal' | 'vertical' | 'both';
/** Mihon's reading modes; saved by id, so don't rename them */
export type ReadingMode = 'paged-ltr' | 'paged-rtl' | 'paged-vertical' | 'long-strip' | 'long-strip-gaps';

interface ReadingModeTraits {
  label: string;
  /** A page per screen, snapping, with zoomable pages and transition pages between chapters; otherwise a strip */
  paged: boolean;
  /** Pages run sideways */
  horizontal: boolean;
  /** The chapter runs leftwards, and the right-and-left tap zones swap */
  rtl: boolean;
  /** Space between the strip's pages */
  gaps: boolean;
}

/** What each reading mode is called and how the reader lays it out, in the settings' order */
export const READING_MODES: Record<ReadingMode, ReadingModeTraits> = {
  'paged-ltr': { label: 'Paged (left to right)', paged: true, horizontal: true, rtl: false, gaps: false },
  'paged-rtl': { label: 'Paged (right to left)', paged: true, horizontal: true, rtl: true, gaps: false },
  'paged-vertical': { label: 'Paged (vertical)', paged: true, horizontal: false, rtl: false, gaps: false },
  'long-strip': { label: 'Long strip', paged: false, horizontal: false, rtl: false, gaps: false },
  'long-strip-gaps': { label: 'Long strip with gaps', paged: false, horizontal: false, rtl: false, gaps: true },
};

export interface ReaderSettings {
  readingMode: ReadingMode;
  /** Behind the pages; `theme` follows the app's background */
  background: ReaderBackground;
  keepScreenOn: boolean;
  /** A "page / total" pill while reading */
  showPageNumber: boolean;
  /** Space each side of the pages, in percent of the screen's width */
  sidePadding: number;
  /** Where a tap on the pages goes back, forward or opens the menu */
  tapZones: TapZonesLayout;
  invertTapZones: InvertTapZones;
  /** Briefly show the tap zones as the reader opens */
  showTapZonesOverlay: boolean;
}

interface ReaderSettingsState extends ReaderSettings {
  update: (settings: Partial<ReaderSettings>) => void;
}

export const useReaderSettingsStore = create<ReaderSettingsState>()(
  persist(
    (set) => ({
      readingMode: 'paged-ltr',
      background: 'theme',
      keepScreenOn: true,
      showPageNumber: true,
      sidePadding: 0,
      tapZones: 'l-shaped',
      invertTapZones: 'none',
      showTapZonesOverlay: true,
      // A backup can carry a mode this version doesn't have; the reader needs one it knows
      update: ({ readingMode, ...settings }) =>
        set(readingMode && readingMode in READING_MODES ? { ...settings, readingMode } : settings),
    }),
    {
      name: 'readerSettings',
      storage: persistStorage,
    },
  ),
);
