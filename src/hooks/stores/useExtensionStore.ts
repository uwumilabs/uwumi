import { create } from 'zustand';
import { storage } from '@/hooks/stores/MMKV';
import { File as FsFile } from 'expo-file-system';
import {
  ExtensionManifest,
  ExtensionRegistry,
  ExtensionRegistryData,
  ExtractorManager,
  IntegrityError,
  ProviderManager,
  RegistryError,
  RegistrySignatureError,
  isCompatibleEntry,
  parseSignedRegistry,
  validateRegistry,
  verifyExtensionCode,
  type IAnimeProvider,
  type IMovieProvider,
  type IVideoExtractor,
} from 'react-native-consumet';
import { UWUMI_DIR, ensureDirectory, fsFile } from '@/utils/files';
import { fetchText } from '@/utils/http';

const REGISTRY_URL =
  'https://raw.githubusercontent.com/uwumilabs/react-native-consumet/refs/heads/main/src/extension-registry.json';

const EXTENSIONS_CACHE_DIR = `${UWUMI_DIR}/extensions`;
const EXTRACTORS_CACHE_DIR = `${UWUMI_DIR}/extractors`;

const REGISTRY_METADATA_KEY = 'extension_registry_v2';
const EXTENSION_PREFIX = 'ext_';
const EXTRACTOR_PREFIX = 'extr_';

// No absolute path is stored: iOS moves the app container on reinstall, so paths are rebuilt with getFilePath.
interface CachedItem {
  version: string;
  downloadedAt: string;
  fileSize?: number;
}

/** The whole signed registry (kept whole so its `schemaVersion` survives), or the one bundled with the library. */
interface RegistryMetadata extends ExtensionRegistryData {
  /** When it was downloaded; unset for the bundled registry */
  updatedAt?: string;
}

type CodeType = 'extension' | 'extractor';
type CodeEntry = { version: string; main: string; sha256?: string };

interface ExtensionStoreState {
  registry: RegistryMetadata;
  /** Bumped when an extension is installed or removed, so provider lists recompute */
  installedVersion: number;
  isLoading: boolean;
  error: string | null;
  /** Downloads the signed registry; a failure keeps the current one and sets `error` */
  updateRegistry: () => Promise<void>;
  /** Installs (or updates) the extension and its extractors; false when it couldn't be */
  installExtension: (extensionId: string, force?: boolean) => Promise<boolean>;
  uninstallExtension: (extensionId: string) => Promise<boolean>;
  isExtensionInstalled: (extensionId: string) => boolean;
  getInstalledExtensions: () => ExtensionManifest[];
  getExtensionInfo: (extensionId: string) => ExtensionManifest | null;
  checkForUpdates: () => Promise<{ extensions: string[]; extractors: string[] }>;
}

const loadJSONFromStorage = <T>(key: string): T | null => {
  try {
    const value = storage.getString(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`❌ Failed to parse storage for key ${key}`, error);
    return null;
  }
};

const saveJSONToStorage = (key: string, data: any): boolean => {
  try {
    storage.set(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`❌ Failed to save JSON for key ${key}:`, error);
    return false;
  }
};

const loadInitialRegistry = (): RegistryMetadata => {
  const stored = loadJSONFromStorage<RegistryMetadata>(REGISTRY_METADATA_KEY);
  if (!stored) return ExtensionRegistry;
  try {
    validateRegistry(stored);
    return stored;
  } catch (error) {
    console.warn('⚠️ Stored extension registry is invalid, using the bundled one:', error);
    storage.remove(REGISTRY_METADATA_KEY);
    return ExtensionRegistry;
  }
};

const registryErrorMessage = (error: unknown): string => {
  if (error instanceof RegistrySignatureError) {
    return error.code === 'SIGNATURE_MISMATCH'
      ? "The latest registry isn't signed yet. Keeping the current one; try again in a few minutes."
      : "The registry's signature didn't verify. Keeping the current one.";
  }
  if (error instanceof RegistryError && error.updateRequired) {
    return 'The latest registry needs a newer version of uwumi. Keeping the current one.';
  }
  return `Couldn't download the registry. Keeping the current one. ${error instanceof Error ? error.message : ''}`.trim();
};

const downloadFile = async (url: string, destination: string): Promise<boolean> => {
  try {
    ensureDirectory(destination.substring(0, destination.lastIndexOf('/')));

    // Rejects on a non-2xx response
    await FsFile.downloadFileAsync(url, fsFile(destination), { idempotent: true });
    return true;
  } catch (error) {
    console.error(`❌ Failed to download file from ${url}:`, error);
    return false;
  }
};

// Extractor names are matched case-insensitively ('MegaCloud', 'megacloud')
const normalizeId = (type: CodeType, id: string) => (type === 'extractor' ? id.toLowerCase() : id);

