import { create } from 'zustand';
import { storage } from '@/hooks/stores/MMKV';
import * as RNFS from '@dr.pogodin/react-native-fs';
import {
  ExtensionManifest,
  ExtensionRegistry,
  ExtensionRegistryData,
  ExtractorInfo,
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
import { UWUMI_DIR } from '@/constants/config';
import { HttpError } from '@/constants/utils';

// --- Constants ---

export const REGISTRY_URL =
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
  isLoading: boolean;
  error: string | null;

  // Core methods
  initializeDirectories: () => Promise<boolean>;
  updateRegistry: (registryUrl?: string) => Promise<void>;
  // Extension management
  installExtension: (extensionId: string, force?: boolean) => Promise<boolean>;
  updateExtension: (extensionId: string) => Promise<boolean>;
  uninstallExtension: (extensionId: string) => Promise<boolean>;
  isExtensionInstalled: (extensionId: string) => boolean;
  getInstalledExtensions: () => ExtensionManifest[];

  // Extractor management (internal - automatically handled)
  installExtractor: (extractorName: string, force?: boolean) => Promise<boolean>;
  updateExtractor: (extractorName: string) => Promise<boolean>;
  uninstallExtractor: (extractorName: string) => Promise<boolean>;
  isExtractorInstalled: (extractorName: string) => boolean;
  getInstalledExtractors: () => ExtractorInfo[];

  // File operations
  readExtensionCode: (extensionId: string) => Promise<string | null>;
  readExtractorCode: (extractorName: string) => Promise<string | null>;

  // Utility methods
  getExtensionInfo: (extensionId: string) => ExtensionManifest | null;
  getExtractorInfo: (extractorName: string) => ExtractorInfo | null;
  checkForUpdates: () => Promise<{ extensions: string[]; extractors: string[] }>;
  clearCache: () => Promise<void>;
  getStorageSize: () => Promise<number>;
}

// --- Utility Functions ---

const ensureDirectoryExists = async (path: string): Promise<boolean> => {
  try {
    const exists = await RNFS.exists(path);
    if (!exists) {
      await RNFS.mkdir(path);
      console.log('✅ Created directory:', path);
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to ensure directory: ${path}`, error);
    return false;
  }
};

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

const downloadText = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) throw new HttpError(response.status, url);
  return response.text();
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
    const parentDir = destination.substring(0, destination.lastIndexOf('/'));
    await ensureDirectoryExists(parentDir);

    if (await RNFS.exists(destination)) {
      await RNFS.unlink(destination);
    }

    const { statusCode } = await RNFS.downloadFile({ fromUrl: url, toFile: destination }).promise;
    return statusCode === 200;
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
    const stat = await RNFS.stat(path);
    return stat.size;
  } catch {
    return undefined;
  }
};

const deleteFile = async (path: string): Promise<void> => {
  try {
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
    }
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
    verifyExtensionCode(await RNFS.readFile(downloadPath, 'utf8'), { id, sha256: entry.sha256 });
  } catch (error) {
    console.error(`❌ ${id} ${entry.version} failed its integrity check:`, error);
    await deleteFile(downloadPath);
    return false;
  }
  await deleteFile(filePath);
  await RNFS.moveFile(downloadPath, filePath);

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
    return await RNFS.readFile(getFilePath(type, id, cache.version), 'utf8');
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

// --- Zustand Store ---
export const useExtensionStore = create<ExtensionStoreState>((set, get) => ({
  registry: loadInitialRegistry(),
  isLoading: false,
  error: null,

  initializeDirectories: async () => {
    const a = await ensureDirectoryExists(EXTENSIONS_CACHE_DIR);
    const b = await ensureDirectoryExists(EXTRACTORS_CACHE_DIR);
    return a && b;
  },

  updateRegistry: async (registryUrl = REGISTRY_URL) => {
    set({ isLoading: true, error: null });
    try {
      await get().initializeDirectories();
      // The signature covers the exact bytes, so verify the text as downloaded
      const [text, signature] = await Promise.all([downloadText(registryUrl), downloadText(`${registryUrl}.sig`)]);
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

    for (const extractor of extension.extractors ?? []) {
      await get().installExtractor(extractor);
    }
    return installCode('extension', extensionId, extension, force);
  },

  updateExtension: async (id) => get().installExtension(id),

  uninstallExtension: async (id) => uninstallCode('extension', id),

  isExtensionInstalled: (id) => !!loadJSONFromStorage<CachedItem>(getCacheKey('extension', id)),

  getInstalledExtensions: () => get().registry.extensions.filter((e) => get().isExtensionInstalled(e.id)),

  installExtractor: async (name, force = false) => {
    const extractor = get().getExtractorInfo(name);
    if (!extractor || !isCompatibleEntry(extractor)) return false;
    return installCode('extractor', name, extractor, force);
  },

  updateExtractor: async (name) => get().installExtractor(name),

  uninstallExtractor: async (name) => uninstallCode('extractor', name),

  isExtractorInstalled: (name) => !!loadJSONFromStorage<CachedItem>(getCacheKey('extractor', name)),

  getInstalledExtractors: () => get().registry.extractors.filter((e) => get().isExtractorInstalled(e.name)),

  readExtensionCode: async (id) => readCode('extension', id),

  readExtractorCode: async (name) => readCode('extractor', name),

  getExtensionInfo: (id) => get().registry.extensions.find((e) => e.id === id) || null,
  getExtractorInfo: (name) =>
    get().registry.extractors.find((e) => e.name.toLowerCase() === name.toLowerCase()) || null,

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

  clearCache: async () => {
    try {
      if (await RNFS.exists(EXTENSIONS_CACHE_DIR)) await RNFS.unlink(EXTENSIONS_CACHE_DIR);
      if (await RNFS.exists(EXTRACTORS_CACHE_DIR)) await RNFS.unlink(EXTRACTORS_CACHE_DIR);

      const { registry } = get();
      for (const e of registry.extensions) storage.remove(getCacheKey('extension', e.id));
      for (const x of registry.extractors) storage.remove(getCacheKey('extractor', x.name));
      storage.remove(REGISTRY_METADATA_KEY);
      set({ registry: ExtensionRegistry, error: null });
    } catch (err) {
      console.error('❌ Failed to clear cache:', err);
    }
  },

  getStorageSize: async () => {
    let total = 0;
    try {
      for (const dir of [EXTENSIONS_CACHE_DIR, EXTRACTORS_CACHE_DIR]) {
        if (await RNFS.exists(dir)) {
          const items = await RNFS.readDir(dir);
          for (const item of items) {
            if (item.isFile()) total += (await RNFS.stat(item.path)).size;
          }
        }
      }
    } catch (err) {
      console.error('❌ Failed to get storage size:', err);
    }
    return total;
  },
}));

// --- Running installed code ---

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
  const store = useExtensionStore.getState();
  const install = type === 'extension' ? store.installExtension : store.installExtractor;
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

async function loadInstalledProvider(id: string, category: 'anime' | 'movies') {
  const { providerManager } = getExtensionManagers();
  const metadata = providerManager.getExtensionMetadata(id);
  if (metadata.category !== category) throw new Error(`${metadata.name} isn't a ${category} provider`);
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

export default useExtensionStore;
