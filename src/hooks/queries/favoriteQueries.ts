import { useMemo } from 'react';
import { type QueryClient, queryOptions, useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { IAnimeResult, IMovieResult } from 'react-native-consumet';
import { MediaType } from '@/constants/types';
import { fetchJson } from '@/constants/utils';
import { useWatchProgressStore } from '../stores';
import { TMDB_API_KEY } from './infoQueries';

type Favorite = IAnimeResult | IMovieResult;

export interface NextEpisode {
  episode: number;
  season?: number;
  /** When it airs, in ms */
  at: number;
}

/** A favorite's episodes aired so far, and the next one if it's scheduled */
export interface ShowSchedule {
  aired: number;
  next?: NextEpisode;
}

const ANILIST_PAGE = 50;
const SCHEDULE_QUERY = `query ($ids: [Int]) {
  Page(perPage: ${ANILIST_PAGE}) { media(id_in: $ids, type: ANIME) { id episodes nextAiringEpisode { episode airingAt } } }
}`;

interface ScheduleMedia {
  id: number;
  episodes: number | null;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
}

/** Per AniList id, one request per 50 shows */
const fetchAnimeSchedules = async (ids: string[]) => {
  const schedules: Record<string, ShowSchedule> = {};
  for (let i = 0; i < ids.length; i += ANILIST_PAGE) {
    const { data } = await fetchJson<{ data: { Page: { media: ScheduleMedia[] } } }>('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: SCHEDULE_QUERY, variables: { ids: ids.slice(i, i + ANILIST_PAGE).map(Number) } }),
    });
    for (const { id, episodes, nextAiringEpisode: next } of data.Page.media) {
      schedules[String(id)] = next
        ? { aired: next.episode - 1, next: { episode: next.episode, at: next.airingAt * 1000 } }
        : { aired: episodes ?? 0 };
    }
  }
  return schedules;
};

interface TmdbEpisode {
  season_number: number;
  episode_number: number;
  air_date?: string;
}

interface TmdbShow {
  seasons?: { season_number: number; episode_count: number }[];
  last_episode_to_air?: TmdbEpisode | null;
  next_episode_to_air?: TmdbEpisode | null;
}

// TMDB gives a day without a time; a TV episode's alert goes out that evening
const TV_ALERT_HOUR = 18;

const alertTime = (airDate?: string) => {
  const [year, month, day] = (airDate ?? '').split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day, TV_ALERT_HOUR).getTime() : undefined;
};

/** Episodes aired so far in a TMDB show's numbered seasons (specials, season 0, left out) */
const airedCount = ({ seasons = [], last_episode_to_air: last }: TmdbShow) => {
  if (!last || last.season_number < 1) return 0;
  // Long runners number episodes across seasons (One Piece's latest is S23E1180), so the number is the count
  const lastSeasonCount = seasons.find(({ season_number }) => season_number === last.season_number)?.episode_count;
  if (lastSeasonCount !== undefined && last.episode_number > lastSeasonCount) return last.episode_number;
  const earlier = seasons
    .filter(({ season_number }) => season_number >= 1 && season_number < last.season_number)
    .reduce((sum, { episode_count }) => sum + episode_count, 0);
  return earlier + last.episode_number;
};

const fetchTvSchedule = async (id: string): Promise<ShowSchedule & { id: string }> => {
  const show = await fetchJson<TmdbShow>(
    `https://api.themoviedb.org/3/tv/${encodeURIComponent(id)}?api_key=${TMDB_API_KEY}`,
  );
  const next = show.next_episode_to_air;
  const at = alertTime(next?.air_date);
  return {
    id,
    aired: airedCount(show),
    ...(next && at && { next: { season: next.season_number, episode: next.episode_number, at } }),
  };
};

const isTvShow = (item: Favorite) => item.mediaType === MediaType.MOVIE && /^tv/i.test(String(item.type ?? ''));

/** Which schedule a favorite has: anime by AniList id, TV shows by TMDB id; movies and manga have none */
export const favoriteKind = (item: Favorite) =>
  item.mediaType === MediaType.ANIME ? 'anime' : isTvShow(item) ? 'tv' : undefined;

const animeIdsOf = (favorites: Favorite[]) =>
  [...new Set(favorites.filter((item) => item.mediaType === MediaType.ANIME).map((item) => String(item.id)))].sort();
const tvIdsOf = (favorites: Favorite[]) => [...new Set(favorites.filter(isTvShow).map((item) => String(item.id)))];

