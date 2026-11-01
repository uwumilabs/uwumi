import { Platform, Share } from 'react-native';
import * as Application from 'expo-application';
import { Directory, File } from 'expo-file-system';
import { storage } from '@/hooks/stores/MMKV';
import { useContinueWatchingStore } from '@/hooks/stores/useContinueWatchingStore';
import { useExtensionStore } from '@/hooks/stores/useExtensionStore';
import { useExternalSubtitleStore } from '@/hooks/stores/useExternalSubtitleStore';
import { useFavoriteStore } from '@/hooks/stores/useFavoriteStore';
import { useLastServerStore } from '@/hooks/stores/useLastServerStore';
import { useMangaProgressStore } from '@/hooks/stores/useMangaProgressStore';
import { usePlayerSettingsStore, type PlayerSettings } from '@/hooks/stores/usePlayerSettingsStore';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import { useReaderSettingsStore, type ReaderSettings } from '@/hooks/stores/useReaderSettingsStore';
import { useRecentSearchesStore } from '@/hooks/stores/useRecentSearchesStore';
import { usePureBlackBackground, useThemeStore } from '@/hooks/stores/useThemeStore';
import { useWatchProgressStore } from '@/hooks/stores/useWatchProgressStore';
import { useProviderStore } from '@/constants/provider';
import { UWUMI_DIR } from '@/constants/config';
import { fsDirectory } from '@/constants/utils';
import { MediaType } from '@/constants/types';
import type { ThemeName } from '@/themes/theme';
import { backupFolderModule } from '@/modules/backupFolder';

const FORMAT = 1;
const AUTO_PREFIX = 'uwumi_auto_';
// Only backups uwumi named itself are pruned, never one the user named alike
const AUTO_BACKUP_NAME = /^uwumi_auto_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}(-\d{2})?\.json$/;
const KEEP_AUTO_BACKUPS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
// Far more than any uwumi backup; a bigger pick is some other file, not worth reading into memory
const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
// Installed extensions are marked in MMKV by an `ext_<id>` key
const EXTENSION_KEY = /^ext_(.+)$/;

type Store<T> = { getState: () => T };
type DataOf<T> = { [K in keyof T as T[K] extends (...args: never[]) => unknown ? never : K]: T[K] };

export interface Backup {
  app: 'uwumi';
  format: number;
  createdAt: string;
  appVersion: string | null;
  platform: string;
  library?: {
    favorites?: ReturnType<typeof useFavoriteStore.getState>['favorites'];
    watchProgress?: ReturnType<typeof useWatchProgressStore.getState>['progresses'];
    continueWatching?: ReturnType<typeof useContinueWatchingStore.getState>['entries'];
    mangaProgress?: ReturnType<typeof useMangaProgressStore.getState>['progress'];
    recentSearches?: ReturnType<typeof useRecentSearchesStore.getState>['recent'];
    lastServers?: ReturnType<typeof useLastServerStore.getState>['servers'];
  };
  settings?: {
    theme?: ThemeName;
    pureBlack?: boolean;
    player?: Partial<PlayerSettings>;
    reader?: Partial<ReaderSettings>;
    providers?: Partial<Record<MediaType, string>>;
    subtitleLanguage?: string | null;
    preferences?: {
      incognito?: boolean;
      episodeNotifications?: boolean;
      clearCacheOnLaunch?: boolean;
      autoBackupDays?: number;
    };
  };
  extensions?: string[];
}

export interface RestoreResult {
  favorites: number;
  extensions: number;
  failedExtensions: string[];
}

/** The store's data, without its actions */
const dataOf = <T extends object>(store: Store<T>) =>
  Object.fromEntries(Object.entries(store.getState()).filter(([, value]) => typeof value !== 'function')) as DataOf<T>;

const installedExtensionIds = () =>
  storage.getAllKeys().flatMap((key) => {
    const match = EXTENSION_KEY.exec(key);
    return match ? [match[1]] : [];
  });

/** The backup's extensions that aren't installed here, which a restore installs */
export const missingExtensions = (backup: Backup) => {
  const installed = new Set(installedExtensionIds());
  return (backup.extensions ?? []).filter((id) => !installed.has(id));
};

