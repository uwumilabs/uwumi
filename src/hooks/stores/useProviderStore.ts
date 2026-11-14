import { useMemo } from 'react';
import { create } from 'zustand';
import { MANGA, META, type ExtensionManifest } from 'react-native-consumet';
import { storage } from '@/hooks/stores/MMKV';
import { MediaType } from '@/constants/types';
import { installedExtensions, useExtensionStore } from '@/hooks/stores/useExtensionStore';

// What META.Anilist.Manga takes (the package doesn't export the MangaParser type itself)
type MangaParser = NonNullable<ConstructorParameters<typeof META.Anilist.Manga>[0]>;

export interface Provider {
  name: string;
  value: string;
  subbed?: boolean;
  dubbed?: boolean;
}

type ProviderGroups = Record<MediaType, Provider[]>;

// Manga providers come with the library rather than as extensions. Values are what's stored, so keep them stable
const MANGA_PROVIDERS: { name: string; value: string; create: () => MangaParser }[] = [
  { name: 'MangaDex', value: 'mangadex', create: () => new MANGA.MangaDex() },
  { name: 'MangaHere', value: 'mangahere', create: () => new MANGA.MangaHere() },
  { name: 'MangaKakalot', value: 'mangakakalot', create: () => new MANGA.MangaKakalot() },
  { name: 'MangaPill', value: 'mangapill', create: () => new MANGA.MangaPill() },
  { name: 'AsuraScans', value: 'asurascans', create: () => new MANGA.AsuraScans() },
  { name: 'Flame Comics', value: 'flamescans', create: () => new MANGA.FlameScans() },
];

const groupProviders = (installed: ExtensionManifest[]): ProviderGroups => ({
  [MediaType.ANIME]: installed
    .filter((ext) => ext.category === 'anime')
    .map((ext) => ({ name: ext.name, value: ext.id, subbed: ext.subbed, dubbed: ext.dubbed })),
  [MediaType.MANGA]: MANGA_PROVIDERS.map(({ name, value }) => ({ name, value })),
  [MediaType.MOVIE]: installed
    .filter((ext) => ext.category === 'movies')
    .map((ext) => ({ name: ext.name, value: ext.id })),
});

export const getProviders = (): ProviderGroups => groupProviders(installedExtensions(useExtensionStore.getState()));

/** getProviders, again whenever the registry or the installed extensions change */
export const useProviders = (): ProviderGroups => {
  const registry = useExtensionStore((state) => state.registry);
  const installed = useExtensionStore((state) => state.installed);
  return useMemo(() => groupProviders(installedExtensions({ registry, installed })), [registry, installed]);
};

const DEFAULT_PROVIDERS: Record<MediaType, string> = {
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
  providers: Record<MediaType, string>;
  setProvider: (mediaType: MediaType, provider: string) => void;
}

const STORAGE_KEY = 'mediaProviders';

const getInitialProviders = () => {
  const stored = storage.getString(STORAGE_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_PROVIDERS;
};

export const useProviderStore = create<ProviderState>((set) => ({
  providers: getInitialProviders(),
  setProvider: (mediaType, provider) =>
    set((state) => {
      const providers = { ...state.providers, [mediaType]: provider };
      storage.set(STORAGE_KEY, JSON.stringify(providers));
      return { providers };
    }),
}));

/** The provider to fetch with: the user's choice if it's still installed, else the first installed one. */
export const useActiveProvider = (mediaType: MediaType): string => {
  const stored = useProviderStore((state) => state.providers[mediaType]);
  const providers = useProviders();
  return useMemo(() => pickProvider(providers[mediaType] ?? [], mediaType, stored), [providers, mediaType, stored]);
};

export const useProviderName = (mediaType: MediaType, provider: string) =>
  useProviders()[mediaType]?.find(({ value }) => value === provider)?.name ?? provider;

interface ProviderSelectionState {
  /** Anime: play the dub. For the session, like the player's own choices */
  dub: boolean;
  setDub: (dub: boolean) => void;
}

export const useProviderSelectionStore = create<ProviderSelectionState>((set) => ({
  dub: false,
  setDub: (dub) => set({ dub }),
}));
