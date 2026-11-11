import { useActiveProvider } from '@/hooks/stores/useProviderStore';
import { TMDB_API_KEY } from '@/constants/config';
import { useLocalSearchParams } from 'expo-router';
import { MediaType } from '@/constants/types';
import { useQuery } from '@tanstack/react-query';
import { IAnimeInfo, IMovieInfo, MediaFormat, META, TvType, IMetaAnimeEpisode } from 'react-native-consumet';
import { loadAnimeProvider, loadMovieProvider } from '@/hooks/stores/useExtensionStore';

// A TMDB title's info carries its seasons' episodes on the provider, so the info page and the episode list share it
const tmdbInfoKey = (id: string, type: MediaFormat | TvType, provider: string) => ['tmdb', 'info', id, type, provider];
const fetchTmdbInfo = async (id: string, type: MediaFormat | TvType, provider: string) =>
  new META.TMDB(TMDB_API_KEY, await loadMovieProvider(provider)).fetchMediaInfo(id, type);

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
  const isMovie = mediaType === MediaType.MOVIE;
  return useQuery<IAnimeInfo | IMovieInfo>({
    // AniList info is the same whichever provider plays it
    queryKey: isMovie ? tmdbInfoKey(id, type, provider) : [mediaType, 'info', id],
    queryFn: async () =>
      isMovie
        ? fetchTmdbInfo(id, type, provider)
        : ((await new META.Anilist().fetchAnilistInfoById(id)) as unknown as IAnimeInfo),
  });
}

export function useAnimeEpisodes({
  id,
  provider,
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

export function useMoviesEpisodes({
  id,
  type,
  provider,
  enabled = true,
}: {
  id: string;
  type: MediaFormat | TvType;
  provider: string;
  enabled?: boolean;
}) {
  return useQuery<IMovieInfo>({
    queryKey: tmdbInfoKey(id, type, provider),
    queryFn: () => fetchTmdbInfo(id, type, provider),
    enabled: enabled && !!id,
  });
}
