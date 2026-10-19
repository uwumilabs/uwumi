import { DEFAULT_PROVIDERS } from '@/constants/provider';
import {
  IEpisodeServer,
  ISource,
  MediaFormat,
  PolyURL,
  StreamingServers,
  SubOrDub,
  TvType,
} from 'react-native-consumet';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { fetchJson, HttpError } from '@/constants/utils';
import { ExternalSubtitleData } from '@/constants/types';
import { TextTrackType } from 'react-native-video/src/types/video';
import { SubtitleTrack } from '@/constants/types';
import { getExtensionManagers, loadAnimeProvider, loadMovieProvider, loadServerExtractor } from '../stores';

/**
 * Only embed providers with several servers hand the server URL to a registry extractor.
 * Direct-source providers (e.g. NetMirror, VegaMovies) and single-server providers resolve
 * sources themselves, and their server names ("Netflix", "CF Storage") aren't extractors.
 */
const needsExtractor = (metadata: { haveMultiServers?: boolean; isSourceDirect?: boolean }) =>
  Boolean(metadata.haveMultiServers) && !metadata.isSourceDirect;

async function fetchAnimeEpisodeSources(
  episodeId: string,
  provider: string,
  server: IEpisodeServer | undefined,
  dub: boolean,
): Promise<ISource & { servers?: IEpisodeServer[] }> {
  const animeProviderMetadata = getExtensionManagers().providerManager.getExtensionMetadata(provider);
  const animeProvider = await loadAnimeProvider(provider);
  const servers = (await animeProvider.fetchEpisodeServers(
    episodeId,
    dub ? SubOrDub.DUB : SubOrDub.SUB,
  )) as IEpisodeServer[];

  if (!servers || servers.length === 0) {
    throw new Error('No servers available for this episode');
  }

  const selectedServer = (server?.name ? servers.find((s) => s.name === server.name) : servers[0]) || servers[0];

  const extractor = needsExtractor(animeProviderMetadata) ? await loadServerExtractor(selectedServer.name) : undefined;

  let data: ISource;
  try {
    if (extractor) {
      try {
        data = (await extractor.extract(new PolyURL(selectedServer.url), animeProviderMetadata.baseUrl)) as ISource;
      } catch (extractErr) {
        console.warn(
          `[watchQueries] Extractor failed for "${selectedServer.name}", falling back to provider:`,
          extractErr,
        );
        data = (await animeProvider.fetchEpisodeSources(
          episodeId,
          selectedServer.name as StreamingServers,
          dub ? SubOrDub.DUB : SubOrDub.SUB,
        )) as ISource;
      }
    } else {
      data = (await animeProvider.fetchEpisodeSources(
        episodeId,
        selectedServer.name as StreamingServers,
        dub ? SubOrDub.DUB : SubOrDub.SUB,
      )) as ISource;
    }
  } catch (sourceErr) {
    console.warn(`[watchQueries] Source extraction failed for "${selectedServer.name}":`, sourceErr);
    return { sources: [], subtitles: [], servers } as unknown as ISource & { servers: IEpisodeServer[] };
  }
  return { ...data, servers };
}

async function fetchMovieEpisodeSources(
  episodeId: string,
  mediaId: string,
  provider: string,
  server: IEpisodeServer | undefined,
): Promise<ISource & { servers: IEpisodeServer[] }> {
  const movieProviderMetadata = getExtensionManagers().providerManager.getExtensionMetadata(provider);
  const movieProvider = await loadMovieProvider(provider);
  const servers = (await movieProvider.fetchEpisodeServers(episodeId, mediaId)) as IEpisodeServer[];

  if (!servers || servers.length === 0) {
    throw new Error('No servers available for this episode');
  }

  const selectedServer = (server?.name ? servers.find((s) => s.name === server.name) : servers[0]) || servers[0];

  const extractor = needsExtractor(movieProviderMetadata) ? await loadServerExtractor(selectedServer.name) : undefined;

  let data: ISource;
  try {
    if (extractor) {
      try {
        data = (await extractor.extract(new PolyURL(selectedServer.url), movieProviderMetadata.baseUrl)) as ISource;
      } catch {
        data = (await movieProvider.fetchEpisodeSources(
          episodeId,
          mediaId,
          selectedServer.name as StreamingServers,
        )) as ISource;
      }
    } else {
      data = (await movieProvider.fetchEpisodeSources(
        episodeId,
        mediaId,
        selectedServer.name as StreamingServers,
      )) as ISource;
    }
  } catch (sourceErr) {
    console.warn(`[watchQueries] Movie source extraction failed for "${selectedServer.name}":`, sourceErr);
    return { sources: [], subtitles: [], servers } as unknown as ISource & { servers: IEpisodeServer[] };
  }
  return { ...data, servers };
}

