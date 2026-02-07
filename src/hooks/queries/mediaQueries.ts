import { MediaFeedType, MediaType, MetaProvider } from '@/constants/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ISearch, META } from 'react-native-consumet';

export function useMediaFeed<T>(
  mediaType: MediaType,
  metaProvider: MetaProvider,
  mediaFeedType: MediaFeedType,
  options?: {
    params?: Record<string, unknown>;
    enabled?: boolean;
  },
) {
  return useInfiniteQuery({
    queryKey: [mediaType, mediaFeedType, metaProvider],
    queryFn: async ({ pageParam = 1 }) => {
      let data: ISearch<T> | undefined;
      // console.log(`${getFetchUrl().apiUrl}/meta/${metaProvider}/${mediaFeedType}?page=${pageParam}`);
      // const { data } = await axios.get<ISearch<T>>(`${getFetchUrl().apiUrl}/meta/${metaProvider}/${mediaFeedType}`, {
      //   params: {
      //     page: pageParam,
      //     ...options?.params,
      //   },
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json',
      //   },
      //   timeout: 5000,
      // });
      try {
        if ((metaProvider === 'anilist' || metaProvider === 'anilist-manga') && mediaFeedType === 'trending') {
          data = (await new META.Anilist().advancedSearch(
            undefined,
            mediaType.toUpperCase(),
            pageParam,
            20,
            undefined,
            ['TRENDING_DESC'],
          )) as unknown as ISearch<T>;
        }
        if ((metaProvider === 'anilist' || metaProvider === 'anilist-manga') && mediaFeedType === 'popular') {
          data = (await new META.Anilist().advancedSearch(
            undefined,
            mediaType.toUpperCase(),
            pageParam,
          )) as unknown as ISearch<T>;
        }
        if (metaProvider === 'tmdb' && mediaFeedType === 'trending') {
          data = (await new META.TMDB().fetchTrending('all', 'week', pageParam)) as unknown as ISearch<T>;
        }
      } catch (error) {
        console.error('Error fetching media data:', error);
        throw error;
      }

      if (!data) {
        throw new Error(`Unsupported combination of metaProvider: ${metaProvider} and mediaFeedType: ${mediaFeedType}`);
      }
      // console.log('data', data);
      return data;
    },
    getNextPageParam: (lastPage: ISearch<T>, pages) => {
      if (lastPage.hasNextPage) {
        return pages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: options?.enabled ?? true,
  });
}

export function useAnimeAndMangaSearch<T>(mediaType: MediaType, query: string, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: [mediaType, query],
    queryFn: async ({ pageParam = 1 }) => {
      let data: ISearch<T> | undefined;
      // const url = `${getFetchUrl().apiUrl}/meta/anilist/advanced-search`;
      // const params = { page: pageParam.toString(), query: query, type: mediaType.toUpperCase() };
      // console.log(url, params);

      // const { data } = await axios.get<ISearch<T>>(url, {
      //   params,
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json',
      //   },
      //   timeout: 5000,
      // });
      data = (await new META.Anilist().advancedSearch(
        query,
        mediaType.toUpperCase(),
        pageParam,
      )) as unknown as ISearch<T>;
      return data;
    },
    enabled: (options?.enabled ?? true) && query.length > 0,
    getNextPageParam: (lastPage: ISearch<T>, pages) => {
      if (lastPage.hasNextPage) {
        return pages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}
export function useMovieSearch<T>(mediaType: MediaType, query: string, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: [mediaType, query],
    queryFn: async ({ pageParam = 1 }) => {
      let data: ISearch<T> | undefined;
      // const url = `${getFetchUrl().apiUrl}/meta/tmdb/${query}`;
      // const params = { page: pageParam.toString() };
      // console.log(url, params);

      // const { data } = await axios.get<ISearch<T>>(url, {
      //   params,
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json',
      //   },
      //   timeout: 5000,
      // });
      data = (await new META.TMDB().search(query, pageParam)) as unknown as ISearch<T>;
      return data;
    },
    enabled: (options?.enabled ?? true) && query.length > 0,
    getNextPageParam: (lastPage: ISearch<T>, pages) => {
      if (lastPage.hasNextPage) {
        return pages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}
