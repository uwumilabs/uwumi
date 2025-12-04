/* eslint-disable react-hooks/rules-of-hooks */
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
import axios from 'axios';
import { ExternalSubtitleData } from '@/constants/types';
import { TextTrackType } from 'react-native-video/src/types/video';
import { SubtitleTrack } from '@/constants/types';
import { useConsumetExtensions } from '../stores';

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
  // console.log('from anime watch query', episodeId, server, provider);
  const { providerManager, readExtensionCode, extractorManager, readExtractorCode } = useConsumetExtensions();
  return useQuery<ISource & { servers?: IEpisodeServer[] }>({
    queryKey: ['watch', episodeId, provider, dub, server],
    enabled: enabled && !!episodeId,
    queryFn: async () => {
      try {
        // let url = `${getFetchUrl().apiUrl}/anime/${provider}/watch/${episodeId}?dub=${dub}`;
        // console.log(url);
        // const { data } = await axios.get(url);
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
        // Check if servers exist before accessing
        if (!servers || servers.length === 0) {
          throw new Error('No servers available for this episode');
        }

        const baseExtractorName = extractorManager.extractBaseExtractorName(servers[0].name ?? server?.name!);
        const extractorCode = await readExtractorCode(baseExtractorName!);
        const metadata = extractorManager.getExtractorMetadata(baseExtractorName!);
        const extractor = await extractorManager.executeExtractorCode(extractorCode!, metadata!);
        let data;
        if (animeProviderMetadata.haveMultiServers) {
          try {
            data = (await extractor.extract(new PolyURL(server?.url!), animeProviderMetadata.baseUrl)) as ISource;
          } catch {
            data = (await animeProvider.fetchEpisodeSources(
              episodeId,
              server?.name as StreamingServers,
              dub ? SubOrDub.DUB : SubOrDub.SUB,
            )) as ISource;
          }
        } else {
          data = (await animeProvider.fetchEpisodeSources(
            episodeId,
            server?.name as StreamingServers,
            dub ? SubOrDub.DUB : SubOrDub.SUB,
          )) as ISource;
        }
        // console.log('useWatchAnimeEpisodes', { ...data, servers });
        return { ...data, servers };
      } catch (error) {
        console.error('Error fetching episode sources:', error);
        throw error;
      }
    },
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
  // console.log('from movie watch query', episodeId, mediaId, server, provider);
  const { providerManager, extractorManager, readExtensionCode, readExtractorCode } = useConsumetExtensions();
  return useQuery<ISource & { servers: IEpisodeServer[] }>({
    queryKey: ['watch', episodeId, mediaId, server, provider, embed],
    enabled: enabled && !!episodeId,
    queryFn: async () => {
      try {
        const extensionCode = await readExtensionCode(provider);
        const movieProviderMetadata = providerManager.getExtensionMetadata(provider);
        const movieProvider = await providerManager.executeProviderCode<MovieProvider>(
          extensionCode!,
          movieProviderMetadata.factoryName,
          movieProviderMetadata as typeof movieProviderMetadata & { id: MovieProvider },
        );
        const servers = (await movieProvider.fetchEpisodeServers(episodeId, mediaId)) as IEpisodeServer[];
        const baseExtractorName = extractorManager.extractBaseExtractorName(servers[0].name ?? server?.name!);
        const extractorCode = await readExtractorCode(baseExtractorName!);
        const metadata = extractorManager.getExtractorMetadata(baseExtractorName!);
        const extractor = await extractorManager.executeExtractorCode(extractorCode!, metadata!);
        let data;
        if (movieProviderMetadata.haveMultiServers) {
          try {
            data = (await extractor.extract(new PolyURL(server?.url!), movieProviderMetadata.baseUrl)) as ISource;
          } catch {
            data = (await movieProvider.fetchEpisodeSources(
              episodeId,
              mediaId,
              server?.name as StreamingServers,
            )) as ISource;
          }
        } else {
          data = (await movieProvider.fetchEpisodeSources(
            episodeId,
            mediaId,
            server?.name as StreamingServers,
          )) as ISource;
        }
        // console.log('useWatchMovieEpisodes', { ...data, servers });
        return { ...data, servers };
      } catch (error) {
        throw new Error(`Error fetching movies episode sources: ${error}`);
      }
    },
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

      //console.log('Fetching external subtitles from:', url);

      try {
        const { data }: { data: ExternalSubtitleData[] } = await axios.get(url, {
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
