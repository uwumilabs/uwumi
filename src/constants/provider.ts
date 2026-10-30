import { useMemo } from 'react';
import { create } from 'zustand';
import { storage } from '@/hooks/stores/MMKV';
import { MediaType } from '@/constants/types';
import { MANGA, META } from 'react-native-consumet';
import { useExtensionStore } from '@/hooks/stores/useExtensionStore';

// What META.Anilist.Manga takes (the package doesn't export the MangaParser type itself)
type MangaParser = NonNullable<ConstructorParameters<typeof META.Anilist.Manga>[0]>;

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

// Manga providers come with the library rather than as extensions. Values are what's stored, so keep them stable
const MANGA_PROVIDERS: { name: string; value: string; create: () => MangaParser }[] = [
  { name: 'MangaDex', value: 'mangadex', create: () => new MANGA.MangaDex() },
  { name: 'MangaHere', value: 'mangahere', create: () => new MANGA.MangaHere() },
  { name: 'MangaKakalot', value: 'mangakakalot', create: () => new MANGA.MangaKakalot() },
  { name: 'MangaPill', value: 'mangapill', create: () => new MANGA.MangaPill() },
  { name: 'AsuraScans', value: 'asurascans', create: () => new MANGA.AsuraScans() },
  { name: 'Flame Comics', value: 'flamescans', create: () => new MANGA.FlameScans() },
];

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
    [MediaType.MANGA]: MANGA_PROVIDERS.map(({ name, value }) => ({ name, value })),
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
  const installedVersion = useExtensionStore((state) => state.installedVersion);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- getProviders reads both from the store
  return useMemo(() => getProviders(), [registry, installedVersion]);
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

// A stored choice or a default can name an extension that isn't installed (the defaults predate
// extensions), so fall back to the first one that is
const pickProvider = (available: Provider[], mediaType: MediaType, preferred?: string | null): string => {
  if (preferred && available.some((provider) => provider.value === preferred)) return preferred;
  return available[0]?.value ?? preferred ?? DEFAULT_PROVIDERS[mediaType];
};

const resolveProvider = (mediaType: MediaType, preferred?: string | null): string =>
  pickProvider(getProviders()[mediaType] ?? [], mediaType, preferred);

const useResolvedProvider = (mediaType: MediaType, preferred?: string | null): string => {
  const providers = useProviders();
  return useMemo(
    () => pickProvider(providers[mediaType] ?? [], mediaType, preferred),
    [providers, mediaType, preferred],
  );
};

// Meta providers (if needed)
const META_PROVIDERS = {
  [MediaType.ANIME]: 'anilist',
  [MediaType.MANGA]: 'anilist-manga',
  [MediaType.MOVIE]: 'tmdb',
};

// One instance per provider: some look things up once and reuse them (FlameScans reads the site's build id)
const mangaInstances = new Map<string, MangaParser>();

/** The manga provider for a stored value; an unknown one (from an older version) falls back to the default. */
export const getMangaProvider = (value: string): MangaParser => {
  const entry =
    MANGA_PROVIDERS.find((provider) => provider.value === value) ??
    MANGA_PROVIDERS.find((provider) => provider.value === DEFAULT_PROVIDERS[MediaType.MANGA])!;
  let instance = mangaInstances.get(entry.value);
  if (!instance) {
    instance = entry.create();
    mangaInstances.set(entry.value, instance);
  }
  return instance;
};

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
    return resolveProvider(mediaType);
  },

  getMetaProvider: (mediaType) => {
    return META_PROVIDERS[mediaType];
  },
}));

/** The provider to fetch with: the user's choice if it's still installed, else the first installed one. */
const useActiveProvider = (mediaType: MediaType, fallback?: string | null): string => {
  const stored = useProviderStore((state) => state.providers[mediaType]);
  return useResolvedProvider(mediaType, stored ?? fallback);
};

// Export providers for direct access if needed
export {
  PROVIDERS,
  getProviders,
  useProviders,
  resolveProvider,
  useResolvedProvider,
  useActiveProvider,
  DEFAULT_PROVIDERS,
  META_PROVIDERS,
};
export type { Provider };
