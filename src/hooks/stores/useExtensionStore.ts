import { create } from 'zustand';
import { storage } from '@/hooks/stores/MMKV';
import axios from 'axios';
import { File, Directory, Paths } from 'expo-file-system';
import { ExtensionManifest, ExtractorInfo, ExtractorManager, ProviderManager } from 'react-native-consumet';

// UWUMI_DIR constant - adjust path as needed for your app
const UWUMI_DIR = new Directory(Paths.document, 'uwumi');

// Constants
const EXTENSIONS_CACHE_DIR = new Directory(UWUMI_DIR, 'extensions');
const EXTRACTORS_CACHE_DIR = new Directory(UWUMI_DIR, 'extractors');
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
const ensureDirectoryExists = async (directory: Directory): Promise<boolean> => {
  try {
    if (!directory.exists) {
      //console.log(`📁 Creating directory: ${directory.uri}`);
      directory.create({ intermediates: true });
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to create directory ${directory.uri}:`, error);
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

const downloadFile = async (url: string, destinationFile: File): Promise<boolean> => {
  try {
    //console.log(`⬇️ Downloading: ${url}`);
    // Ensure parent directory exists
    const parentDir = new Directory(destinationFile.uri.split('/').slice(0, -1).join('/'));
    if (!parentDir.exists) {
      parentDir.create({ intermediates: true });
    }

    // Remove existing file if it exists to avoid conflicts
    if (destinationFile.exists) {
      destinationFile.delete();
    }

    // Download to the parent directory with idempotent option
    const downloadedFile = await File.downloadFileAsync(url, parentDir, { idempotent: true });

    if (downloadedFile.exists) {
      // If the downloaded file has a different name or location, move it to our desired location
      const desiredPath = destinationFile.uri;
      const downloadedPath = downloadedFile.uri;

      if (downloadedPath !== desiredPath) {
        // Move the downloaded file to the correct location
        downloadedFile.move(destinationFile);
      }

      //console.log(`✅ Download completed: ${destinationFile.uri}`);
      return true;
    } else {
      console.error(`❌ Download failed`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Download error:`, error);
    return false;
  }
};

const getFilePath = (type: 'extension' | 'extractor', id: string, version: string): File => {
  const baseDir = type === 'extension' ? EXTENSIONS_CACHE_DIR : EXTRACTORS_CACHE_DIR;
  return new File(baseDir, `${id}_v${version}.js`);
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
          await get().installExtractor(extractorName.toLowerCase());
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
          const oldFile = new File(cachedData.fileUri);
          oldFile.delete();
          //console.log(`🗑️ Removed old version of ${extensionId}`);
        } catch (error) {
          console.warn(`⚠️ Failed to remove old version of ${extensionId}:`, error);
        }
      }

      // Download new version
      const file = getFilePath('extension', extensionId, extensionInfo.version);
      const success = await downloadFile(extensionInfo.main, file);

      if (success) {
        // Get file size
        let fileSize: number | undefined;
        try {
          if (file.exists) {
            fileSize = file.size;
          }
        } catch (error) {
          console.warn('Could not get file size:', error);
        }

        // Save cache metadata
        const cacheData: CachedItem = {
          version: extensionInfo.version,
          fileUri: file.uri,
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
        const file = new File(cachedData.fileUri);
        file.delete();
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

      const extractorInfo = registry.extractors.find((extr) => extr.name.toLowerCase() === extractorName.toLowerCase());
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
          const oldFile = new File(cachedData.fileUri);
          oldFile.delete();
          //console.log(`🗑️ Removed old version of ${extractorName}`);
        } catch (error) {
          console.warn(`⚠️ Failed to remove old version of ${extractorName}:`, error);
        }
      }

      // Download new version
      const file = getFilePath('extractor', extractorName, extractorInfo.version);
      const success = await downloadFile(extractorInfo.main, file);

      if (success) {
        // Get file size
        let fileSize: number | undefined;
        try {
          if (file.exists) {
            fileSize = file.size;
          }
        } catch (error) {
          console.warn('Could not get file size:', error);
        }

        // Save cache metadata
        const cacheData: CachedItem = {
          version: extractorInfo.version,
          fileUri: file.uri,
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
        const file = new File(cachedData.fileUri);
        file.delete();
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
      const cacheKey = getCacheKey('extension', extensionId.toLowerCase());
      const cachedData = loadJSONFromStorage<CachedItem>(cacheKey);

      if (!cachedData) {
        console.error(`❌ Extension ${extensionId} is not installed`);
        return null;
      }

      try {
        const file = new File(cachedData.fileUri);
        const code = await file.text();
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
        const file = new File(cachedData.fileUri);
        const code = await file.text();
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

        // console.log(`Extension ${extension.id}:`, {
        //   registryVersion: extension.version,
        //   cachedVersion: cachedData?.version,
        //   isInstalled: cachedData !== null,
        //   needsUpdate: cachedData && cachedData.version !== extension.version,
        // });

        if (cachedData && cachedData.version !== extension.version) {
          extensionUpdates.push(extension.id);
          console.log(`🔄 Update available for ${extension.id}: ${cachedData.version} → ${extension.version}`);
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

      // console.log(
      //   `📊 Updates available - Extensions: ${extensionUpdates.length}, Extractors: ${extractorUpdates.length}`,
      // );
      // console.log('Extension updates:', extensionUpdates);

      return { extensions: extensionUpdates, extractors: extractorUpdates };
    },

    clearCache: async () => {
      try {
        //console.log('🧹 Clearing extension cache...');

        // Clear file storage
        if (EXTENSIONS_CACHE_DIR.exists) {
          EXTENSIONS_CACHE_DIR.delete();
        }
        if (EXTRACTORS_CACHE_DIR.exists) {
          EXTRACTORS_CACHE_DIR.delete();
        }

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
        if (EXTENSIONS_CACHE_DIR.exists) {
          const extensionFiles = EXTENSIONS_CACHE_DIR.list();
          for (const item of extensionFiles) {
            if (item instanceof File) {
              totalSize += item.size || 0;
            }
          }
        }

        // Get extractors directory size
        if (EXTRACTORS_CACHE_DIR.exists) {
          const extractorFiles = EXTRACTORS_CACHE_DIR.list();
          for (const item of extractorFiles) {
            if (item instanceof File) {
              totalSize += item.size || 0;
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
