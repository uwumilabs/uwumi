/* eslint-disable react-hooks/rules-of-hooks */
import { createProviderInstance, DEFAULT_PROVIDERS } from '@/constants/provider';
import {
  AnimeProvider,
  IEpisodeServer,
  ISource,
  MediaFormat,
  MovieProvider,
  StreamingServers,
  SubOrDub,
  TvType,
} from 'react-native-consumet';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ExternalSubtitleData, MediaType } from '@/constants/types';
import { TextTrackType } from 'react-native-video/lib/types/video';
import { SubtitleTrack } from '@/constants/types';
import { useConsumetExtensions } from '../stores';

export function useWatchAnimeEpisodes({
  episodeId,
  provider = DEFAULT_PROVIDERS.anime,
  server,
  dub = false,
}: {
  episodeId: string;
  provider: string;
  server: string;
  dub: boolean;
}) {
  // console.log(episodeId, provider, dub);
  const { providerManager, readExtensionCode } = useConsumetExtensions();
  return useQuery<ISource & { servers: IEpisodeServer[] }>({
    queryKey: ['watch', episodeId, provider, dub, server],
    queryFn: async () => {
      try {
        // let url = `${getFetchUrl().apiUrl}/anime/${provider}/watch/${episodeId}?dub=${dub}`;
        // console.log(url);
        // const { data } = await axios.get(url);
        const animeProviderInitializer = createProviderInstance(MediaType.ANIME, provider);
        const content = await readExtensionCode(provider);
        const metadata = providerManager.getExtensionMetadata(provider);
        const animeProvider = await providerManager.executeProviderCode<AnimeProvider>(
          content!,
          metadata.factoryName,
          metadata as typeof metadata & { id: AnimeProvider },
        );
        const data = (await animeProvider.fetchEpisodeSources(
          episodeId,
          server,
          dub ? SubOrDub.DUB : SubOrDub.SUB,
        )) as ISource;
        const servers = (await animeProvider.fetchEpisodeServers(
          episodeId,
          dub ? SubOrDub.DUB : SubOrDub.SUB,
        )) as IEpisodeServer[];
        console.log('useWatchAnimeEpisodes', { ...data, servers });
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
}: {
  episodeId: string;
  mediaId: string;
  type: string;
  provider: string;
  server: string;
  embed: boolean;
}) {
  console.log('from query', episodeId, mediaId, server, provider);
  const { providerManager, readExtensionCode } = useConsumetExtensions();
  return useQuery<ISource & { servers: IEpisodeServer[] }>({
    queryKey: ['watch', episodeId, mediaId, server, provider, embed],
    queryFn: async () => {
      try {
        const moviesProviderInitializer = createProviderInstance(MediaType.MOVIE, provider);
        //console.log(moviesProviderInitializer);
        const content = await readExtensionCode(provider);
        const metadata = providerManager.getExtensionMetadata(provider);
        const movieProvider = await providerManager.executeProviderCode<MovieProvider>(
          content!,
          metadata.factoryName,
          metadata as typeof metadata & { id: MovieProvider },
        );
        const data = (await movieProvider.fetchEpisodeSources(
          episodeId,
          mediaId,
          server as StreamingServers,
        )) as ISource;
        const servers = (await movieProvider.fetchEpisodeServers(episodeId, mediaId)) as IEpisodeServer[];
        //console.log('useWatchMoviesEpisodes', { ...data, servers });
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
