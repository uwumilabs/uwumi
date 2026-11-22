import { IEpisodeServer, ISource, PolyURL, StreamingServers, SubOrDub, TvType } from 'react-native-consumet';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { fetchJson, HttpError } from '@/utils/http';
import { ExternalSubtitleData, MediaType, type SubtitleTrack } from '@/constants/types';
import { isThumbnailTrack, subtitleFormat, subtitleLanguageCode } from '@/utils/subtitles';
import {
  getExtensionManagers,
  loadAnimeProvider,
  loadMovieProvider,
  loadServerExtractor,
} from '@/hooks/stores/useExtensionStore';

/**
 * Only embed providers with several servers hand the server URL to a registry extractor.
 * Direct-source providers (e.g. NetMirror, VegaMovies) and single-server providers resolve
 * sources themselves, and their server names ("Netflix", "CF Storage") aren't extractors.
 */
const needsExtractor = (metadata: { haveMultiServers?: boolean; isSourceDirect?: boolean }) =>
  Boolean(metadata.haveMultiServers) && !metadata.isSourceDirect;

/** Which episode to find servers and sources for. Part of the query keys, so keep it to plain values. */
export interface EpisodeTarget {
  mediaType: MediaType;
  provider: string;
  episodeId: string;
  mediaId?: string;
  dub?: boolean;
}

export const episodeTarget = ({ mediaType, provider, episodeId, mediaId, dub }: EpisodeTarget): EpisodeTarget =>
  mediaType === MediaType.ANIME
    ? { mediaType, provider, episodeId, dub: !!dub }
    : { mediaType, provider, episodeId, mediaId: mediaId ?? '' };

/** The server answered but has no playable sources, so rotation moves on to the next one. */
export class NoSourcesError extends Error {
  constructor(serverName: string) {
    super(`No video sources on ${serverName}`);
    this.name = 'NoSourcesError';
  }
}

async function fetchEpisodeServers({ mediaType, provider, episodeId, mediaId, dub }: EpisodeTarget) {
  const servers =
    mediaType === MediaType.ANIME
      ? await (await loadAnimeProvider(provider)).fetchEpisodeServers(episodeId, dub ? SubOrDub.DUB : SubOrDub.SUB)
      : await (await loadMovieProvider(provider)).fetchEpisodeServers(episodeId, mediaId ?? '');
  if (!servers?.length) throw new Error('No servers available for this episode');
  return servers as IEpisodeServer[];
}

/** A server's sources as the player, the episode sheet and downloads take them, whatever the provider sent */
export interface PlayableSource {
  sources: ISource['sources'];
  subtitles: SubtitleTrack[];
  /** The provider's seek-preview sprite list, which it sends among the subtitles */
  thumbnails?: string;
  /** Request headers; providers sometimes put other values in */
  headers?: Record<string, string>;
}

const playable = ({ sources, subtitles = [], headers }: ISource): PlayableSource => {
  const requestHeaders =
    headers && typeof headers === 'object'
      ? (Object.fromEntries(Object.entries(headers).filter(([, value]) => typeof value === 'string')) as Record<
          string,
          string
        >)
      : undefined;
  return {
    sources,
    subtitles: subtitles
      .filter((sub) => !isThumbnailTrack(sub))
      .map((sub) => ({
        title: sub.lang,
        language: subtitleLanguageCode(sub.lang),
        format: subtitleFormat(sub.url),
        uri: sub.url,
        headers: requestHeaders,
      })),
    thumbnails: subtitles.find((sub) => isThumbnailTrack(sub))?.url,
    headers: requestHeaders,
  };
};

