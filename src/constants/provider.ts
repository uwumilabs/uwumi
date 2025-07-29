import { create } from 'zustand';
import { storage } from '@/hooks/stores/MMKV';
import { MediaType } from '@/constants/types';
import { ANIME, MANGA, MOVIES } from 'react-native-consumet';

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
  [MediaType.ANIME]: [
    // { name: 'Gogoanime', value: 'gogo', subbed: true, dubbed: true },
    { name: 'Zoro', value: 'zoro', subbed: true, dubbed: true },
    { name: 'AnimeKai', value: 'animekai', subbed: true, dubbed: true },
    { name: 'AnimePahe', value: 'animepahe', subbed: true, dubbed: true },
  ],
  [MediaType.MANGA]: [
    { name: 'Mangadex', value: 'mangadex' },
    { name: 'Mangakakalot', value: 'mangakakalot' },
  ],
  [MediaType.MOVIE]: [
    { name: 'HiMovies', value: 'himovies', embed: true, nonEmbed: false },
    { name: 'MultiMovies', value: 'multimovies', embed: true, nonEmbed: false },
    { name: 'MultiStream', value: 'multistream', embed: false, nonEmbed: true },
  ],
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

// Type definitions for each provider instance
type AnimeProviderInstance =
  | InstanceType<typeof ANIME.Zoro>
  | InstanceType<typeof ANIME.AnimeKai>
  | InstanceType<typeof ANIME.AnimePahe>;

type MangaProviderInstance = InstanceType<typeof MANGA.MangaDex> | InstanceType<typeof MANGA.MangaKakalot>;

type MovieProviderInstance =
  | InstanceType<typeof MOVIES.MultiMovies>
  | InstanceType<typeof MOVIES.MultiStream>
  | InstanceType<typeof MOVIES.HiMovies>;

// Overloaded function signatures for type inference
export function createProviderInstance(mediaType: MediaType.ANIME, providerValue: string): AnimeProviderInstance;
export function createProviderInstance(mediaType: MediaType.MANGA, providerValue: string): MangaProviderInstance;
export function createProviderInstance(mediaType: MediaType.MOVIE, providerValue: string): MovieProviderInstance;
export function createProviderInstance(
  mediaType: MediaType,
  providerValue: string,
): AnimeProviderInstance | MangaProviderInstance | MovieProviderInstance {
  // Anime provider mapping
  if (mediaType === MediaType.ANIME) {
    const animeProviders: Record<string, () => AnimeProviderInstance> = {
      zoro: () => new ANIME.Zoro('https://hianime.to'),
      animekai: () => new ANIME.AnimeKai(),
      animepahe: () => new ANIME.AnimePahe(),
      // Add new providers here in the future
    };

    const providerFunc = animeProviders[providerValue] || animeProviders[DEFAULT_PROVIDERS[MediaType.ANIME]];

    if (!providerFunc) {
      throw new Error(`Unsupported anime provider: ${providerValue}`);
    }

    return providerFunc();
  }

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

  // Movie provider mapping
  if (mediaType === MediaType.MOVIE) {
    const movieProviders: Record<string, () => MovieProviderInstance> = {
      multimovies: () => new MOVIES.MultiMovies(),
      multistream: () => new MOVIES.MultiStream(),
      himovies: () => new MOVIES.HiMovies(),
      // Add new providers here in the future
    };

    const providerFunc = movieProviders[providerValue] || movieProviders[DEFAULT_PROVIDERS[MediaType.MOVIE]];

    if (!providerFunc) {
      throw new Error(`Unsupported movie provider: ${providerValue}`);
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
