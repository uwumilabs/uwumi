import { useMemo } from 'react';
import { create } from 'zustand';
import { storage } from '@/hooks/stores/MMKV';
import { MediaType } from '@/constants/types';
import { MANGA } from 'react-native-consumet';
import { useExtensionStore } from '@/hooks/stores/useExtensionStore';

interface Provider {
  name: string;
  value: string;
  subbed?: boolean;
  dubbed?: boolean;
  embed?: boolean;
  nonEmbed?: boolean;
}

interface ProviderGroups {
  [MediaType.ANIME]: Provider[];
  [MediaType.MANGA]: Provider[];
  [MediaType.MOVIE]: Provider[];
}

// Build providers dynamically from the extension store (reads live state each call)
const getProviders = (): ProviderGroups => {
  const installed = useExtensionStore.getState().getInstalledExtensions();
  return {
    [MediaType.ANIME]: installed
      .filter((ext) => ext.category === 'anime')
      .map((ext) => ({
        name: ext.name,
        value: ext.id,
        subbed: ext.subbed,
        dubbed: ext.dubbed,
      })),
    [MediaType.MANGA]: [
      { name: 'Mangadex', value: 'mangadex' },
      { name: 'Mangakakalot', value: 'mangakakalot' },
    ],
    [MediaType.MOVIE]: installed
      .filter((ext) => ext.category === 'movies')
      .map((ext) => ({
        name: ext.name,
        value: ext.id,
        embed: ext.isSourceEmbed,
        nonEmbed: ext.isSourceDirect,
      })),
  };
};

// Reactive hook — re-renders when extensions change in the store
const useProviders = (): ProviderGroups => {
  const registry = useExtensionStore((state) => state.registry);
  return useMemo(() => getProviders(), [registry]);
};

// Legacy compat: PROVIDERS is now a getter-backed object so existing non-component
// code that reads PROVIDERS[mediaType] still works and always gets fresh data.
const PROVIDERS: ProviderGroups = new Proxy({} as ProviderGroups, {
  get(_target, prop) {
    return getProviders()[prop as keyof ProviderGroups];
  },
});

// Default providers for each media type
const DEFAULT_PROVIDERS = {
  [MediaType.ANIME]: 'zoro',
  [MediaType.MANGA]: 'mangadex',
  [MediaType.MOVIE]: 'himovies',
};

// Meta providers (if needed)
const META_PROVIDERS = {
  [MediaType.ANIME]: 'anilist',
  [MediaType.MANGA]: 'anilist-manga',
  [MediaType.MOVIE]: 'tmdb',
};

type MangaProviderInstance = InstanceType<typeof MANGA.MangaDex> | InstanceType<typeof MANGA.MangaKakalot>;

// Overloaded function signatures for type inference
export function createProviderInstance(mediaType: MediaType.MANGA, providerValue: string): MangaProviderInstance;
export function createProviderInstance(mediaType: MediaType, providerValue: string): MangaProviderInstance {
  // Manga provider mapping
  if (mediaType === MediaType.MANGA) {
    const mangaProviders: Record<string, () => MangaProviderInstance> = {
      mangadex: () => new MANGA.MangaDex(),
      mangakakalot: () => new MANGA.MangaKakalot(),
      // Add new providers here in the future
    };

    const providerFunc = mangaProviders[providerValue] || mangaProviders[DEFAULT_PROVIDERS[MediaType.MANGA]];

    if (!providerFunc) {
      throw new Error(`Unsupported manga provider: ${providerValue}`);
    }

    return providerFunc();
  }

  throw new Error(`Unsupported media type: ${mediaType}`);
}

interface ProviderState {
  providers: {
    [key in MediaType]: string;
  };
  setProvider: (mediaType: MediaType, provider: string) => void;
  getProvider: (mediaType: MediaType) => string;
  getAvailableProviders: (mediaType: MediaType) => Provider[];
  getDefaultProvider: (mediaType: MediaType) => string;
  getMetaProvider: (mediaType: MediaType) => string;
}

const STORAGE_KEY = 'mediaProviders';

const getInitialProviders = () => {
  const stored = storage.getString(STORAGE_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_PROVIDERS;
};

export const useProviderStore = create<ProviderState>((set, get) => ({
  providers: getInitialProviders(),

  setProvider: (mediaType, provider) => {
    set((state) => {
      const newProviders = {
        ...state.providers,
        [mediaType]: provider,
      };
      storage.set(STORAGE_KEY, JSON.stringify(newProviders));
      return { providers: newProviders };
    });
  },

  getProvider: (mediaType) => {
    return get().providers[mediaType];
  },

  getAvailableProviders: (mediaType) => {
    return getProviders()[mediaType] || [];
  },

  getDefaultProvider: (mediaType) => {
    return DEFAULT_PROVIDERS[mediaType];
  },

  getMetaProvider: (mediaType) => {
    return META_PROVIDERS[mediaType];
  },
}));

// Export providers for direct access if needed
export { PROVIDERS, getProviders, useProviders, DEFAULT_PROVIDERS, META_PROVIDERS };
