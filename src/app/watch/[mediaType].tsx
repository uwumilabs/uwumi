import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Dimensions, StyleProp, View, ViewStyle } from 'react-native'; // Removed Pressable as it's not directly used after changes
import { ISO639_1, TextTrackType, OnLoadData } from 'react-native-video/src';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MediaType, SubtitleTrack, WatchSearchParams } from '@/constants/types';
import { ISubtitle, TvType } from 'react-native-consumet';
import { EpisodeList, HUXStack, HUYStack, MaterialIconsIcon, ThemedView } from '@/components';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  useEpisodesIdStore,
  useEpisodesStore,
  useWatchProgressStore,
  useWatchAnimeEpisodes,
  useWatchMoviesEpisodes,
  useServerStore,
  useExternalSubtitles,
  useCustomBackHandler,
  useMediaInfoStore,
} from '@/hooks';
import { toast } from 'sonner-native';
import { PROVIDERS, useProviderStore } from '@/constants/provider';
import { SUB_LANGUAGE } from '@/constants/config';
import { useProviderSelectionStore } from './components';
import {
  VideoPlayer,
  DefaultLayout,
  useVideo,
  useFullscreen,
  CustomVideoTrack,
  BaseButton,
  useProgress,
  BaseIconButton,
} from 'react-native-video-toolkit';
import ProviderSelection from './components/ProviderSelection';
import { Button, cn } from 'heroui-native';