export const createBackup = (): Backup => {
  const preferences = usePreferencesStore.getState();
  return {
    app: 'uwumi',
    format: FORMAT,
    createdAt: new Date().toISOString(),
    appVersion: Application.nativeApplicationVersion,
    platform: Platform.OS,
    library: {
      favorites: useFavoriteStore.getState().favorites,
      watchProgress: useWatchProgressStore.getState().progresses,
      continueWatching: useContinueWatchingStore.getState().entries,
      mangaProgress: useMangaProgressStore.getState().progress,
      recentSearches: useRecentSearchesStore.getState().recent,
      lastServers: useLastServerStore.getState().servers,
    },
    settings: {
      theme: useThemeStore.getState().themeName,
      pureBlack: usePureBlackBackground.getState().pureBlackBackground,
      player: dataOf(usePlayerSettingsStore),
      reader: dataOf(useReaderSettingsStore),
      providers: useProviderStore.getState().providers,
      subtitleLanguage: useExternalSubtitleStore.getState().language,
      preferences: {
        incognito: preferences.incognito,
        episodeNotifications: preferences.episodeNotifications,
        clearCacheOnLaunch: preferences.clearCacheOnLaunch,
        autoBackupDays: preferences.autoBackupDays,
      },
    },
    extensions: installedExtensionIds(),
  };
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Only the parts of a section that have the right shape; a damaged part is left out rather than restored */
const pick = <T>(value: unknown, check: (value: unknown) => boolean) => (check(value) ? (value as T) : undefined);

/** A backup read from a file, checked; throws a message fit to show when it isn't one uwumi can restore */
export const parseBackup = (text: string): Backup => {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file isn't a uwumi backup");
  }
  if (!isObject(raw) || raw.app !== 'uwumi' || typeof raw.format !== 'number') {
    throw new Error("This file isn't a uwumi backup");
  }
  if (raw.format > FORMAT) throw new Error('This backup was made by a newer uwumi. Update uwumi to restore it');

  const library = isObject(raw.library) ? raw.library : {};
  const settings = isObject(raw.settings) ? raw.settings : {};
  const preferences = isObject(settings.preferences) ? settings.preferences : {};
  const isBoolean = (value: unknown) => typeof value === 'boolean';

  return {
    app: 'uwumi',
    format: raw.format,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    appVersion: typeof raw.appVersion === 'string' ? raw.appVersion : null,
    platform: typeof raw.platform === 'string' ? raw.platform : '',
    library: {
      favorites: pick(library.favorites, Array.isArray),
      watchProgress: pick(library.watchProgress, isObject),
      continueWatching: pick(library.continueWatching, Array.isArray),
      mangaProgress: pick(library.mangaProgress, isObject),
      recentSearches: pick(library.recentSearches, isObject),
      lastServers: pick(library.lastServers, isObject),
    },
    settings: {
      theme: pick(settings.theme, (value) => typeof value === 'string'),
      pureBlack: pick(settings.pureBlack, isBoolean),
      player: pick(settings.player, isObject),
      reader: pick(settings.reader, isObject),
      providers: pick(settings.providers, isObject),
      subtitleLanguage: pick(settings.subtitleLanguage, (value) => value === null || typeof value === 'string'),
      preferences: {
        incognito: pick(preferences.incognito, isBoolean),
        episodeNotifications: pick(preferences.episodeNotifications, isBoolean),
        clearCacheOnLaunch: pick(preferences.clearCacheOnLaunch, isBoolean),
        autoBackupDays: pick(preferences.autoBackupDays, (value) => typeof value === 'number'),
      },
    },
    extensions: pick<string[]>(raw.extensions, Array.isArray)?.filter((id) => typeof id === 'string'),
  };
};

/**
 * Replaces the app's library and settings with the backup's. Extensions come first, as a provider choice falls back
 * when its extension is missing; ones installed now and not in the backup stay. Stores are set directly rather than
 * through their actions, which would rewrite times and skip the writes in incognito.
 */