async function fetchServerSources(target: EpisodeTarget, server: IEpisodeServer): Promise<PlayableSource> {
  const { mediaType, provider, episodeId, mediaId, dub } = target;
  const fromProvider = async () =>
    (mediaType === MediaType.ANIME
      ? await (
          await loadAnimeProvider(provider)
        ).fetchEpisodeSources(episodeId, server.name as StreamingServers, dub ? SubOrDub.DUB : SubOrDub.SUB)
      : await (
          await loadMovieProvider(provider)
        ).fetchEpisodeSources(episodeId, mediaId ?? '', server.name as StreamingServers)) as ISource;

  const metadata = getExtensionManagers().providerManager.getExtensionMetadata(provider);
  let data: ISource | undefined;
  if (needsExtractor(metadata)) {
    try {
      const extractor = await loadServerExtractor(server.name);
      data = (await extractor.extract(new PolyURL(server.url), metadata.baseUrl)) as ISource;
    } catch (error) {
      // The provider resolves servers the registry has no extractor for (AniNeko's vivibebe and dood), and often
      // ones its extractor can't
      console.warn(`[sources] ${server.name}: extractor failed, asking the provider`, error);
    }
  }
  data ??= await fromProvider();
  if (!data?.sources?.some((source) => source.url)) throw new NoSourcesError(server.name);
  return playable(data);
}

export function useEpisodeServers(target: EpisodeTarget, enabled = true) {
  return useQuery<IEpisodeServer[]>({
    queryKey: ['watch', 'servers', target],
    queryFn: () => fetchEpisodeServers(target),
    enabled: enabled && !!target.episodeId,
  });
}

/**
 * One server's sources. The player's rotation gives each try its own `attempt`, so every try fetches fresh links
 * (they're often signed and expire) and a failed try never comes back from the cache.
 */
export function useEpisodeSources(target: EpisodeTarget, server: IEpisodeServer | undefined, attempt: string) {
  return useQuery<PlayableSource>({
    queryKey: ['watch', 'sources', target, server?.name, attempt],
    queryFn: () => fetchServerSources(target, server!),
    enabled: !!server && !!target.episodeId,
    // Rotation is the retry
    retry: false,
    staleTime: Infinity,
    gcTime: 30 * 1000,
    refetchOnReconnect: false,
  });
}

// OpenSubtitles returns every upload for the title; the most downloaded few are the likeliest to fit
const MAX_EXTERNAL_SUBTITLES = 3;
// The player reads subtitle files as UTF-8, so a CP1252 file's accents come out garbled. OpenSubtitles no longer
// converts them on download.
const isUtf8 = (item: ExternalSubtitleData) => item.SubEncoding === 'UTF-8' || item.SubEncoding === 'ASCII';
// The menu's OpenSubtitles search waits for these, so a slow response gives up
const EXTERNAL_SUBTITLES_TIMEOUT_MS = 5000;

interface ExternalSubtitlesParams {
  imdbId: string;
  episodeNumber?: string;
  seasonNumber?: string;
  type?: string;
  language: string | null;
}

export const canSearchExternalSubtitles = ({
  imdbId,
  episodeNumber,
  seasonNumber,
  type,
}: Omit<ExternalSubtitlesParams, 'language'>) =>
  Boolean(imdbId && (type !== TvType.TVSERIES || (episodeNumber && seasonNumber)));

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
            language: subtitleLanguageCode(language ?? undefined),
            format: 'srt' as const,
            // The link without .gz serves the file uncompressed
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

// "mixed" is an opening or ending over the story; the plain one wins when both are submitted for an episode
const MIXED_TYPES = new Set(['mixed-op', 'mixed-ed']);

/**
 * One interval per kind, without the impossible ones: AniSkip returns every submission, and some are wrong (JJK
 * episode 18 has a "mixed-ed" at 0:00–1:30 next to its real ending, which showed "Skip outro" as it started).
 */
const sanitizeSkipTimes = (results: AniSkipResponse['results'], episodeLength: number): SkipTime[] => {
  const byKind = new Map<SkipTime['type'], SkipTime>();
  const ordered = [...results].sort(
    (a, b) => Number(MIXED_TYPES.has(a.skipType)) - Number(MIXED_TYPES.has(b.skipType)),
  );
  for (const { interval, skipType } of ordered) {
    const type = ANISKIP_TYPES[skipType];
    if (!type || byKind.has(type) || interval.endTime <= interval.startTime) continue;
    // An ending can't start in the first half
    if (type === 'outro' && interval.startTime < episodeLength / 2) continue;
    byKind.set(type, { type, start: interval.startTime, end: interval.endTime });
  }
  return [...byKind.values()].sort((a, b) => a.start - b.start);
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
      return sanitizeSkipTimes(data.results, episodeLength);
    },
  });
}
