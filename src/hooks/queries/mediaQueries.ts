import { MediaFeedType, MediaType } from '@/constants/types';
import { useInfiniteQuery, useIsFetching, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { ISearch, META } from 'react-native-consumet';
import { TMDB_API_KEY } from '@/constants/config';

type Feed = Exclude<MediaFeedType, 'search'>;

/** The home rows a media type has: TMDB has no "popular" feed */
export const mediaFeeds = (mediaType: MediaType): Feed[] =>
  mediaType === MediaType.MOVIE ? ['trending'] : ['trending', 'popular'];

export const mediaFeedKey = (mediaType: MediaType, feed: Feed) => ['feed', mediaType, feed];

/** Whether the Anime home's first row has its first answer (data or an error), for the launch animation to wait on */
export const useHomeFeedSettled = () => {
  // Re-renders as feeds start and finish fetching, so the state below is read fresh
  useIsFetching({ queryKey: ['feed'] });
  const status = useQueryClient().getQueryState(mediaFeedKey(MediaType.ANIME, 'trending'))?.status;
  return status === 'success' || status === 'error';
};

const nextPage = <T>(lastPage: ISearch<T>, pages: ISearch<T>[]) =>
  lastPage.hasNextPage ? pages.length + 1 : undefined;

export function useMediaFeed<T, TData = InfiniteData<ISearch<T>, number>>(
  mediaType: MediaType,
  feed: Feed,
  options?: { enabled?: boolean; select?: (data: InfiniteData<ISearch<T>, number>) => TData },
) {
  return useInfiniteQuery({
    queryKey: mediaFeedKey(mediaType, feed),
    queryFn: async ({ pageParam = 1 }) => {
      if (mediaType === MediaType.MOVIE) {
        return (await new META.TMDB(TMDB_API_KEY).fetchTrending('all', 'week', pageParam)) as unknown as ISearch<T>;
      }
      const anilist = new META.Anilist();
      const type = mediaType.toUpperCase();
      return (feed === 'trending'
        ? await anilist.advancedSearch(undefined, type, pageParam, 20, undefined, ['TRENDING_DESC'])
        : await anilist.advancedSearch(undefined, type, pageParam)) as unknown as ISearch<T>;
    },
    getNextPageParam: nextPage,
    initialPageParam: 1,
    enabled: options?.enabled ?? true,
    select: options?.select,
  });
}

export function useSearch<T>(mediaType: MediaType, query: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['search', mediaType, query],
    queryFn: async ({ pageParam = 1 }) =>
      (mediaType === MediaType.MOVIE
        ? await new META.TMDB(TMDB_API_KEY).search(query, pageParam)
        : await new META.Anilist().advancedSearch(query, mediaType.toUpperCase(), pageParam)) as unknown as ISearch<T>,
    enabled: enabled && query.length > 0,
    getNextPageParam: nextPage,
    initialPageParam: 1,
  });
}
