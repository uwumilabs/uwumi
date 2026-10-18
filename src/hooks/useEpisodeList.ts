import { useCallback, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MediaFormat, TvType } from 'react-native-consumet';
import { MediaType } from '@/constants/types';
import { useActiveProvider } from '@/constants/provider';
import { useAnimeEpisodes, useMoviesEpisodes } from './queries';
import { useSeasonStore, type EpisodeItem } from './stores/useEpisodesStore';

/**
 * The current route's episodes (the selected season's, for TV shows). The episode list, the watch screen's
 * previous/next and the info header all read it through the query cache rather than a copied store.
 */
export function useEpisodeList() {
  const { mediaType, type, provider, id } = useLocalSearchParams<{
    mediaType: MediaType;
    type: MediaFormat | TvType;
    provider: string;
    id: string;
  }>();
  const providerToUse = useActiveProvider(mediaType, provider);
  const animeResult = useAnimeEpisodes({ id, provider: providerToUse, enabled: mediaType === MediaType.ANIME });
  const movieResult = useMoviesEpisodes({
    id,
    type: type!,
    provider: providerToUse,
    enabled: mediaType === MediaType.MOVIE,
  });
  const { isLoading, error, refetch } = mediaType === MediaType.ANIME ? animeResult : movieResult;
  const movieInfo = mediaType === MediaType.MOVIE ? movieResult.data : undefined;

  const showKey = `${mediaType}-${id}`;
  const storedSeason = useSeasonStore((state) => state.seasons[showKey] ?? 0);
  const setSeasonForShow = useSeasonStore((state) => state.setSeason);
  const setSeason = useCallback((season: number) => setSeasonForShow(showKey, season), [setSeasonForShow, showKey]);

  const movieSeasons = movieInfo?.seasons;
  const activeSeason = movieSeasons && storedSeason >= movieSeasons.length ? 0 : storedSeason;
  const episodes = useMemo<EpisodeItem[]>(() => {
    if (mediaType === MediaType.MOVIE) return movieSeasons?.[activeSeason]?.episodes ?? [];
    return animeResult.data ?? [];
  }, [mediaType, movieSeasons, activeSeason, animeResult.data]);

  // TMDB keeps a season that failed to load in its place, without episodes; refetching may fill it
  const seasonError =
    !error && movieSeasons?.[activeSeason]?.failed ? new Error(`TMDB couldn't load season ${activeSeason + 1}`) : null;

  return {
    episodes,
    // The movie provider's id for the title, for its server and source calls; unset when it has no match
    providerMediaId: movieInfo?.providerId,
    movieSeasons,
    activeSeason,
    setSeason,
    providerToUse,
    isLoading,
    error: error ?? seasonError,
    refetch,
  };
}