const Watch = () => {
  const router = useRouter();
  const {
    mediaType,
    provider,
    id,
    mediaId,
    episodeId,
    uniqueId,
    isDubbed,
    title,
    poster,
    type,
    episodeNumber,
    seasonNumber,
  } = useLocalSearchParams() as unknown as WatchSearchParams;
  // console.log(useLocalSearchParams(), 'useLocalSearchParams');
  const { top } = useSafeAreaInsets();
  const { setProgress, getProgress } = useWatchProgressStore();
  const setProvider = useProviderStore((state) => state.setProvider);
  const currentProvider = useProviderStore((state) => state.providers[mediaType]);
  const { setServers, setCurrentServer, currentServer, clearServers } = useServerStore();
  const [serverInitialized, setServerInitialized] = useState(false);
  const { mediaInfo } = useMediaInfoStore();
  const { state: videoState } = useVideo();
  const { fullscreen, videoRef } = videoState;
  const { exitFullscreen } = useFullscreen();
  const { currentTime, duration, seek } = useProgress();

  const setEpisodeIds = useEpisodesIdStore((state) => state.setEpisodeIds);
  const currentEpisodeId = useEpisodesIdStore((state) => state.currentEpisodeId);
  const currentUniqueId = useEpisodesIdStore((state) => state.currentUniqueId);

  // Episode navigation - get adjacent episodes and navigation helpers from store
  const getAdjacentEpisodes = useEpisodesStore((state) => state.getAdjacentEpisodes);
  const buildEpisodeRouteParams = useEpisodesStore((state) => state.buildEpisodeRouteParams);
  // Subscribe to episodes length only to avoid re-renders on reference changes
  const episodesLength = useEpisodesStore((state) => state.episodes.length);

  // Compute adjacent episodes reactively
  // Note: We use episodesLength instead of episodes array to avoid infinite loops
  // getAdjacentEpisodes reads current episodes from store internally
  const adjacentEpisodes = useMemo(
    () => getAdjacentEpisodes(currentUniqueId ?? uniqueId),
    [getAdjacentEpisodes, currentUniqueId, uniqueId, episodesLength],
  );

  const { prevEpisode, nextEpisode, hasPrev, hasNext } = adjacentEpisodes;

  // Navigation context for building route params
  const navigationContext = useMemo(
    () => ({
      mediaType,
      provider: currentProvider ?? provider,
      id,
      mediaId,
      type: type as string,
    }),
    [mediaType, provider, id, mediaId, type, currentProvider],
  );

  // Navigate to previous episode
  const handlePrevEpisode = useCallback(() => {
    if (!hasPrev || !prevEpisode) return;

    const routeParams = buildEpisodeRouteParams(prevEpisode, navigationContext);
    if (!routeParams) {
      toast.error('Unable to navigate', { description: 'Previous episode data is invalid' });
      return;
    }

    router.replace({
      pathname: '/watch/[mediaType]',
      params: routeParams,
    });
  }, [hasPrev, prevEpisode, buildEpisodeRouteParams, navigationContext, router]);

  // Navigate to next episode
  const handleNextEpisode = useCallback(() => {
    if (!hasNext || !nextEpisode) return;

    const routeParams = buildEpisodeRouteParams(nextEpisode, navigationContext);
    if (!routeParams) {
      toast.error('Unable to navigate', { description: 'Next episode data is invalid' });
      return;
    }

    router.replace({
      pathname: '/watch/[mediaType]',
      params: routeParams,
    });
  }, [hasNext, nextEpisode, buildEpisodeRouteParams, navigationContext, router]);

  useFocusEffect(
    useCallback(() => {
      if (episodeId && uniqueId) {
        setEpisodeIds(episodeId, uniqueId);
      }
      return () => {
        setEpisodeIds('', '');
      };
    }, [uniqueId, episodeId, setEpisodeIds]),
  );

  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('screen').width,
    height: Dimensions.get('screen').height,
  });
  const { dub, isEmbed, setDub, setIsEmbed } = useProviderSelectionStore();
  // console.log({currentEpisodeId , episodeId})
  const animeQuery = useWatchAnimeEpisodes({
    episodeId: currentEpisodeId ?? episodeId,
    provider: currentProvider,
    server: currentServer!,
    dub,
    enabled: mediaType === MediaType.ANIME,
  });

  const movieQuery = useWatchMoviesEpisodes({
    episodeId: currentEpisodeId ?? episodeId,
    mediaId,
    type,
    provider: currentProvider,
    server: currentServer!,
    embed: isEmbed,
    enabled: mediaType === MediaType.MOVIE,
  });

  const { data, isLoading, error } = mediaType === MediaType.ANIME ? animeQuery : movieQuery;

  // Track the current provider to detect changes

  useEffect(() => {
    // Reset server initialization when provider/embed changes
    setServerInitialized(false);
    clearServers();
  }, [isEmbed, currentProvider, clearServers]);

  useEffect(() => {
    // Always process server data when it changes, regardless of serverInitialized
    // This ensures switching providers properly updates the server list
    if (data && 'servers' in data) {
      if (data?.servers && data.servers.length > 0) {
        // Provider has servers - set them
        setServers(data.servers);
        if (!currentServer) {
          setCurrentServer(data.servers[0].name);
        }
        setServerInitialized(true);
      } else if (!serverInitialized) {
        // Provider has no servers (empty array or undefined) - clear them
        // Only do this once to avoid infinite loops
        clearServers();
        setServerInitialized(true);
      }
    }
  }, [data, serverInitialized, setCurrentServer, setServers, clearServers, currentServer, currentProvider]);

  const [subtitleTracks, setSubtitleTracks] = useState<(SubtitleTrack | ISubtitle)[] | undefined>([]);
  const [shouldFetchExternalSubs, setShouldFetchExternalSubs] = useState(false);
  const [externalSubtitleLanguage, setExternalSubtitleLanguage] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(1);
  const [volume, setVolume] = useState(1);
  const [systemVolume, setSystemVolume] = useState(1);

  const parsedMappings = mediaInfo?.mappings ? mediaInfo?.mappings : null;
  const imdbId = parsedMappings?.imdb?.replace('tt', '') || '';
  const isImdbIdValid = imdbId && imdbId.trim() !== '' && imdbId.length > 0;
  const {
    data: externalSubtitles,
    isLoading: isExternalSubtitlesLoading,
    isError: isExternalSubtitlesError,
  } = useExternalSubtitles({
    imdbId,
    episodeNumber,
    seasonNumber,
    type,
    language: SUB_LANGUAGE[externalSubtitleLanguage as keyof typeof SUB_LANGUAGE],
    enabled: shouldFetchExternalSubs && isImdbIdValid,
  });
  // console.log('externalSubtitles', externalSubtitles, isExternalSubtitlesLoading, isExternalSubtitlesError);

  useCustomBackHandler(fullscreen, () => {
    // If in fullscreen, exit fullscreen instead of going back
    if (fullscreen) {
      exitFullscreen();
      return true;
    }
    return false;
  });

  const lastProgressUpdateRef = useRef({ currentTime: 0, seekableDuration: 0 });

  const handleProgress = useCallback(
    ({ currentTime: newTime, seekableDuration: newDuration }: { currentTime: number; seekableDuration: number }) => {
      // Only update state if the time has changed by at least 0.5 seconds to prevent excessive re-renders
      const lastUpdate = lastProgressUpdateRef.current;
      if (Math.abs(newTime - lastUpdate.currentTime) >= 0.5) {
        // setCurrentTime(newTime);
        lastUpdate.currentTime = newTime;
      }
      if (Math.abs(newDuration - lastUpdate.seekableDuration) >= 0.5) {
        // setSeekableDuration(newDuration);
        lastUpdate.seekableDuration = newDuration;
      }

      if (uniqueId && newDuration > 0 && Math.floor(newTime) % 5 === 0) {
        // Save every 5 seconds
        const savedProgress = getProgress(uniqueId);
        if (!savedProgress || newTime > (savedProgress.currentTime ?? 0)) {
          const progressToSave = {
            currentTime: newTime,
            duration: newDuration,
            progress: (newTime / newDuration) * 100,
          };
          setProgress(uniqueId, progressToSave);
        }
      }
    },
    [uniqueId, getProgress, setProgress],
  );

  const videoStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      width: dimensions.width,
      height: fullscreen ? dimensions.height : undefined,
      aspectRatio: 16 / 9,
      backgroundColor: 'black',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
    }),
    [fullscreen, dimensions],
  );

  const videoTracks = useMemo(() => {
    if (!data?.sources || data.sources.length === 0) return undefined;
    const tracks: CustomVideoTrack[] = [];
    data.sources.forEach((track, index) => {
      if (track?.url) {
        const qualityStr = track.quality?.toLowerCase() || '';
        const match = qualityStr.match(/(\d{3,4})p/);
        const height = match ? Number(match[1]) : qualityStr === 'auto' || qualityStr === 'default' ? 9999 : 0;
        tracks.push({
          index,
          height,
          label: qualityStr === 'auto' || qualityStr === 'default' ? 'Auto' : qualityStr.toUpperCase(),
          uri: track.url,
        } as CustomVideoTrack);
      }
    });
    const sortedTracks = tracks.sort((a, b) => (b.height || 0) - (a.height || 0));
    sortedTracks.forEach((track, idx) => {
      (track as CustomVideoTrack & { index: number }).index = idx;
    });
    return sortedTracks;
  }, [data]);

  const source = useMemo(() => {
    return (
      data?.sources?.[0]?.url ||
      data?.sources?.find((s) => s.quality === 'auto' || s.quality === 'default')?.url ||
      data?.sources?.[0]?.url ||
      ''
    );
  }, [data]);

  // const gestures = Gesture.Exclusive(doubleTapGesture, brightnessVolumeGesture, singleTapGesture);

  useEffect(() => {
    if (data?.subtitles && data?.subtitles?.length > 0) {
      //id external subtitles present add them too
      if (externalSubtitles && externalSubtitles.length > 0) {
        const combinedSubtitles = [...externalSubtitles, ...data.subtitles];
        setSubtitleTracks(combinedSubtitles);
      }
      // If no external subtitles, just set the internal ones
      else setSubtitleTracks(data?.subtitles);
    }
    // console.log(
    //   subtitleTracks,
    //   'subtitleTracks',
    //   subtitleTracks
    //     ?.filter((track) => track.kind !== 'thumbnails' && track.lang !== 'thumbnails')
    //     .map((track, index) => ({
    //       title:
    //         ('title' in track ? track.title : undefined) ||
    //         ('lang' in track ? track.lang : track.language) ||
    //         'Untitled',
    //       language: (('lang' in track ? track.lang : track.language)?.toLowerCase() as ISO639_1) || 'en',
    //       type: 'type' in track && track.type !== 'application/x-media-cues' ? track.type : TextTrackType.VTT,
    //       uri: ('url' in track ? track.url : track.uri) || '',
    //       index,
    //     })),
    // );
  }, [data?.subtitles, externalSubtitles]);

  useEffect(() => {
    // Set initial embed state based on provider capabilities
    const currentProviderObj = PROVIDERS[mediaType].find((p) => p.value === currentProvider);
    if (currentProviderObj) {
      // If provider only supports one type, set accordingly
      if (currentProviderObj.embed && !currentProviderObj.nonEmbed) {
        setIsEmbed(true);
      } else if (!currentProviderObj.embed && currentProviderObj.nonEmbed) {
        setIsEmbed(false);
      }
    }
  }, [currentProvider, mediaType, setIsEmbed]);

  useEffect(() => {
    if (!isLoading && !source) {
      toast.error('No video source found', { description: 'Please try changing servers or quality.' });
    }
    if (!isLoading && error) {
      toast.error('Error loading media', {
        description: error?.message || 'An unknown error occurred.',
      });
    }
    if (isExternalSubtitlesError) {
      toast.error('Error loading external subtitles', {
        description: 'Please try changing the subtitle language or check your internet connection.',
      });
    }
  }, [source, isLoading, error, isExternalSubtitlesError]);

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView
      useStatusBar={false}
      onLayout={(e) => {
        setDimensions({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        });
      }}
      style={{
        top: 0,
      }}>
      <VideoPlayer
        videoProps={{
          resizeMode: 'contain',
          poster: { source: { uri: poster }, resizeMode: 'contain' },
          onProgress: handleProgress,
          reportBandwidth: true,
          automaticallyWaitsToMinimizeStalling: true,
          preventsDisplaySleepDuringVideoPlayback: true,
          allowsExternalPlayback: true,
          ignoreSilentSwitch: 'ignore',
          muted: false,
          volume: 1.0,
          audioOutput: 'speaker',
          mixWithOthers: 'mix',
          onError: () => {
            toast.error('Video Error', { description: 'Try changing servers' });
            //console.log('Video Error:', error);
          },
          onLoad: (value: OnLoadData) => {
            // console.log('Video loaded:', value);

            videoRef?.current?.seek(getProgress(uniqueId)?.currentTime || 0);
          },

          subtitleStyle: { paddingBottom: 50, fontSize: 20, opacity: 0.8 },
        }}
        // videoStyle={videoStyle}
        customVideoTracks={videoTracks}
        source={{
          uri: source,
          textTracks: subtitleTracks
            // @ts-ignore
            ?.filter((track) => track.kind !== 'thumbnails' && track.lang !== 'thumbnails')
            .map((track, index) => ({
              title:
                ('title' in track ? track.title : undefined) ||
                ('lang' in track ? track.lang : track.language) ||
                'Untitled',
              language: (('lang' in track ? track.lang : track.language)?.toLowerCase() as ISO639_1) || 'en',
              type: 'type' in track && track.type !== 'application/x-media-cues' ? track.type : TextTrackType.VTT,
              uri: ('url' in track ? track.url : track.uri) || '',
              index,
            })),
          textTracksAllowChunklessPreparation: false,
          bufferConfig: {
            minBufferMs: 85000, // 85s minimum buffer (VLC-like for smooth seeking)
            maxBufferMs: 120000, // 120s maximum buffer (prevents excessive memory usage)
            bufferForPlaybackMs: 2500, // 2.5s initial buffer before playback starts
            bufferForPlaybackAfterRebufferMs: 5000, // 5s buffer after rebuffering for stability
            backBufferDurationMs: 120000, // Keep 120s of back buffer for smooth seeking backwards
            maxHeapAllocationPercent: 0.25, // Use max 25% of heap for buffering
            cacheSizeMB: 512, // 512MB cache size for better performance
          },
        }}>
        <DefaultLayout
          title={title}
          titleProps={{ style: { width: dimensions.width * 0.75 }, numberOfLines: 1 }}
          subtitle={
            type !== TvType.MOVIE ? `${seasonNumber ? `Season ${seasonNumber}` : ''} Episode ${episodeNumber}` : ''
          }
          slots={{
            beforeProgressBar: (
              <HUXStack>
                {/* This view is just to take the whole space */}
                <View className="flex-1 w-full" />
                <BaseButton onTap={() => seek(Math.round(currentTime) + 85)}>
                  <Button variant="secondary">+85s</Button>
                </BaseButton>
              </HUXStack>
            ),
            beforeCenterPlayButton: (
              <BaseIconButton
                onTap={handlePrevEpisode}
                IconComponent={() => (
                  <MaterialIconsIcon
                    name="skip-previous"
                    size={30}
                    color={hasPrev ? 'white' : 'rgba(255,255,255,0.5)'}
                    className={cn('mr-10', !fullscreen && 'mr-5')}
                  />
                )}
              />
            ),
            afterCenterPlayButton: (
              <BaseIconButton
                onTap={handleNextEpisode}
                IconComponent={() => (
                  <MaterialIconsIcon
                    name="skip-next"
                    size={30}
                    color={hasNext ? 'white' : 'rgba(255,255,255,0.5)'}
                    className={cn('ml-10', !fullscreen && 'ml-5')}
                  />
                )}
              />
            ),
          }}
        />
      </VideoPlayer>
      {!fullscreen && (
        <HUYStack className="flex-1 gap-2">
          <ProviderSelection />
          <View className="flex-1">
            <EpisodeList />
          </View>
        </HUYStack>
      )}
    </ThemedView>
  );
};

export default Watch;