const getFilePath = (type: CodeType, id: string, version: string): string => {
  const base = type === 'extension' ? EXTENSIONS_CACHE_DIR : EXTRACTORS_CACHE_DIR;
  return `${base}/${normalizeId(type, id)}_v${version}.js`;
};

const getFileSize = async (path: string): Promise<number | undefined> => {
  try {
    const file = fsFile(path);
    return file.exists ? file.size : undefined;
  } catch {
    return undefined;
  }
};

const deleteFile = async (path: string): Promise<void> => {
  try {
    const file = fsFile(path);
    if (file.exists) file.delete();
  } catch (err) {
    console.warn(`⚠️ Failed to delete ${path}:`, err);
  }
};

const getCacheKey = (type: CodeType, id: string): string => {
  return `${type === 'extension' ? EXTENSION_PREFIX : EXTRACTOR_PREFIX}${normalizeId(type, id)}`;
};

// Queries that find the same stale code at once share one download instead of writing the file together
const pendingInstalls = new Map<string, Promise<boolean>>();

const installCode = (type: CodeType, id: string, entry: CodeEntry, force = false): Promise<boolean> => {
  const key = getCacheKey(type, id);
  let pending = pendingInstalls.get(key);
  if (!pending) {
    pending = downloadCode(type, id, entry, force).finally(() => pendingInstalls.delete(key));
    pendingInstalls.set(key, pending);
  }
  return pending;
};

/** Downloads an entry's code and keeps it only if it matches the entry's sha256. */
const downloadCode = async (type: CodeType, id: string, entry: CodeEntry, force: boolean): Promise<boolean> => {
  const cacheKey = getCacheKey(type, id);
  const cached = loadJSONFromStorage<CachedItem>(cacheKey);
  if (cached?.version === entry.version && !force) return true;

  const filePath = getFilePath(type, id, entry.version);
  // The current file stays in place until the new one has passed its check
  const downloadPath = `${filePath}.download`;
  if (!(await downloadFile(entry.main, downloadPath))) {
    await deleteFile(downloadPath);
    return false;
  }
  try {
    verifyExtensionCode(await fsFile(downloadPath).text(), { id, sha256: entry.sha256 });
  } catch (error) {
    console.error(`❌ ${id} ${entry.version} failed its integrity check:`, error);
    await deleteFile(downloadPath);
    return false;
  }
  await deleteFile(filePath);
  fsFile(downloadPath).moveSync(fsFile(filePath), { overwrite: true });

  if (cached && cached.version !== entry.version) await deleteFile(getFilePath(type, id, cached.version));
  const cache: CachedItem = {
    version: entry.version,
    downloadedAt: new Date().toISOString(),
    fileSize: await getFileSize(filePath),
  };
  saveJSONToStorage(cacheKey, cache);
  return true;
};

const readCode = async (type: CodeType, id: string): Promise<string | null> => {
  const cache = loadJSONFromStorage<CachedItem>(getCacheKey(type, id));
  if (!cache) return null;
  try {
    return await fsFile(getFilePath(type, id, cache.version)).text();
  } catch {
    return null;
  }
};

const uninstallCode = async (type: CodeType, id: string) => {
  const key = getCacheKey(type, id);
  const cached = loadJSONFromStorage<CachedItem>(key);
  if (cached) await deleteFile(getFilePath(type, id, cached.version));
  storage.remove(key);
  return true;
};

const findExtractor = (registry: RegistryMetadata, name: string) =>
  registry.extractors.find((e) => e.name.toLowerCase() === name.toLowerCase());

/** The extensions installed here, by id: also ones the current registry no longer lists */
export const installedExtensionIds = () =>
  storage.getAllKeys().flatMap((key) => (key.startsWith(EXTENSION_PREFIX) ? [key.slice(EXTENSION_PREFIX.length)] : []));

