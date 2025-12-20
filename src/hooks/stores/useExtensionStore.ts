import { create } from 'zustand';
import { storage } from '@/hooks/stores/MMKV';
import axios from 'axios';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { ExtensionManifest, ExtractorInfo, ExtractorManager, ProviderManager } from 'react-native-consumet';
import { UWUMI_DIR } from '@/constants/config';

// --- Constants ---

const EXTENSIONS_CACHE_DIR = `${UWUMI_DIR}/extensions`;
const EXTRACTORS_CACHE_DIR = `${UWUMI_DIR}/extractors`;

const REGISTRY_METADATA_KEY = 'extension_registry_metadata';
const EXTENSION_PREFIX = 'ext_';
const EXTRACTOR_PREFIX = 'extr_';

interface RegistryResponse {
  extractors: ExtractorInfo[];
  extensions: ExtensionManifest[];
}

interface CachedItem {
  version: string;
  fileUri: string;
  downloadedAt: string;
  fileSize?: number;
}

interface RegistryMetadata {
  updatedAt: string;
  registryUrl: string;
  totalExtensions: number;
  totalExtractors: number;
  extensions: ExtensionManifest[];
  extractors: ExtractorInfo[];
}

interface ExtensionStoreState {
  registry: RegistryMetadata | null;
  isLoading: boolean;
  error: string | null;

  // Core methods
  initializeDirectories: () => Promise<boolean>;
  updateRegistry: (registryUrl: string) => Promise<void>;
  // Extension management
  installExtension: (extensionId: string) => Promise<boolean>;
  updateExtension: (extensionId: string) => Promise<boolean>;
  uninstallExtension: (extensionId: string) => Promise<boolean>;
  isExtensionInstalled: (extensionId: string) => boolean;
  getInstalledExtensions: () => ExtensionManifest[];