export const restoreBackup = async (
  backup: Backup,
  onProgress?: (done: number, total: number) => void,
): Promise<RestoreResult> => {
  const missing = missingExtensions(backup);
  const failedExtensions: string[] = [];
  if (missing.length) {
    // Offline, the bundled registry is all there is; what it can't install is reported, and the rest still restores
    await useExtensionStore
      .getState()
      .updateRegistry()
      .catch(() => undefined);
    for (const [index, id] of missing.entries()) {
      onProgress?.(index, missing.length);
      const ok = await useExtensionStore
        .getState()
        .installExtension(id)
        .catch(() => false);
      if (!ok) failedExtensions.push(id);
    }
    onProgress?.(missing.length, missing.length);
  }

  const { library = {}, settings = {} } = backup;
  if (library.favorites) useFavoriteStore.setState({ favorites: library.favorites });
  if (library.watchProgress) useWatchProgressStore.setState({ progresses: library.watchProgress });
  if (library.continueWatching) useContinueWatchingStore.setState({ entries: library.continueWatching });
  if (library.mangaProgress) useMangaProgressStore.setState({ progress: library.mangaProgress });
  if (library.recentSearches) useRecentSearchesStore.setState({ recent: library.recentSearches });
  if (library.lastServers) useLastServerStore.setState({ servers: library.lastServers });

  if (settings.theme) useThemeStore.getState().setTheme(settings.theme);
  if (settings.pureBlack !== undefined) usePureBlackBackground.getState().setPureBlackBackground(settings.pureBlack);
  if (settings.player) usePlayerSettingsStore.getState().update(settings.player);
  if (settings.reader) useReaderSettingsStore.getState().update(settings.reader);
  if (settings.subtitleLanguage !== undefined)
    useExternalSubtitleStore.getState().setLanguage(settings.subtitleLanguage);
  for (const [mediaType, provider] of Object.entries(settings.providers ?? {})) {
    if (typeof provider === 'string') useProviderStore.getState().setProvider(mediaType as MediaType, provider);
  }
  const preferences = usePreferencesStore.getState();
  const saved = settings.preferences ?? {};
  if (saved.incognito !== undefined) preferences.setIncognito(saved.incognito);
  if (saved.episodeNotifications !== undefined) preferences.setEpisodeNotifications(saved.episodeNotifications);
  if (saved.clearCacheOnLaunch !== undefined) preferences.setClearCacheOnLaunch(saved.clearCacheOnLaunch);
  if (saved.autoBackupDays !== undefined) preferences.setAutoBackupDays(saved.autoBackupDays);

  return {
    favorites: library.favorites?.length ?? 0,
    extensions: missing.length - failedExtensions.length,
    failedExtensions,
  };
};

const pad = (value: number) => String(value).padStart(2, '0');

/** `uwumi_2026-11-02_14-30-05.json`, or `uwumi_auto_…` for an automatic one */
export const backupFileName = (date: Date, auto = false) =>
  `${auto ? AUTO_PREFIX : 'uwumi_'}${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(
    date.getHours(),
  )}-${pad(date.getMinutes())}-${pad(date.getSeconds())}.json`;

/** uwumi's own folder, for iOS and for an Android device with no folder picker (Android TV) */
const appBackupFolder = () => {
  const folder = fsDirectory(`${UWUMI_DIR}/backups`);
  if (!folder.exists) folder.create({ intermediates: true, idempotent: true });
  return folder;
};

/**
 * Whether backups can go to a folder chosen outside uwumi, which stays when uwumi is deleted: Android, and iOS builds
 * with the folder module (older ones can only share each backup out)
 */
export const supportsBackupFolder = () => Platform.OS === 'android' || (Platform.OS === 'ios' && !!backupFolderModule);

/**
 * Lets the user choose where backups go, outside uwumi's storage. Android keeps the folder's URI; iOS a bookmark of
 * it, as its access ends when the app closes. Throws when cancelled.
 */
export const pickBackupFolder = async () => {
  if (!supportsBackupFolder()) throw new Error('Update uwumi to choose a backup location');
  const folder = await Directory.pickDirectoryAsync();
  const saved = Platform.OS === 'ios' && backupFolderModule ? backupFolderModule.bookmark(folder.uri) : folder.uri;
  usePreferencesStore.getState().setBackupFolderUri(saved);
};

/** The chosen folder's name, to show; null when none is chosen */
export const backupFolderLabel = (saved: string | null) => {
  if (!saved) return null;
  if (Platform.OS === 'ios') {
    try {
      return backupFolderModule?.name(saved) ?? null;
    } catch {
      return 'Unavailable. Choose it again';
    }
  }
  // "Download/uwumi" from the picker's tree URI
  return decodeURIComponent(saved.split('/tree/')[1] ?? saved)
    .replace(/^primary:/, '')
    .replace(/\/$/, '');
};

/** Automatic backups on but no folder chosen (as after a reinstall and restore), where one can be */
export const needsBackupFolder = () => {
  const { autoBackupDays, backupFolderUri } = usePreferencesStore.getState();
  return supportsBackupFolder() && autoBackupDays > 0 && !backupFolderUri;
};