// One definition per query, so the grid's badges and the episode alerts share a cache
const animeScheduleQuery = (ids: string[]) =>
  queryOptions({
    queryKey: ['favorites', 'schedule', 'anime', ids],
    queryFn: () => fetchAnimeSchedules(ids),
    staleTime: 30 * 60 * 1000,
  });
const tvScheduleQuery = (id: string) =>
  queryOptions({
    queryKey: ['favorites', 'schedule', 'tv', id],
    queryFn: () => fetchTvSchedule(id),
    staleTime: 6 * 60 * 60 * 1000,
  });

export interface FavoriteSchedules {
  anime?: Record<string, ShowSchedule>;
  tv: Record<string, ShowSchedule>;
  /** Every schedule fetched: offline or mid-load, an alert sync would cancel alerts that are still right */
  loaded: boolean;
}

const byTvId = (results: UseQueryResult<ShowSchedule & { id: string }>[]) => ({
  byId: Object.fromEntries(results.flatMap(({ data }) => (data ? [[data.id, data] as const] : []))),
  loaded: results.every(({ isSuccess }) => isSuccess),
});

/** Aired counts and next episodes for the favorites grid */
export const useFavoriteSchedules = (favorites: Favorite[]): FavoriteSchedules => {
  const animeIds = useMemo(() => animeIdsOf(favorites), [favorites]);
  const tvIds = useMemo(() => tvIdsOf(favorites), [favorites]);

  const { data: anime, isSuccess: animeLoaded } = useQuery({
    ...animeScheduleQuery(animeIds),
    enabled: animeIds.length > 0,
  });
  const tv = useQueries({
    queries: tvIds.map((id) => ({ ...tvScheduleQuery(id), enabled: !!TMDB_API_KEY })),
    combine: byTvId,
  });

  const loaded = (animeIds.length === 0 || animeLoaded) && tv.loaded;
  return useMemo(() => ({ anime, tv: tv.byId, loaded }), [anime, tv.byId, loaded]);
};

/** The same schedules outside React, through the shared cache; a failed fetch leaves `loaded` false */
export const fetchFavoriteSchedules = async (
  queryClient: QueryClient,
  favorites: Favorite[],
): Promise<FavoriteSchedules> => {
  const animeIds = animeIdsOf(favorites);
  const tvIds = TMDB_API_KEY ? tvIdsOf(favorites) : [];
  const [anime, ...tv] = await Promise.allSettled([
    animeIds.length ? queryClient.fetchQuery(animeScheduleQuery(animeIds)) : Promise.resolve({}),
    ...tvIds.map((id) => queryClient.fetchQuery(tvScheduleQuery(id))),
  ]);
  return {
    anime: anime.status === 'fulfilled' ? anime.value : undefined,
    tv: Object.fromEntries(
      tv.flatMap((result) => (result.status === 'fulfilled' ? [[result.value.id, result.value] as const] : [])),
    ),
    loaded: anime.status === 'fulfilled' && tv.every(({ status }) => status === 'fulfilled'),
  };
};

export const scheduleOf = (item: Favorite, { anime, tv }: FavoriteSchedules): ShowSchedule | undefined => {
  const kind = favoriteKind(item);
  return kind === 'anime' ? anime?.[String(item.id)] : kind === 'tv' ? tv[String(item.id)] : undefined;
};

/**
 * Aniyomi's "unseen" count for the favorites grid: episodes aired so far minus the ones watched to the end, for
 * anime and TV shows. Watch progress is keyed per episode (`${anilistId}$ep=…`, `${tmdbId}-tv-s…-e…`), so the
 * finished ones are counted by that prefix. Shows with nothing left, or no count yet, are left out.
 */
export const useUnwatchedCounts = (favorites: Favorite[]) => {
  const schedules = useFavoriteSchedules(favorites);

  const progresses = useWatchProgressStore((state) => state.progresses);
  const finished = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [uniqueId, progress] of Object.entries(progresses)) {
      if (!progress.isCompleted) continue;
      const anime = /^(\d+)\$ep=/.exec(uniqueId);
      const tv = /^(\d+)-tv-s(\d+)-e\d+$/.exec(uniqueId);
      const key = anime ? `anime:${anime[1]}` : tv && Number(tv[2]) >= 1 ? `tv:${tv[1]}` : undefined;
      if (key) counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [progresses]);

  return useMemo(() => {
    const unwatched = new Map<Favorite, number>();
    for (const item of favorites) {
      const aired = scheduleOf(item, schedules)?.aired;
      if (aired === undefined) continue;
      const left = aired - (finished[`${favoriteKind(item)}:${item.id}`] ?? 0);
      if (left > 0) unwatched.set(item, left);
    }
    return unwatched;
  }, [favorites, schedules, finished]);
};
