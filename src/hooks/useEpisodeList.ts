import { useCallback, useMemo } from 'react';
import { useShowParams } from '@/utils/routes';
import { MediaType } from '@/constants/types';
import { useActiveProvider } from '@/hooks/stores/useProviderStore';
import { useAnimeEpisodes, useMoviesEpisodes } from '@/hooks/queries/infoQueries';
import { useSeasonStore } from './stores/useEpisodesStore';
import type { EpisodeContext, EpisodeItem } from '@/utils/episodes';

/**
 * The current route's episodes (the selected season's, for TV shows). The episode list, the watch screen's
 * previous/next and the info header all read it through the query cache rather than a copied store.
 */
export function useEpisodeList() {
  const { mediaType, type, id } = useShowParams();
  const providerToUse = useActiveProvider(mediaType);
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

  // The movie provider's id for the title, for its server and source calls; unset when it has no match
  const providerMediaId = movieInfo?.providerId;
  const context = useMemo<EpisodeContext>(
    () => ({ mediaType, provider: providerToUse, id, mediaId: providerMediaId, type }),
    [mediaType, providerToUse, id, providerMediaId, type],
  );

  return {
    episodes,
    context,
    movieSeasons,
    activeSeason,
    setSeason,
    isLoading,
    error: error ?? seasonError,
    refetch,
  };
}