export function useWatchAnimeEpisodes({
  episodeId,
  provider = DEFAULT_PROVIDERS.anime,
  server,
  dub = false,
  enabled = true,
}: {
  episodeId: string;
  provider: string;
  server?: IEpisodeServer;
  dub: boolean;
  enabled?: boolean;
}) {
  return useQuery<ISource & { servers?: IEpisodeServer[] }>({
    queryKey: ['watch', episodeId, provider, dub, server],
    enabled: enabled && !!episodeId,
    queryFn: () => fetchAnimeEpisodeSources(episodeId, provider, server, dub),
  });
}

export function useWatchMoviesEpisodes({
  episodeId,
  mediaId,
  type,
  provider = DEFAULT_PROVIDERS.movie,
  server,
  embed,
  enabled = true,
}: {
  episodeId: string;
  mediaId: string;
  type: string;
  provider: string;
  server?: IEpisodeServer;
  embed: boolean;
  enabled?: boolean;
}) {
  return useQuery<ISource & { servers: IEpisodeServer[] }>({
    queryKey: ['watch', episodeId, mediaId, server, provider, embed],
    enabled: enabled && !!episodeId,
    queryFn: () => fetchMovieEpisodeSources(episodeId, mediaId, provider, server),
  });
}
// export function useMoviesEpisodesServers({
//   tmdbId,
//   episodeNumber,
//   seasonNumber,
//   type,
//   provider = DEFAULT_PROVIDERS.movie,
//   embed,
// }: {
//   tmdbId: string;
//   episodeNumber: string;
//   seasonNumber: string;
//   type: string;
//   provider: string;
//   embed: boolean;
// }) {
//   // console.log(tmdbId, episodeNumber, seasonNumber, type, provider);

//   return useQuery<IEpisodeServer[]>({
//     queryKey: ['watch', tmdbId, episodeNumber, seasonNumber, provider, embed],
//     queryFn: async () => {
//       try {
//         // console.log(
//         //   `${getFetchUrl().episodeApiUrl}/movies/tmdb/watch/${tmdbId}?episodeNumber=${episodeNumber}&seasonNumber=${seasonNumber}&type=${type.split(' ')[0].toLowerCase()}&server=${server}&embed=${embed}`,
//         // );
//         // const { data } = await axios.get(`${getFetchUrl().episodeApiUrl}/movies/tmdb/watch/${tmdbId}`, {
//         //   params: {
//         //     episodeNumber,
//         //     seasonNumber,
//         //     type: type.split(' ')[0].toLowerCase(),
//         //     ...(server && { server }),
//         //     provider,
//         //     embed,
//         //   },
//         // });
//         const moviesProviderInitializer = createProviderInstance(MediaType.MOVIE, provider);
//         const data = await new moviesProviderInitializer.fetchEpisodeServers(episodeId, mediaId);
//         console.log(data);
//         return data;
//       } catch (error) {
//         throw new Error(`Error fetching movies episode sources: ${error}`);
//       }
//     },
//   });
// }

// OpenSubtitles returns every upload for the title; the most downloaded few are the likeliest to fit
const MAX_EXTERNAL_SUBTITLES = 3;
// The player reads subtitle files as UTF-8, so a CP1252 file's accents come out garbled. OpenSubtitles no longer
// converts them on download.
const isUtf8 = (item: ExternalSubtitleData) => item.SubEncoding === 'UTF-8' || item.SubEncoding === 'ASCII';
// The player waits for these (new tracks would reload the source), so a slow response is dropped
const EXTERNAL_SUBTITLES_TIMEOUT_MS = 5000;

interface ExternalSubtitlesParams {
  imdbId: string;
  episodeNumber?: string;
  seasonNumber?: string;
  type: TvType | MediaFormat;
  language: string | null;
}

/** Whether OpenSubtitles can be searched for this title: it needs an IMDb id, and a TV episode its numbers. */
export const canSearchExternalSubtitles = ({
  imdbId,
  episodeNumber,
  seasonNumber,
  type,
}: Omit<ExternalSubtitlesParams, 'language'>) =>
  Boolean(
    imdbId &&
    imdbId.trim() !== '' &&
    imdbId !== 'tt' &&
    imdbId.length > 2 &&
    (type !== TvType.TVSERIES || (episodeNumber && seasonNumber)),
  );

