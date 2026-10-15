import { DEFAULT_PROVIDERS } from '@/constants/provider';
import {
  AnimeProvider,
  IEpisodeServer,
  ISource,
  MediaFormat,
  MovieProvider,
  PolyURL,
  StreamingServers,
  SubOrDub,
  TvType,
} from 'react-native-consumet';
import { useQuery } from '@tanstack/react-query';
import { fetchJson, HttpError } from '@/constants/utils';
import { ExternalSubtitleData } from '@/constants/types';
import { TextTrackType } from 'react-native-video/src/types/video';
import { SubtitleTrack } from '@/constants/types';
import { useConsumetExtensions } from '../stores';

async function loadServerExtractor(
  serverName: string,
  extractorManager: ReturnType<typeof useConsumetExtensions>['extractorManager'],
  readExtractorCode: ReturnType<typeof useConsumetExtensions>['readExtractorCode'],
) {
  const baseExtractorName = extractorManager.extractBaseExtractorName(serverName);
  if (!baseExtractorName) {
    throw new Error(`No extractor found for server: "${serverName}"`);
  }

  const extractorCode = await readExtractorCode(baseExtractorName);
  if (!extractorCode) {
    throw new Error(`Failed to read extractor code for: "${baseExtractorName}"`);
  }

  const metadata = extractorManager.getExtractorMetadata(baseExtractorName);
  if (!metadata) {
    throw new Error(`No metadata found for extractor: "${baseExtractorName}"`);
  }

  return extractorManager.executeExtractorCode(extractorCode, metadata);
}

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
  providerManager: ReturnType<typeof useConsumetExtensions>['providerManager'],
  extractorManager: ReturnType<typeof useConsumetExtensions>['extractorManager'],
  readExtensionCode: ReturnType<typeof useConsumetExtensions>['readExtensionCode'],
  readExtractorCode: ReturnType<typeof useConsumetExtensions>['readExtractorCode'],
): Promise<ISource & { servers?: IEpisodeServer[] }> {
  const extensionCode = await readExtensionCode(provider);
  const animeProviderMetadata = providerManager.getExtensionMetadata(provider);
  const animeProvider = await providerManager.executeProviderCode<AnimeProvider>(
    extensionCode!,
    animeProviderMetadata.factoryName,
    animeProviderMetadata as typeof animeProviderMetadata & { id: AnimeProvider },
  );
  const servers = (await animeProvider.fetchEpisodeServers(
    episodeId,
    dub ? SubOrDub.DUB : SubOrDub.SUB,
  )) as IEpisodeServer[];

  if (!servers || servers.length === 0) {
    throw new Error('No servers available for this episode');
  }

  const selectedServer = (server?.name ? servers.find((s) => s.name === server.name) : servers[0]) || servers[0];

  const extractor = needsExtractor(animeProviderMetadata)
    ? await loadServerExtractor(selectedServer.name, extractorManager, readExtractorCode)
    : undefined;

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
  providerManager: ReturnType<typeof useConsumetExtensions>['providerManager'],
  extractorManager: ReturnType<typeof useConsumetExtensions>['extractorManager'],
  readExtensionCode: ReturnType<typeof useConsumetExtensions>['readExtensionCode'],
  readExtractorCode: ReturnType<typeof useConsumetExtensions>['readExtractorCode'],
): Promise<ISource & { servers: IEpisodeServer[] }> {
  const extensionCode = await readExtensionCode(provider);
  const movieProviderMetadata = providerManager.getExtensionMetadata(provider);
  const movieProvider = await providerManager.executeProviderCode<MovieProvider>(
    extensionCode!,
    movieProviderMetadata.factoryName,
    movieProviderMetadata as typeof movieProviderMetadata & { id: MovieProvider },
  );
  const servers = (await movieProvider.fetchEpisodeServers(episodeId, mediaId)) as IEpisodeServer[];

  if (!servers || servers.length === 0) {
    throw new Error('No servers available for this episode');
  }

  const selectedServer = (server?.name ? servers.find((s) => s.name === server.name) : servers[0]) || servers[0];

  const extractor = needsExtractor(movieProviderMetadata)
    ? await loadServerExtractor(selectedServer.name, extractorManager, readExtractorCode)
    : undefined;

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
  const { providerManager, readExtensionCode, extractorManager, readExtractorCode } = useConsumetExtensions();
  return useQuery<ISource & { servers?: IEpisodeServer[] }>({
    queryKey: ['watch', episodeId, provider, dub, server],
    enabled: enabled && !!episodeId,
    queryFn: () =>
      fetchAnimeEpisodeSources(
        episodeId,
        provider,
        server,
        dub,
        providerManager,
        extractorManager,
        readExtensionCode,
        readExtractorCode,
      ),
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
  const { providerManager, extractorManager, readExtensionCode, readExtractorCode } = useConsumetExtensions();
  return useQuery<ISource & { servers: IEpisodeServer[] }>({
    queryKey: ['watch', episodeId, mediaId, server, provider, embed],
    enabled: enabled && !!episodeId,
    queryFn: () =>
      fetchMovieEpisodeSources(
        episodeId,
        mediaId,
        provider,
        server,
        providerManager,
        extractorManager,
        readExtensionCode,
        readExtractorCode,
      ),
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

export function useExternalSubtitles({
  imdbId,
  episodeNumber,
  seasonNumber,
  type,
  language = 'eng',
  enabled = false,
}: {
  imdbId: string;
  episodeNumber?: string;
  seasonNumber?: string;
  type: TvType | MediaFormat;
  language?: string;
  enabled?: boolean;
}) {
  // Check if imdbId is valid (not null, undefined, empty, or just 'tt')
  const isImdbIdValid = imdbId && imdbId.trim() !== '' && imdbId !== 'tt' && imdbId.length > 2;

  return useQuery<SubtitleTrack[]>({
    queryKey: ['externalSubtitles', imdbId, episodeNumber, seasonNumber, language],
    queryFn: async () => {
      const url =
        type == TvType.TVSERIES
          ? `https://rest.opensubtitles.org/search/episode-${episodeNumber}/imdbid-${imdbId}/season-${seasonNumber}/sublanguageid-${language}`
          : `https://rest.opensubtitles.org/search/imdbid-${imdbId}/sublanguageid-${language}`;

      console.log('Fetching external subtitles from:', url);

      try {
        const data = await fetchJson<ExternalSubtitleData[]>(url, {
          headers: {
            'x-user-agent': 'VLSub 0.10.2',
            'X-User-Agent': 'trailers.to-UA',
          },
        });

        const subtitles: SubtitleTrack[] = data.map((item) => ({
          index: parseInt(item.IDSubtitleFile),
          language: item.ISO639,
          type: TextTrackType.SUBRIP,
          uri: item.SubDownloadLink.replace('.gz', ''),
          title: item.MovieName || item.MovieReleaseName,
        }));
        // console.log('external subtitles', subtitles);
        if (subtitles.length === 0) {
          throw new Error(`No external subtitles found for the ${language} language.`);
        }
        return subtitles;
      } catch (error) {
        console.error('Error fetching external subtitles:', error);
        throw error;
      }
    },
    // Only enable if imdbId is valid, enabled is true, and for TV series also check episode/season
    enabled: Boolean(enabled && isImdbIdValid && (type !== TvType.TVSERIES || (episodeNumber && seasonNumber))),
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

/** Community intro/outro/recap timestamps from AniSkip, keyed by MyAnimeList id. Empty when it has none. */
export function useSkipTimes({
  malId,
  episodeNumber,
  enabled = true,
}: {
  malId?: number | string;
  episodeNumber?: string;
  enabled?: boolean;
}) {
  return useQuery<SkipTime[]>({
    queryKey: ['skipTimes', malId, episodeNumber],
    enabled: enabled && !!malId && !!episodeNumber,
    staleTime: Infinity,
    retry: 1,
    queryFn: async () => {
      const types = Object.keys(ANISKIP_TYPES)
        .map((type) => `types=${type}`)
        .join('&');
      let data: AniSkipResponse;
      try {
        data = await fetchJson<AniSkipResponse>(
          `https://api.aniskip.com/v2/skip-times/${malId}/${episodeNumber}?${types}&episodeLength=0`,
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
