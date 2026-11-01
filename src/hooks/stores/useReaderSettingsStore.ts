import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from './MMKV';

export type ReaderBackground = 'theme' | 'black' | 'gray' | 'white';
/** Mihon's tap zone layouts */
export type TapZonesLayout = 'l-shaped' | 'kindlish' | 'edge' | 'right-left' | 'disabled';
export type InvertTapZones = 'none' | 'horizontal' | 'vertical' | 'both';
/** Mihon's reading modes */
export type ReadingMode = 'paged-ltr' | 'paged-rtl' | 'paged-vertical' | 'long-strip' | 'long-strip-gaps';

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
      update: (settings) => set(settings),
    }),
    {
      name: 'readerSettings',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) ?? null,
        removeItem: (name) => storage.remove(name),
      })),
    },
  ),
);