export const externalSubtitlesQuery = ({
  imdbId,
  episodeNumber,
  seasonNumber,
  type,
  language,
}: ExternalSubtitlesParams) =>
  queryOptions<SubtitleTrack[]>({
    queryKey: ['externalSubtitles', imdbId, episodeNumber, seasonNumber, language],
    queryFn: async () => {
      const url =
        type === TvType.TVSERIES
          ? `https://rest.opensubtitles.org/search/episode-${episodeNumber}/imdbid-${imdbId}/season-${seasonNumber}/sublanguageid-${language}`
          : `https://rest.opensubtitles.org/search/imdbid-${imdbId}/sublanguageid-${language}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), EXTERNAL_SUBTITLES_TIMEOUT_MS);
      try {
        const data = await fetchJson<ExternalSubtitleData[]>(url, {
          headers: {
            'x-user-agent': 'VLSub 0.10.2',
            'X-User-Agent': 'trailers.to-UA',
          },
          signal: controller.signal,
        });
        return data
          .filter((item) => item.SubFormat === 'srt')
          .sort(
            (a, b) => Number(isUtf8(b)) - Number(isUtf8(a)) || Number(b.SubDownloadsCnt) - Number(a.SubDownloadsCnt),
          )
          .slice(0, MAX_EXTERNAL_SUBTITLES)
          .map((item, index) => ({
            index: parseInt(item.IDSubtitleFile),
            language: item.ISO639,
            type: TextTrackType.SUBRIP,
            uri: item.SubDownloadLink.replace('.gz', ''),
            title: `${item.LanguageName} · OpenSubtitles ${index + 1}`,
          }));
      } finally {
        clearTimeout(timeout);
      }
    },
    retry: false,
  });

export function useExternalSubtitles({ enabled = false, ...params }: ExternalSubtitlesParams & { enabled?: boolean }) {
  return useQuery({
    ...externalSubtitlesQuery(params),
    enabled: Boolean(enabled && params.language && canSearchExternalSubtitles(params)),
  });
}

export interface SkipTime {
  type: 'intro' | 'outro' | 'recap';
  start: number;
  end: number;
}

interface AniSkipResponse {
  found: boolean;
  results: { interval: { startTime: number; endTime: number }; skipType: string }[];
}

const ANISKIP_TYPES: Record<string, SkipTime['type']> = {
  op: 'intro',
  'mixed-op': 'intro',
  ed: 'outro',
  'mixed-ed': 'outro',
  recap: 'recap',
};

/**
 * Community intro/outro/recap timestamps from AniSkip, keyed by MyAnimeList id. Empty when it has none.
 * `episodeLength` is the loaded video's duration in seconds: AniSkip then returns the submissions made for a file of
 * that length, instead of every cut's (another release's outro can land mid-episode).
 */
export function useSkipTimes({
  malId,
  episodeNumber,
  episodeLength,
  enabled = true,
}: {
  malId?: number | string;
  episodeNumber?: string;
  episodeLength: number;
  enabled?: boolean;
}) {
  return useQuery<SkipTime[]>({
    queryKey: ['skipTimes', malId, episodeNumber, episodeLength],
    enabled: enabled && !!malId && !!episodeNumber && episodeLength > 0,
    staleTime: Infinity,
    retry: 1,
    queryFn: async () => {
      const types = Object.keys(ANISKIP_TYPES)
        .map((type) => `types=${type}`)
        .join('&');
      let data: AniSkipResponse;
      try {
        data = await fetchJson<AniSkipResponse>(
          `https://api.aniskip.com/v2/skip-times/${malId}/${episodeNumber}?${types}&episodeLength=${episodeLength}`,
        );
      } catch (error) {
        // AniSkip answers 404 when nobody has submitted times for the episode
        if (error instanceof HttpError && error.status === 404) return [];
        throw error;
      }
      return data.results
        .filter(({ skipType }) => ANISKIP_TYPES[skipType])
        .map(({ interval, skipType }) => ({
          type: ANISKIP_TYPES[skipType],
          start: interval.startTime,
          end: interval.endTime,
        }))
        .sort((a, b) => a.start - b.start);
    },
  });
}
