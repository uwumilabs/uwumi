import { create } from 'zustand';
import { storage } from './MMKV';

const INCOGNITO_KEY = 'incognito';
const DOWNLOADED_ONLY_KEY = 'downloadedOnly';
const EPISODE_NOTIFICATIONS_KEY = 'episodeNotifications';

interface PreferencesState {
  /** Pauses watch history: the player saves no progress and records no Continue Watching entry */
  incognito: boolean;
  /** Favorites, Continue Watching and History only show titles with a finished download */
  downloadedOnly: boolean;
  /** A notification when a favorite's next episode airs */
  episodeNotifications: boolean;
  setIncognito: (value: boolean) => void;
  setDownloadedOnly: (value: boolean) => void;
  setEpisodeNotifications: (value: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()((set) => ({
  incognito: storage.getBoolean(INCOGNITO_KEY) ?? false,
  downloadedOnly: storage.getBoolean(DOWNLOADED_ONLY_KEY) ?? false,
  episodeNotifications: storage.getBoolean(EPISODE_NOTIFICATIONS_KEY) ?? true,
  setIncognito: (value) => {
    storage.set(INCOGNITO_KEY, value);
    set({ incognito: value });
  },
  setDownloadedOnly: (value) => {
    storage.set(DOWNLOADED_ONLY_KEY, value);
    set({ downloadedOnly: value });
  },
  setEpisodeNotifications: (value) => {
    storage.set(EPISODE_NOTIFICATIONS_KEY, value);
    set({ episodeNotifications: value });
  },
}));
