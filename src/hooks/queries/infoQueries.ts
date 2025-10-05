import { createProviderInstance, DEFAULT_PROVIDERS } from '@/constants/provider';
import { MediaType, MetaProvider } from '@/constants/types';
import { useQuery } from '@tanstack/react-query';
import {
  IAnimeInfo,
  IMovieInfo,
  MediaFormat,
  META,
  TvType,
  IAnimeEpisode,
  IMangaChapter,
  MovieProvider,
  AnimeProvider,
  ANIME,
} from 'react-native-consumet';
import { useConsumetExtensions } from '../stores';

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
  const { providerManager, readExtensionCode } = useConsumetExtensions();
  return useQuery<IAnimeInfo | IMovieInfo>({
    queryKey: [mediaType, 'info', id, metaProvider, type, provider],
    queryFn: async () => {
      let data: IAnimeInfo | IMovieInfo | undefined;
      try {
        if (metaProvider === 'anilist' || metaProvider === 'anilist-manga') {
          data = (await new META.Anilist().fetchAnilistInfoById(id)) as unknown as IAnimeInfo;
        }
        if (metaProvider === 'tmdb') {
          const movieProviderInitializer = createProviderInstance(MediaType.MOVIE, provider);
          const content = await readExtensionCode(provider);
          const metadata = providerManager.getExtensionMetadata(provider);
          //console.log('Extension metadata:', metadata);

          const movieProvider = await providerManager.executeProviderCode<MovieProvider>(
            content!,
            metadata.factoryName,
            metadata as typeof metadata & { id: MovieProvider },
          );
          // console.log(movieProvider);
          data = (await new META.TMDB(process.env.EXPO_TMDB_API_KEY, movieProvider).fetchMediaInfo(
            id,
            type,
          )) as unknown as IMovieInfo;
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

export function useAnimeEpisodes({ id, provider = DEFAULT_PROVIDERS.anime }: { id: string; provider: string }) {
  // console.log('useAnimeEpisodes is called');
  const { providerManager, readExtensionCode } = useConsumetExtensions();
  return useQuery<IAnimeEpisode>({
    queryKey: ['anime', 'episodes', id, provider],
    queryFn: async () => {
      try {
        const animeProviderInitializer = createProviderInstance(MediaType.ANIME, provider);
        const content = await readExtensionCode(provider);
        const metadata = providerManager.getExtensionMetadata(provider);
        const animeProvider = await providerManager.executeProviderCode<AnimeProvider>(
          content!,
          metadata.factoryName,
          metadata as typeof metadata & { id: AnimeProvider },
        );
        // Object.setPrototypeOf(animeProvider, AnimePahe.prototype);
        const data = (await new META.Anilist(animeProvider).fetchEpisodesListById(id)) as unknown as IAnimeEpisode;
        // console.log(data, animeProvider, animeProvider instanceof ANIME.AnimePahe, animeProviderInitializer);
        return data;
      } catch (error) {
        throw new Error(`Error fetching episodes: ${error}`);
      }
    },
  });
}

export function useMangaChapters({ id, provider = DEFAULT_PROVIDERS.manga }: { id: string; provider: string }) {
  // console.log('useMangaEpisodes is called');

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
}: {
  id: string;
  type: MediaFormat | TvType;
  provider: string;
}) {
  const { providerManager, readExtensionCode } = useConsumetExtensions();
  return useQuery<IMovieInfo>({
    queryKey: ['movies', 'episodes', id, type, provider],
    queryFn: async () => {
      // let url = `${getFetchUrl().episodeApiUrl}/movies/tmdb/episodes/${id}?type=${type.split(' ')[0]}&provider=${provider}`;
      // console.log(url);
      // const { data } = await axios.get(url);
      const movieProviderInitializer = createProviderInstance(MediaType.MOVIE, provider);
      const content = await readExtensionCode(provider);
      const metadata = providerManager.getExtensionMetadata(provider);
      const movieProvider = await providerManager.executeProviderCode<MovieProvider>(
        content!,
        metadata.factoryName,
        metadata as typeof metadata & { id: MovieProvider },
      );
      const data = (await new META.TMDB(process.env.EXPO_TMDB_API_KEY, movieProvider).fetchMediaInfo(
        id,
        type,
      )) as unknown as IMovieInfo;
      //console.log(data);
      return data;
    },
  });
}
