import { create } from 'zustand';
import { storage } from '@/hooks/stores/MMKV';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { ExtractorManager, ProviderManager } from 'react-native-consumet';

// UWUMI_DIR constant - adjust path as needed for your app
const UWUMI_DIR = `${FileSystem.documentDirectory}uwumi`;

// Constants
const EXTENSIONS_CACHE_DIR = `${UWUMI_DIR}/extensions`;
const EXTRACTORS_CACHE_DIR = `${UWUMI_DIR}/extractors`;
const REGISTRY_METADATA_KEY = 'extension_registry_metadata';
const EXTENSION_PREFIX = 'ext_';
const EXTRACTOR_PREFIX = 'extr_';

// --- Types ---
interface Author {
  name: string;
  url?: string;
}

interface ExtractorItem {
  name: string;
  version: string;
  main: string;
}

interface ExtensionItem {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: Author;
  category?: string;
  main: string;
  factoryName?: string;
  baseUrl?: string;
  logo?: string;
  languages?: string[];
  nsfw?: boolean;
  status?: 'stable' | 'beta' | 'alpha' | 'deprecated';
  lastUpdated?: string;
  extractors?: string[];
  subbed?: boolean;
  dubbed?: boolean;
  isSourceEmbed?: boolean;
}

interface RegistryResponse {
  extractors: ExtractorItem[];
  extensions: ExtensionItem[];
}

interface CachedItem {
  version: string;
  filePath: string;
  downloadedAt: string;
  fileSize?: number;
}

interface RegistryMetadata {
  updatedAt: string;
  registryUrl: string;
  totalExtensions: number;
  totalExtractors: number;
  extensions: ExtensionItem[];
  extractors: ExtractorItem[];
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
  getInstalledExtensions: () => ExtensionItem[];

  // Extractor management (internal - automatically handled)
  installExtractor: (extractorName: string) => Promise<boolean>;
  updateExtractor: (extractorName: string) => Promise<boolean>;
  uninstallExtractor: (extractorName: string) => Promise<boolean>;
  isExtractorInstalled: (extractorName: string) => boolean;
  getInstalledExtractors: () => ExtractorItem[];

  // File operations
  readExtensionCode: (extensionId: string) => Promise<string | null>;
  readExtractorCode: (extractorName: string) => Promise<string | null>;

  // Utility methods
  getExtensionInfo: (extensionId: string) => ExtensionItem | null;
  getExtractorInfo: (extractorName: string) => ExtractorItem | null;
  checkForUpdates: () => Promise<{ extensions: string[]; extractors: string[] }>;
  clearCache: () => Promise<void>;
  getStorageSize: () => Promise<number>;
}