  // Extractor management (internal - automatically handled)
  installExtractor: (extractorName: string) => Promise<boolean>;
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

const createEmptyRegistry = (registryUrl = ''): RegistryMetadata => ({
  updatedAt: new Date(0).toISOString(),
  registryUrl,
  totalExtensions: 0,
  totalExtractors: 0,
  extensions: [],
  extractors: [],
});

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

const getFilePath = (type: 'extension' | 'extractor', id: string, version: string): string => {
  const base = type === 'extension' ? EXTENSIONS_CACHE_DIR : EXTRACTORS_CACHE_DIR;
  return `${base}/${id}_v${version}.js`;
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

const getCacheKey = (type: 'extension' | 'extractor', id: string): string => {
  return `${type === 'extension' ? EXTENSION_PREFIX : EXTRACTOR_PREFIX}${id}`;
};

// --- Zustand Store ---
export const useExtensionStore = create<ExtensionStoreState>((set, get) => {
  const initialRegistry = loadJSONFromStorage<RegistryMetadata>(REGISTRY_METADATA_KEY);

  return {
    registry: initialRegistry,
    isLoading: false,
    error: null,

    initializeDirectories: async () => {
      const a = await ensureDirectoryExists(EXTENSIONS_CACHE_DIR);
      const b = await ensureDirectoryExists(EXTRACTORS_CACHE_DIR);
      return a && b;
    },

    updateRegistry: async (registryUrl: string) => {
      set({ isLoading: true, error: null });
      try {
        await get().initializeDirectories();
        const { data } = await axios.get<RegistryResponse>(registryUrl);

        if (!data || !Array.isArray((data as any).extensions) || !Array.isArray((data as any).extractors)) {
          throw new Error('Invalid extension registry response');
        }

        const registryMetadata: RegistryMetadata = {
          updatedAt: new Date().toISOString(),
          registryUrl,
          totalExtensions: data.extensions.length,
          totalExtractors: data.extractors.length,
          extensions: data.extensions,
          extractors: data.extractors,
        };

        saveJSONToStorage(REGISTRY_METADATA_KEY, registryMetadata);
        set({ registry: registryMetadata, isLoading: false });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Registry update failed:', msg);
        set({ isLoading: false, error: msg });
      }
    },

    installExtension: async (extensionId: string) => {
      const { registry } = get();
      if (!registry) return false;

      const extension = registry.extensions.find((e) => e.id === extensionId);
      if (!extension) return false;

      if (extension.extractors?.length) {
        for (const extractor of extension.extractors) {
          await get().installExtractor(extractor.toLowerCase());
        }
      }

      const cacheKey = getCacheKey('extension', extensionId);
      const cached = loadJSONFromStorage<CachedItem>(cacheKey);

      if (cached?.version === extension.version) return true;

      if (cached) await deleteFile(cached.fileUri);

      const filePath = getFilePath('extension', extensionId, extension.version);
      const success = await downloadFile(extension.main, filePath);

      if (success) {
        const fileSize = await getFileSize(filePath);
        const cache: CachedItem = {
          version: extension.version,
          fileUri: filePath,
          downloadedAt: new Date().toISOString(),
          fileSize,
        };
        saveJSONToStorage(cacheKey, cache);
      }
      return success;
    },

    updateExtension: async (id) => get().installExtension(id),

    uninstallExtension: async (id) => {
      const key = getCacheKey('extension', id);
      const cached = loadJSONFromStorage<CachedItem>(key);
      if (cached) await deleteFile(cached.fileUri);
      storage.delete(key);
      return true;
    },

    isExtensionInstalled: (id) => !!loadJSONFromStorage<CachedItem>(getCacheKey('extension', id)),

    getInstalledExtensions: () => {
      const { registry } = get();
      if (!registry) return [];
      return registry.extensions.filter((e) => get().isExtensionInstalled(e.id));
    },

    installExtractor: async (name) => {
      const { registry } = get();
      if (!registry) return false;

      const extractor = registry.extractors.find((e) => e.name.toLowerCase() === name.toLowerCase());
      if (!extractor) return false;

      const cacheKey = getCacheKey('extractor', name);
      const cached = loadJSONFromStorage<CachedItem>(cacheKey);
      if (cached?.version === extractor.version) return true;

      if (cached) await deleteFile(cached.fileUri);

      const path = getFilePath('extractor', name, extractor.version);
      const success = await downloadFile(extractor.main, path);

      if (success) {
        const fileSize = await getFileSize(path);
        const cache: CachedItem = {
          version: extractor.version,
          fileUri: path,
          downloadedAt: new Date().toISOString(),
          fileSize,
        };
        saveJSONToStorage(cacheKey, cache);
      }
      return success;
    },

    updateExtractor: async (name) => get().installExtractor(name),

    uninstallExtractor: async (name) => {
      const key = getCacheKey('extractor', name);
      const cached = loadJSONFromStorage<CachedItem>(key);
      if (cached) await deleteFile(cached.fileUri);
      storage.delete(key);
      return true;
    },

    isExtractorInstalled: (name) => !!loadJSONFromStorage<CachedItem>(getCacheKey('extractor', name)),

    getInstalledExtractors: () => {
      const { registry } = get();
      if (!registry) return [];
      return registry.extractors.filter((e) => get().isExtractorInstalled(e.name));
    },

    readExtensionCode: async (id) => {
      const cache = loadJSONFromStorage<CachedItem>(getCacheKey('extension', id));
      if (!cache) return null;
      try {
        return await RNFS.readFile(cache.fileUri, 'utf8');
      } catch {
        return null;
      }
    },

    readExtractorCode: async (name) => {
      const cache = loadJSONFromStorage<CachedItem>(getCacheKey('extractor', name));
      if (!cache) return null;
      try {
        return await RNFS.readFile(cache.fileUri, 'utf8');
      } catch {
        return null;
      }
    },

    getExtensionInfo: (id) => get().registry?.extensions.find((e) => e.id === id) || null,
    getExtractorInfo: (name) => get().registry?.extractors.find((e) => e.name === name) || null,

    checkForUpdates: async () => {
      const { registry } = get();
      if (!registry) return { extensions: [], extractors: [] };
      const extUpdates: string[] = [];
      const extrUpdates: string[] = [];

      for (const ext of registry.extensions) {
        const cached = loadJSONFromStorage<CachedItem>(getCacheKey('extension', ext.id));
        if (cached && cached.version !== ext.version) extUpdates.push(ext.id);
      }

      for (const extr of registry.extractors) {
        const cached = loadJSONFromStorage<CachedItem>(getCacheKey('extractor', extr.name));
        if (cached && cached.version !== extr.version) extrUpdates.push(extr.name);
      }

      return { extensions: extUpdates, extractors: extrUpdates };
    },

    clearCache: async () => {
      try {
        if (await RNFS.exists(EXTENSIONS_CACHE_DIR)) await RNFS.unlink(EXTENSIONS_CACHE_DIR);
        if (await RNFS.exists(EXTRACTORS_CACHE_DIR)) await RNFS.unlink(EXTRACTORS_CACHE_DIR);

        const { registry } = get();
        if (registry) {
          for (const e of registry.extensions) storage.delete(getCacheKey('extension', e.id));
          for (const x of registry.extractors) storage.delete(getCacheKey('extractor', x.name));
        }
        storage.delete(REGISTRY_METADATA_KEY);
        set({ registry: null, error: null });
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
  };
});

// --- Helper Hook ---
export const useConsumetExtensions = () => {
  const ExtensionStore = useExtensionStore();
  // react-native-consumet managers expect a non-null registry object
  const safeRegistry = ExtensionStore.registry ?? createEmptyRegistry();
  const providerManager = new ProviderManager(safeRegistry);
  const extractorManager = new ExtractorManager(safeRegistry);
  return { ...ExtensionStore, providerManager, extractorManager };
};

export default useExtensionStore;
