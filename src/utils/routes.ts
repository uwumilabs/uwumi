import { useLocalSearchParams, type Href } from 'expo-router';
import type { MediaFormat, TvType } from 'react-native-consumet';
import type { MediaFeedType, MediaType } from '@/constants/types';
import { EXTERNAL_LINKS } from '@/constants/config';
import { episodeImage, episodeNumber, episodeSeason, type EpisodeContext, type EpisodeItem } from './episodes';
import { META_PROVIDERS } from './media';

/** What the info and watch routes both carry about the show */
export type ShowParams = {
  mediaType: MediaType;
  /** The catalogue's id: AniList for anime and manga, TMDB for movies and TV */
  id: string;
  /** The catalogue's format (TV, Movie, …); a shared link can leave it out */
  type?: MediaFormat | TvType;
};

export type InfoParams = ShowParams & {
  /** As the card showed them, until the info loads (a shared link may carry neither) */
  title?: string;
  image?: string;
  /** Which card opened it, for the shared-element transition */
  sharedTag?: string;
  /** A shared link's episode, which the episode list jumps to */
  episode?: string;
  season?: string;
};

/** The values that are set, as strings: route params, and what's saved to open a route again */
const routeParams = <T extends object>(values: T) =>
  Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) =>
      value === undefined || value === null || value === '' ? [] : [[key, String(value)]],
    ),
  ) as { [K in keyof T]: string };

/** Continue watching and downloads save these to open the episode again */
export type WatchParams = ShowParams & {
  provider: string;
  mediaId?: string;
  /** Empty when the provider didn't find the title */
  episodeId?: string;
  isDubbed?: string;
  uniqueId: string;
  poster?: string;
  title?: string;
  episodeNumber?: string;
  seasonNumber?: string;
};

export const useShowParams = () => useLocalSearchParams<ShowParams>();
export const useInfoParams = () => useLocalSearchParams<InfoParams>();
export const useWatchParams = () => useLocalSearchParams<WatchParams>();

export const infoHref = (params: Omit<InfoParams, 'id'> & { id: string | number }) => ({
  pathname: '/info/[mediaType]' as const,
  params: routeParams(params) as InfoParams,
});

export const watchHref = (params: WatchParams) => ({
  pathname: '/watch/[mediaType]' as const,
  params: routeParams(params) as WatchParams,
});

export const episodeWatchHref = (episode: EpisodeItem, { mediaType, provider, id, mediaId, type }: EpisodeContext) =>
  watchHref({
    mediaType,
    provider,
    id,
    mediaId,
    episodeId: episode.id,
    isDubbed: episode.isDubbed ? 'true' : undefined,
    uniqueId: episode.uniqueId!,
    poster: episodeImage(episode),
    title: episode.title,
    episodeNumber: episodeNumber(episode)?.toString(),
    seasonNumber: episodeSeason(episode)?.toString(),
    type,
  });

/** A link to a title's info page, or one of its episodes: the app opens it, the dash's page shows it otherwise */
export const infoShareLink = ({
  mediaType,
  id,
  type,
  title,
  episode,
  season,
}: Pick<InfoParams, 'mediaType' | 'id' | 'type' | 'title'> & {
  episode?: string | number;
  season?: string | number;
}) => {
  // The dash reads metaProvider to know where to look the title up
  const query = Object.entries(
    routeParams({ id, metaProvider: META_PROVIDERS[mediaType], type, title, episode, season }),
  )
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return `${EXTERNAL_LINKS.SHARE_LINK_BASE}/info/${mediaType}?${query}`;
};

/** The shared-element transition between a card and the info screen it opens */
export const sharedTransitionTags = (id: string | number, sharedTag?: string) => {
  const tag = sharedTag ?? id;
  return { image: `shared-image-${tag}`, title: `shared-title-${tag}` };
};

export type ReaderParams = {
  /** The AniList id */
  id: string;
  chapter: string;
  provider: string;
  /** Opened from the previous or next chapter button, with the reader already open */
  continued?: string;
  /** The manga's, for Continue reading and History */
  title?: string;
  image?: string;
};

export const useReaderParams = () => useLocalSearchParams<ReaderParams>();

export const readerHref = (params: ReaderParams) => ({
  pathname: '/read/[id]' as const,
  params: routeParams(params),
});

/** A feed's full list, from its home row */
export type BrowseParams = { mediaType: MediaType; feed: MediaFeedType; title: string };

export const useBrowseParams = () => useLocalSearchParams<BrowseParams>();

export const browseHref = (params: BrowseParams) => ({ pathname: '/browse/[mediaType]' as const, params });

export const useSearchRouteParams = () => useLocalSearchParams<{ mediaType: MediaType }>();

export const searchHref = (mediaType: MediaType) => ({
  pathname: '/search/[mediaType]' as const,
  params: { mediaType },
});

/** The settings screens, in the root stack: their header titles and where they are */
export const SETTINGS_SCREENS = {
  settings: { title: 'Settings', href: '/(settings)/settings' },
  about: { title: 'About', href: '/(settings)/about' },
  appearance: { title: 'Appearance', href: '/(settings)/appearance' },
  player: { title: 'Player', href: '/(settings)/player' },
  reader: { title: 'Reader', href: '/(settings)/reader' },
  favorites: { title: 'Favorites', href: '/(settings)/favorites' },
  downloads: { title: 'Downloads', href: '/(settings)/downloads' },
  extensions: { title: 'Extensions', href: '/(settings)/extensions' },
  history: { title: 'History', href: '/(settings)/history' },
  statistics: { title: 'Statistics', href: '/(settings)/statistics' },
  data: { title: 'Data and storage', href: '/(settings)/data' },
  example: { title: 'Example', href: '/(settings)/example' },
} as const satisfies Record<string, { title: string; href: Href }>;

export type SettingsScreen = keyof typeof SETTINGS_SCREENS;

/** The Downloads screen as a deep link, for the download notification */
export const DOWNLOADS_LINK = `uwumi:/${SETTINGS_SCREENS.downloads.href}`;