// --- Utility Functions ---
const ensureDirectoryExists = async (dirPath: string): Promise<boolean> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      //console.log(`📁 Creating directory: ${dirPath}`);
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to create directory ${dirPath}:`, error);
    return false;
  }
};

const loadJSONFromStorage = <T>(key: string): T | null => {
  try {
    const value = storage.getString(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`❌ Failed to load JSON for key ${key}:`, error);
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

const downloadFile = async (url: string, destinationPath: string): Promise<boolean> => {
  try {
    //console.log(`⬇️ Downloading: ${url}`);
    const downloadResult = await FileSystem.downloadAsync(url, destinationPath);

    if (downloadResult.status === 200) {
      //console.log(`✅ Download completed: ${destinationPath}`);
      return true;
    } else {
      console.error(`❌ Download failed with status: ${downloadResult.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Download error:`, error);
    return false;
  }
};

const getFilePath = (type: 'extension' | 'extractor', id: string, version: string): string => {
  const baseDir = type === 'extension' ? EXTENSIONS_CACHE_DIR : EXTRACTORS_CACHE_DIR;
  return `${baseDir}/${id}_v${version}.js`;
};

const getCacheKey = (type: 'extension' | 'extractor', id: string): string => {
  const prefix = type === 'extension' ? EXTENSION_PREFIX : EXTRACTOR_PREFIX;
  return `${prefix}${id}`;
};

// --- Store Implementation ---
export const useExtensionStore = create<ExtensionStoreState>((set, get) => {
  // Load initial state from storage
  const initialRegistry = loadJSONFromStorage<RegistryMetadata>(REGISTRY_METADATA_KEY);

  return {
    registry: initialRegistry,
    isLoading: false,
    error: null,

    initializeDirectories: async () => {
      //console.log('🚀 Initializing extension manager directories...');
      const extensionsCreated = await ensureDirectoryExists(EXTENSIONS_CACHE_DIR);
      const extractorsCreated = await ensureDirectoryExists(EXTRACTORS_CACHE_DIR);

      const success = extensionsCreated && extractorsCreated;
      if (success) {
        //console.log('✅ Directories initialized successfully');
      } else {
        console.error('❌ Failed to initialize some directories');
      }
      return success;
    },

    updateRegistry: async (registryUrl: string) => {
      set({ isLoading: true, error: null });
      try {
        //console.log(`🔄 Updating registry from: ${registryUrl}`);
        // Ensure directories exist
        await get().initializeDirectories();

        // Fetch registry data
        const response = await axios.get<RegistryResponse>(registryUrl);
        const { extractors, extensions } = response.data;

        //console.log(`📊 Registry fetched: ${extensions.length} extensions, ${extractors.length} extractors`);

        // Save registry metadata
        const registryMetadata: RegistryMetadata = {
          updatedAt: new Date().toISOString(),
          registryUrl,
          totalExtensions: extensions.length,
          totalExtractors: extractors.length,
          extensions,
          extractors,
        };

        saveJSONToStorage(REGISTRY_METADATA_KEY, registryMetadata);

        set({
          registry: registryMetadata,
          isLoading: false,
          error: null,
        });

        //console.log('✅ Registry updated successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Failed to update registry:', errorMessage);
        set({
          isLoading: false,
          error: `Failed to update registry: ${errorMessage}`,
        });
      }
    },

    installExtension: async (extensionId: string) => {
      const { registry } = get();
      if (!registry) {
        console.error('❌ No registry available');
        return false;
      }

      const extensionInfo = registry.extensions.find((ext) => ext.id === extensionId);
      if (!extensionInfo) {
        console.error(`❌ Extension not found in registry: ${extensionId}`);
        return false;
      }

      // Auto-install required extractors for this extension
      if (extensionInfo.extractors && extensionInfo.extractors.length > 0) {
        //console.log(`🔧 Installing required extractors for ${extensionId}: ${extensionInfo.extractors.join(', ')}`);
        for (const extractorName of extensionInfo.extractors) {
          await get().installExtractor(extractorName);
        }
      }

      const cacheKey = getCacheKey('extension', extensionId);
      const cachedData = loadJSONFromStorage<CachedItem>(cacheKey);

      // Check if already installed and up-to-date
      if (cachedData && cachedData.version === extensionInfo.version) {
        //console.log(`✅ Extension ${extensionId} is already up-to-date`);
        return true;
      }

      // Remove old version if exists
      if (cachedData) {
        try {
          await FileSystem.deleteAsync(cachedData.filePath);
          //console.log(`🗑️ Removed old version of ${extensionId}`);
        } catch (error) {
          console.warn(`⚠️ Failed to remove old version of ${extensionId}:`, error);
        }
      }

      // Download new version
      const filePath = getFilePath('extension', extensionId, extensionInfo.version);
      const success = await downloadFile(extensionInfo.main, filePath);

      if (success) {
        // Get file size (note: FileInfo in expo-file-system uses different structure)
        let fileSize: number | undefined;
        try {
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          // FileInfo has different properties in expo-file-system
          if (fileInfo.exists && 'size' in fileInfo) {
            fileSize = (fileInfo as any).size;
          }
        } catch (error) {
          console.warn('Could not get file size:', error);
        }

        // Save cache metadata
        const cacheData: CachedItem = {
          version: extensionInfo.version,
          filePath,
          downloadedAt: new Date().toISOString(),
          fileSize,
        };

        saveJSONToStorage(cacheKey, cacheData);
        //console.log(`✅ Extension ${extensionId}@${extensionInfo.version} installed successfully`);
        return true;
      }

      return false;
    },

    updateExtension: async (extensionId: string) => {
      //console.log(`🔄 Updating extension: ${extensionId}`);
      return await get().installExtension(extensionId);
    },

    uninstallExtension: async (extensionId: string) => {
      const cacheKey = getCacheKey('extension', extensionId);
      const cachedData = loadJSONFromStorage<CachedItem>(cacheKey);

      if (!cachedData) {
        //console.log(`ℹ️ Extension ${extensionId} is not installed`);
        return true;
      }

      try {
        await FileSystem.deleteAsync(cachedData.filePath);
        storage.delete(cacheKey);
        //console.log(`🗑️ Extension ${extensionId} uninstalled successfully`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to uninstall extension ${extensionId}:`, error);
        return false;
      }
    },

    isExtensionInstalled: (extensionId: string) => {
      const cacheKey = getCacheKey('extension', extensionId);
      const cachedData = loadJSONFromStorage<CachedItem>(cacheKey);
      return cachedData !== null;
    },

    getInstalledExtensions: () => {
      const { registry } = get();
      if (!registry) return [];

      return registry.extensions.filter((ext) => get().isExtensionInstalled(ext.id));
    },

    installExtractor: async (extractorName: string) => {
      const { registry } = get();
      if (!registry) {
        console.error('❌ No registry available');
        return false;
      }

      const extractorInfo = registry.extractors.find((extr) => extr.name === extractorName);
      if (!extractorInfo) {
        console.error(`❌ Extractor not found in registry: ${extractorName}`);
        return false;
      }

      const cacheKey = getCacheKey('extractor', extractorName);
      const cachedData = loadJSONFromStorage<CachedItem>(cacheKey);

      // Check if already installed and up-to-date
      if (cachedData && cachedData.version === extractorInfo.version) {
        //console.log(`✅ Extractor ${extractorName} is already up-to-date`);
        return true;
      }

      // Remove old version if exists
      if (cachedData) {
        try {
          await FileSystem.deleteAsync(cachedData.filePath);
          //console.log(`🗑️ Removed old version of ${extractorName}`);
        } catch (error) {
          console.warn(`⚠️ Failed to remove old version of ${extractorName}:`, error);
        }
      }

      // Download new version
      const filePath = getFilePath('extractor', extractorName, extractorInfo.version);
      const success = await downloadFile(extractorInfo.main, filePath);

      if (success) {
        // Get file size (expo-file-system FileInfo structure)
        let fileSize: number | undefined;
        try {
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists && 'size' in fileInfo) {
            fileSize = (fileInfo as any).size;
          }
        } catch (error) {
          console.warn('Could not get file size:', error);
        }

        // Save cache metadata
        const cacheData: CachedItem = {
          version: extractorInfo.version,
          filePath,
          downloadedAt: new Date().toISOString(),
          fileSize,
        };

        saveJSONToStorage(cacheKey, cacheData);
        //console.log(`✅ Extractor ${extractorName}@${extractorInfo.version} installed successfully`);
        return true;
      }

      return false;
    },

    updateExtractor: async (extractorName: string) => {
      //console.log(`🔄 Updating extractor: ${extractorName}`);
      return await get().installExtractor(extractorName);
    },

    uninstallExtractor: async (extractorName: string) => {
      const cacheKey = getCacheKey('extractor', extractorName);
      const cachedData = loadJSONFromStorage<CachedItem>(cacheKey);

      if (!cachedData) {
        //console.log(`ℹ️ Extractor ${extractorName} is not installed`);
        return true;
      }

      try {
        await FileSystem.deleteAsync(cachedData.filePath);
        storage.delete(cacheKey);
        //console.log(`🗑️ Extractor ${extractorName} uninstalled successfully`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to uninstall extractor ${extractorName}:`, error);
        return false;
      }
    },

    isExtractorInstalled: (extractorName: string) => {
      const cacheKey = getCacheKey('extractor', extractorName);
      const cachedData = loadJSONFromStorage<CachedItem>(cacheKey);
      return cachedData !== null;
    },

    getInstalledExtractors: () => {
      const { registry } = get();
      if (!registry) return [];

      return registry.extractors.filter((extr) => get().isExtractorInstalled(extr.name));
    },

    readExtensionCode: async (extensionId: string) => {
      const cacheKey = getCacheKey('extension', extensionId);
      const cachedData = loadJSONFromStorage<CachedItem>(cacheKey);

      if (!cachedData) {
        console.error(`❌ Extension ${extensionId} is not installed`);
        return null;
      }

      try {
        const code = await FileSystem.readAsStringAsync(cachedData.filePath);
        return code;
      } catch (error) {
        console.error(`❌ Failed to read extension code for ${extensionId}:`, error);
        return null;
      }
    },

    readExtractorCode: async (extractorName: string) => {
      const cacheKey = getCacheKey('extractor', extractorName);
      const cachedData = loadJSONFromStorage<CachedItem>(cacheKey);

      if (!cachedData) {
        console.error(`❌ Extractor ${extractorName} is not installed`);
        return null;
      }

      try {
        const code = await FileSystem.readAsStringAsync(cachedData.filePath);
        return code;
      } catch (error) {
        console.error(`❌ Failed to read extractor code for ${extractorName}:`, error);
        return null;
      }
    },

    getExtensionInfo: (extensionId: string) => {
      const { registry } = get();
      return registry?.extensions.find((ext) => ext.id === extensionId) || null;
    },

    getExtractorInfo: (extractorName: string) => {
      const { registry } = get();
      return registry?.extractors.find((extr) => extr.name === extractorName) || null;
    },

    checkForUpdates: async () => {
      const { registry } = get();
      if (!registry) return { extensions: [], extractors: [] };

      const extensionUpdates: string[] = [];
      const extractorUpdates: string[] = [];

      //console.log('🔍 Checking for updates...');

      // Check extensions for updates
      for (const extension of registry.extensions) {
        const cacheKey = getCacheKey('extension', extension.id);
        const cachedData = loadJSONFromStorage<CachedItem>(cacheKey);

        //console.log(`Extension ${extension.id}:`, {
        //   registryVersion: extension.version,
        //   cachedVersion: cachedData?.version,
        //   isInstalled: cachedData !== null,
        //   needsUpdate: cachedData && cachedData.version !== extension.version,
        // });

        if (cachedData && cachedData.version !== extension.version) {
          extensionUpdates.push(extension.id);
          //console.log(`🔄 Update available for ${extension.id}: ${cachedData.version} → ${extension.version}`);
        }
      }

      // Check extractors for updates
      for (const extractor of registry.extractors) {
        const cacheKey = getCacheKey('extractor', extractor.name);
        const cachedData = loadJSONFromStorage<CachedItem>(cacheKey);

        if (cachedData && cachedData.version !== extractor.version) {
          extractorUpdates.push(extractor.name);
        }
      }

      //console.log(
      //   `📊 Updates available - Extensions: ${extensionUpdates.length}, Extractors: ${extractorUpdates.length}`,
      // );
      //console.log('Extension updates:', extensionUpdates);

      return { extensions: extensionUpdates, extractors: extractorUpdates };
    },

    clearCache: async () => {
      try {
        //console.log('🧹 Clearing extension cache...');

        // Clear file storage
        await FileSystem.deleteAsync(EXTENSIONS_CACHE_DIR, { idempotent: true });
        await FileSystem.deleteAsync(EXTRACTORS_CACHE_DIR, { idempotent: true });

        // Clear MMKV storage
        const { registry } = get();
        if (registry) {
          // Clear extension cache keys
          for (const extension of registry.extensions) {
            const cacheKey = getCacheKey('extension', extension.id);
            storage.delete(cacheKey);
          }

          // Clear extractor cache keys
          for (const extractor of registry.extractors) {
            const cacheKey = getCacheKey('extractor', extractor.name);
            storage.delete(cacheKey);
          }
        }

        // Clear registry metadata
        storage.delete(REGISTRY_METADATA_KEY);

        // Reset state
        set({ registry: null, error: null });

        //console.log('✅ Cache cleared successfully');
      } catch (error) {
        console.error('❌ Failed to clear cache:', error);
        throw error;
      }
    },

    getStorageSize: async () => {
      try {
        let totalSize = 0;

        // Get extensions directory size
        const extensionsInfo = await FileSystem.getInfoAsync(EXTENSIONS_CACHE_DIR);
        if (extensionsInfo.exists && extensionsInfo.isDirectory) {
          const extensionFiles = await FileSystem.readDirectoryAsync(EXTENSIONS_CACHE_DIR);
          for (const file of extensionFiles) {
            const fileInfo = await FileSystem.getInfoAsync(`${EXTENSIONS_CACHE_DIR}/${file}`);
            if (fileInfo.exists && 'size' in fileInfo) {
              totalSize += (fileInfo as any).size || 0;
            }
          }
        }

        // Get extractors directory size
        const extractorsInfo = await FileSystem.getInfoAsync(EXTRACTORS_CACHE_DIR);
        if (extractorsInfo.exists && extractorsInfo.isDirectory) {
          const extractorFiles = await FileSystem.readDirectoryAsync(EXTRACTORS_CACHE_DIR);
          for (const file of extractorFiles) {
            const fileInfo = await FileSystem.getInfoAsync(`${EXTRACTORS_CACHE_DIR}/${file}`);
            if (fileInfo.exists && 'size' in fileInfo) {
              totalSize += (fileInfo as any).size || 0;
            }
          }
        }

        return totalSize;
      } catch (error) {
        console.error('❌ Failed to calculate storage size:', error);
        return 0;
      }
    },
  };
});

// --- Helper Hooks ---

export const useConsumetExtensions = () => {
  const ExtensionStore = useExtensionStore();
  const providerManager = new ProviderManager(ExtensionStore.registry);
  const extractorManager = new ExtractorManager(ExtensionStore.registry);

  return {
    ...ExtensionStore,
    providerManager,
    extractorManager,
  };
};

export default useExtensionStore;
