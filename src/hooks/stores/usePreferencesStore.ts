import { create } from 'zustand';
import { storage } from './MMKV';

const INCOGNITO_KEY = 'incognito';
const DOWNLOADED_ONLY_KEY = 'downloadedOnly';

interface PreferencesState {
  /** Pauses watch history: the player saves no progress and records no Continue Watching entry */
  incognito: boolean;
  /** Favorites, Continue Watching and History only show titles with a finished download */
  downloadedOnly: boolean;
  setIncognito: (value: boolean) => void;
  setDownloadedOnly: (value: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()((set) => ({
  incognito: storage.getBoolean(INCOGNITO_KEY) ?? false,
  downloadedOnly: storage.getBoolean(DOWNLOADED_ONLY_KEY) ?? false,
  setIncognito: (value) => {
    storage.set(INCOGNITO_KEY, value);
    set({ incognito: value });
  },
  setDownloadedOnly: (value) => {
    storage.set(DOWNLOADED_ONLY_KEY, value);
    set({ downloadedOnly: value });
  },
}));