export const useExtensionStore = create<ExtensionStoreState>((set, get) => ({
  registry: loadInitialRegistry(),
  installedVersion: 0,
  isLoading: false,
  error: null,

  updateRegistry: async () => {
    set({ isLoading: true, error: null });
    try {
      // The signature covers the exact bytes, so verify the text as downloaded
      const [text, signature] = await Promise.all([fetchText(REGISTRY_URL), fetchText(`${REGISTRY_URL}.sig`)]);
      const registry: RegistryMetadata = {
        ...parseSignedRegistry(text, signature),
        updatedAt: new Date().toISOString(),
      };
      saveJSONToStorage(REGISTRY_METADATA_KEY, registry);
      set({ registry, isLoading: false });
    } catch (error) {
      console.warn('⚠️ Registry update failed:', error);
      set({ isLoading: false, error: registryErrorMessage(error) });
    }
  },

  installExtension: async (extensionId, force = false) => {
    const extension = get().registry.extensions.find((e) => e.id === extensionId);
    if (!extension || !isCompatibleEntry(extension)) return false;

    for (const extractor of extension.extractors ?? []) await installExtractor(extractor);
    const installed = await installCode('extension', extensionId, extension, force);
    if (installed) set((state) => ({ installedVersion: state.installedVersion + 1 }));
    return installed;
  },

  uninstallExtension: async (id) => {
    const removed = await uninstallCode('extension', id);
    set((state) => ({ installedVersion: state.installedVersion + 1 }));
    return removed;
  },

  // A key check, not a read and parse: provider lists run this for every extension
  isExtensionInstalled: (id) => storage.contains(getCacheKey('extension', id)),

  getInstalledExtensions: () => get().registry.extensions.filter((e) => get().isExtensionInstalled(e.id)),

  getExtensionInfo: (id) => get().registry.extensions.find((e) => e.id === id) || null,

  checkForUpdates: async () => {
    const { registry } = get();
    const extUpdates: string[] = [];
    const extrUpdates: string[] = [];

    for (const ext of registry.extensions) {
      const cached = loadJSONFromStorage<CachedItem>(getCacheKey('extension', ext.id));
      if (cached && cached.version !== ext.version && isCompatibleEntry(ext)) extUpdates.push(ext.id);
    }

    for (const extr of registry.extractors) {
      const cached = loadJSONFromStorage<CachedItem>(getCacheKey('extractor', extr.name));
      if (cached && cached.version !== extr.version && isCompatibleEntry(extr)) extrUpdates.push(extr.name);
    }

    return { extensions: extUpdates, extractors: extrUpdates };
  },
}));

const installExtractor = async (name: string, force = false) => {
  const extractor = findExtractor(useExtensionStore.getState().registry, name);
  if (!extractor || !isCompatibleEntry(extractor)) return false;
  return installCode('extractor', name, extractor, force);
};

// The managers cache compiled code per id and sha256, so keep one pair per registry
let managers:
  | { registry: RegistryMetadata; providerManager: ProviderManager; extractorManager: ExtractorManager }
  | undefined;

export const getExtensionManagers = () => {
  const { registry } = useExtensionStore.getState();
  if (managers?.registry !== registry) {
    const extractorManager = new ExtractorManager(registry);
    managers = { registry, extractorManager, providerManager: new ProviderManager(registry, { extractorManager }) };
  }
  return managers;
};

/** Runs cached code, downloading it again once if it no longer matches its registry entry's sha256. */
const runCachedCode = async <T>(
  type: CodeType,
  id: string,
  installIfMissing: boolean,
  run: (code: string) => Promise<T>,
): Promise<T> => {
  const install = type === 'extension' ? useExtensionStore.getState().installExtension : installExtractor;
  let code = await readCode(type, id);
  const installed = !!loadJSONFromStorage<CachedItem>(getCacheKey(type, id));
  if (code === null && (installIfMissing || installed) && (await install(id, installed))) {
    code = await readCode(type, id);
  }
  if (code === null) throw new Error(`The ${id} ${type} isn't installed`);
  try {
    return await run(code);
  } catch (error) {
    if (!(error instanceof IntegrityError) || !(await install(id, true))) throw error;
    return run((await readCode(type, id))!);
  }
};

/** Dev builds: a bundle at UWUMI_DIR/dev-extensions/<id>.js runs instead of the installed one, to try a fix unpublished */
const readDevExtension = async (id: string): Promise<string | null> => {
  if (!__DEV__) return null;
  const file = fsFile(`${UWUMI_DIR}/dev-extensions/${id}.js`);
  return file.exists ? file.text() : null;
};

async function loadInstalledProvider(id: string, category: 'anime' | 'movies') {
  const { providerManager } = getExtensionManagers();
  const metadata = providerManager.getExtensionMetadata(id);
  if (metadata.category !== category) throw new Error(`${metadata.name} isn't a ${category} provider`);
  const devCode = await readDevExtension(id);
  if (devCode) {
    return providerManager.executeProviderCode(devCode, metadata.factoryName, metadata, { skipIntegrity: true });
  }
  return runCachedCode('extension', id, false, (code) =>
    providerManager.executeProviderCode(code, metadata.factoryName, metadata),
  );
}

export const loadAnimeProvider = async (id: string) => (await loadInstalledProvider(id, 'anime')) as IAnimeProvider;

export const loadMovieProvider = async (id: string) => (await loadInstalledProvider(id, 'movies')) as IMovieProvider;

/** The registry extractor for a server name ('megacloud-hd-1' → MegaCloud), installed on first use. */
export async function loadServerExtractor(serverName: string): Promise<IVideoExtractor> {
  const { extractorManager } = getExtensionManagers();
  const name = extractorManager.extractBaseExtractorName(serverName);
  const metadata = name ? extractorManager.getExtractorMetadata(name) : undefined;
  if (!name || !metadata) throw new Error(`No extractor found for server: "${serverName}"`);
  return runCachedCode('extractor', name, true, (code) => extractorManager.executeExtractorCode(code, metadata));
}
