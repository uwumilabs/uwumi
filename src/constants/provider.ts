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

// Define all providers in one place
const PROVIDERS: ProviderGroups = {
  [MediaType.ANIME]: useExtensionStore
    .getState()
    .getInstalledExtensions()
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
  [MediaType.MOVIE]: useExtensionStore
    .getState()
    .getInstalledExtensions()
    .filter((ext) => ext.category === 'movies')
    .map((ext) => ({
      name: ext.name,
      value: ext.id,
      embed: ext.isSourceEmbed,
      nonEmbed: ext.isSourceDirect,
    })),
};

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
    return PROVIDERS[mediaType] || [];
  },

  getDefaultProvider: (mediaType) => {
    return DEFAULT_PROVIDERS[mediaType];
  },

  getMetaProvider: (mediaType) => {
    return META_PROVIDERS[mediaType];
  },
}));

// Export providers for direct access if needed
export { PROVIDERS, DEFAULT_PROVIDERS, META_PROVIDERS };
