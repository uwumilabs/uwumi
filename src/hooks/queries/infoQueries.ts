import { createProviderInstance, DEFAULT_PROVIDERS, META_PROVIDERS, useActiveProvider } from '@/constants/provider';
import { useLocalSearchParams } from 'expo-router';
import { MediaType, MetaProvider } from '@/constants/types';
import { useQuery } from '@tanstack/react-query';
import {
  IAnimeInfo,
  IMovieInfo,
  MediaFormat,
  META,
  TvType,
  IMangaChapter,
  IMetaAnimeEpisode,
} from 'react-native-consumet';
import { loadAnimeProvider, loadMovieProvider } from '../stores';

export const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

export function useInfo({
  mediaType,
  metaProvider,
  type,
  id,
  provider,
}: {
  mediaType: MediaType;
  metaProvider: MetaProvider;
  type: MediaFormat | TvType;
  id: string;
  provider: string;
}) {
  //   console.log('useInfo is called',{
  //   mediaType,
  //   metaProvider,
  //   type,
  //   id,
  //   provider,
  // });
  return useQuery<IAnimeInfo | IMovieInfo>({
    // Only TMDB fetches through the provider; AniList info is the same whichever provider plays it
    queryKey: [mediaType, 'info', id, metaProvider, type, metaProvider === 'tmdb' ? provider : null],
    queryFn: async () => {
      let data: IAnimeInfo | IMovieInfo | undefined;
      try {
        if (metaProvider === 'anilist' || metaProvider === 'anilist-manga') {
          data = (await new META.Anilist().fetchAnilistInfoById(id)) as unknown as IAnimeInfo;
        }
        if (metaProvider === 'tmdb') {
          const movieProvider = await loadMovieProvider(provider);
          data = await new META.TMDB(TMDB_API_KEY, movieProvider).fetchMediaInfo(id, type);
        }
      } catch (error) {
        console.error('Error fetching info data:', error);
        throw error;
      }
      if (!data) {
        throw new Error(`Unsupported meta provider: ${metaProvider}`);
      }
      // console.log(metaProvider, data);
      return data;
    },
  });
}

/**
 * The current route's show info. The info page, its episode sheet and the watch screen all read it through the query
 * cache, so the watch screen has it even when resumed from home.
 */
export function useMediaInfo() {
  const { mediaType, id, type } = useLocalSearchParams<{
    mediaType: MediaType;
    id: string;
    type: MediaFormat | TvType;
  }>();
  const provider = useActiveProvider(mediaType);
  return useInfo({ mediaType, id, type, metaProvider: META_PROVIDERS[mediaType] as MetaProvider, provider });
}

export function useAnimeEpisodes({
  id,
  provider = DEFAULT_PROVIDERS.anime,
  enabled = true,
}: {
  id: string;
  provider: string;
  enabled?: boolean;
}) {
  return useQuery<IMetaAnimeEpisode[]>({
    queryKey: ['anime', 'episodes', id, provider],
    enabled: enabled && !!id,
    queryFn: async () => {
      try {
        const animeProvider = await loadAnimeProvider(provider);
        return await new META.Anilist(animeProvider).fetchEpisodesListById(id);
      } catch (error) {
        throw new Error(`Error fetching episodes: ${error}`);
      }
    },
  });
}

export function useMangaChapters({ id, provider = DEFAULT_PROVIDERS.manga }: { id: string; provider: string }) {
  // console.log('useMangaEpisodes is called',provider);

  return useQuery<IMangaChapter[]>({
    queryKey: ['manga', 'chapters', id, provider],
    queryFn: async () => {
      try {
        const mangaProviderInitializer = createProviderInstance(MediaType.MANGA, provider);
        const data = (await new META.Anilist.Manga(mangaProviderInitializer).fetchMangaInfo(id))
          .chapters as IMangaChapter[];
        // console.log(data);
        return data;
      } catch (error) {
        throw new Error(`Error fetching chapters: ${error}`);
      }
    },
  });
}

export function useMoviesEpisodes({
  id,
  type,
  provider = DEFAULT_PROVIDERS.movie,
  enabled = true,
}: {
  id: string;
  type: MediaFormat | TvType;
  provider: string;
  enabled?: boolean;
}) {
  return useQuery<IMovieInfo>({
    queryKey: ['movies', 'episodes', id, type, provider],
    enabled: enabled && !!id,
    queryFn: async () => {
      // let url = `${getFetchUrl().episodeApiUrl}/movies/tmdb/episodes/${id}?type=${type.split(' ')[0]}&provider=${provider}`;
      // console.log(url);
      // const { data } = await axios.get(url);
      const movieProvider = await loadMovieProvider(provider);
      return new META.TMDB(TMDB_API_KEY, movieProvider).fetchMediaInfo(id, type);
    },
  });
}
