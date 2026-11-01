import { create } from 'zustand';
import { storage } from './MMKV';

const INCOGNITO_KEY = 'incognito';
const DOWNLOADED_ONLY_KEY = 'downloadedOnly';
const EPISODE_NOTIFICATIONS_KEY = 'episodeNotifications';
const CLEAR_CACHE_ON_LAUNCH_KEY = 'clearCacheOnLaunch';
const AUTO_BACKUP_DAYS_KEY = 'autoBackupDays';
const BACKUP_FOLDER_KEY = 'backupFolderUri';
const LAST_AUTO_BACKUP_KEY = 'lastAutoBackupAt';

interface PreferencesState {
  /** Pauses watch history: the player saves no progress and records no Continue Watching entry */
  incognito: boolean;
  /** Favorites, Continue Watching and History only show titles with a finished download */
  downloadedOnly: boolean;
  /** A notification when a favorite's next episode airs */
  episodeNotifications: boolean;
  /** Empties the cache folder as the app starts */
  clearCacheOnLaunch: boolean;
  setIncognito: (value: boolean) => void;
  setDownloadedOnly: (value: boolean) => void;
  setEpisodeNotifications: (value: boolean) => void;
  setClearCacheOnLaunch: (value: boolean) => void;
  /** Days between automatic backups; 0 turns them off */
  autoBackupDays: number;
  /**
   * The folder backups go to, picked once, outside uwumi's own storage so they survive an uninstall: its URI on
   * Android, a bookmark of it on iOS
   */
  backupFolderUri: string | null;
  lastAutoBackupAt: number;
  setAutoBackupDays: (days: number) => void;
  setBackupFolderUri: (uri: string | null) => void;
  setLastAutoBackupAt: (time: number) => void;
}

export const usePreferencesStore = create<PreferencesState>()((set) => ({
  incognito: storage.getBoolean(INCOGNITO_KEY) ?? false,
  downloadedOnly: storage.getBoolean(DOWNLOADED_ONLY_KEY) ?? false,
  episodeNotifications: storage.getBoolean(EPISODE_NOTIFICATIONS_KEY) ?? true,
  clearCacheOnLaunch: storage.getBoolean(CLEAR_CACHE_ON_LAUNCH_KEY) ?? false,
  autoBackupDays: storage.getNumber(AUTO_BACKUP_DAYS_KEY) ?? 0,
  backupFolderUri: storage.getString(BACKUP_FOLDER_KEY) ?? null,
  lastAutoBackupAt: storage.getNumber(LAST_AUTO_BACKUP_KEY) ?? 0,
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
  setClearCacheOnLaunch: (value) => {
    storage.set(CLEAR_CACHE_ON_LAUNCH_KEY, value);
    set({ clearCacheOnLaunch: value });
  },
  setAutoBackupDays: (days) => {
    storage.set(AUTO_BACKUP_DAYS_KEY, days);
    set({ autoBackupDays: days });
  },
  setBackupFolderUri: (uri) => {
    if (uri) storage.set(BACKUP_FOLDER_KEY, uri);
    else storage.remove(BACKUP_FOLDER_KEY);
    set({ backupFolderUri: uri });
  },
  setLastAutoBackupAt: (time) => {
    storage.set(LAST_AUTO_BACKUP_KEY, time);
    set({ lastAutoBackupAt: time });
  },
}));