/** A name the user typed, as a file name: characters file systems refuse dropped, `.json` added */
export const cleanBackupName = (name: string) => {
  const base = name
    .replace(/\.json$/i, '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .trim();
  return base ? `${base}.json` : backupFileName(new Date());
};

/** The name, or "name (2)" and so on when a backup already has it, so none is overwritten */
const freeName = (folder: Directory, name: string) => {
  const base = name.replace(/\.json$/i, '');
  for (let copy = 1; ; copy++) {
    const candidate = copy === 1 ? name : `${base} (${copy}).json`;
    if (!new File(folder, candidate).exists) return candidate;
  }
};

/** Somewhere backups are written, listed and pruned */
interface BackupTarget {
  /** Writes the backup; returns the name it got, numbered when the name was taken */
  write: (name: string, json: string) => Promise<string>;
  /** The automatic backups there, by name */
  autoBackups: () => string[];
  remove: (name: string) => void;
}

/** A folder expo-file-system can reach: uwumi's own, or one picked on Android */
const directoryTarget = (folder: Directory): BackupTarget => ({
  write: async (name, json) => {
    // In uwumi's folder a taken name throws; the system picker's folders add a number themselves
    const file = folder.createFile(folder.uri.startsWith('file:') ? freeName(folder, name) : name, 'application/json');
    await file.write(json);
    return file.name;
  },
  autoBackups: () => folder.list().flatMap((entry) => (AUTO_BACKUP_NAME.test(entry.name) ? [entry.name] : [])),
  remove: (name) =>
    folder
      .list()
      .find((entry) => entry.name === name)
      ?.delete(),
});

/** iOS: a folder picked outside uwumi, reached through its bookmark */
const bookmarkTarget = (bookmark: string): BackupTarget => ({
  write: async (name, json) => backupFolderModule!.write(bookmark, name, json),
  autoBackups: () => backupFolderModule!.list(bookmark).filter((name) => AUTO_BACKUP_NAME.test(name)),
  remove: (name) => backupFolderModule!.remove(bookmark, name),
});

/** The chosen folder, else uwumi's own */
const backupTarget = (): BackupTarget => {
  const saved = usePreferencesStore.getState().backupFolderUri;
  if (saved && Platform.OS === 'android') return directoryTarget(new Directory(saved));
  if (saved && Platform.OS === 'ios' && backupFolderModule) return bookmarkTarget(saved);
  return directoryTarget(appBackupFolder());
};

/** The system picker was closed without choosing, rather than missing (Android TV) */
export const isPickerCancelled = (error: unknown) =>
  (error as { code?: string })?.code === 'ERR_PICKER_CANCELLED' || /cancel/i.test(String((error as Error)?.message));

/**
 * Writes a backup and says where it went: the chosen folder, or only uwumi's own folder, which goes with the app (no
 * folder picker, as on Android TV). Asks for a folder the first time; null when that picker is cancelled, with nothing
 * written. iOS builds without the folder module share the backup out instead (`shared`, or `app` when not).
 */
export const saveBackup = async (
  name = backupFileName(new Date()),
): Promise<{ name: string; where: 'folder' | 'shared' | 'app' } | null> => {
  const json = JSON.stringify(createBackup());
  if (supportsBackupFolder()) {
    let inAppFolder = false;
    if (!usePreferencesStore.getState().backupFolderUri) {
      try {
        await pickBackupFolder();
      } catch (error) {
        if (isPickerCancelled(error)) return null;
        inAppFolder = true;
      }
    }
    const target = inAppFolder ? directoryTarget(appBackupFolder()) : backupTarget();
    return { name: await target.write(name, json), where: inAppFolder ? 'app' : 'folder' };
  }
  const written = await directoryTarget(appBackupFolder()).write(name, json);
  const { action } = await Share.share({ url: new File(appBackupFolder(), written).uri });
  return { name: written, where: action === Share.sharedAction ? 'shared' : 'app' };
};

/** Lets the user pick a backup file and reads it; null when cancelled. Throws when it isn't a uwumi backup */
export const pickBackup = async () => {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json', '*/*'] });
  if (picked.canceled) return null;
  if ((picked.result.size ?? 0) > MAX_BACKUP_BYTES) throw new Error('This file is too big to be a uwumi backup');
  return parseBackup(await picked.result.text());
};

/**
 * At launch: an automatic backup when one is due, keeping the newest few. It never gets in the way of starting up,
 * so failures are only logged.
 */
export const runAutoBackupIfDue = async () => {
  const { autoBackupDays, lastAutoBackupAt, setLastAutoBackupAt } = usePreferencesStore.getState();
  if (!autoBackupDays || Date.now() - lastAutoBackupAt < autoBackupDays * DAY_MS) return;
  // Where a folder can be chosen they go there only: uwumi's own goes with the app. The choice doesn't survive a
  // reinstall, so a restored schedule waits for a folder to be picked again
  if (needsBackupFolder()) return;
  // Claimed before writing, so a run starting meanwhile (as a fast refresh re-runs the launch code) sees it isn't due
  setLastAutoBackupAt(Date.now());
  try {
    const target = backupTarget();
    await target.write(backupFileName(new Date(), true), JSON.stringify(createBackup()));
    const autoBackups = target.autoBackups().sort((a, b) => b.localeCompare(a));
    for (const old of autoBackups.slice(KEEP_AUTO_BACKUPS)) target.remove(old);
  } catch (error) {
    // Due again at the next launch
    setLastAutoBackupAt(lastAutoBackupAt);
    console.warn('[backup] Automatic backup failed', error);
  }
};
