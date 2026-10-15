import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Dimensions, StyleProp, View, ViewStyle } from 'react-native'; // Removed Pressable as it's not directly used after changes
import { ISO639_1, TextTrackType, OnLoadData } from 'react-native-video/src';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MediaType, SubtitleTrack, WatchSearchParams } from '@/constants/types';
import { IAnimeInfo, ISubtitle, TvType } from 'react-native-consumet';
import { HUXStack, MaterialIconsIcon, ThemedView } from '@/components';
import { PlayerOverlay, SkipSlot, type UpNext, EpisodesPanel } from './components';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
  useEpisodesIdStore,
  useEpisodeList,
  useSkipTimes,
  getAdjacentEpisodes,
  buildEpisodeRouteParams,
  useWatchProgressStore,
  useWatchAnimeEpisodes,
  useWatchMoviesEpisodes,
  useServerStore,
  useExternalSubtitles,
  useBackHandler,
  useMediaInfo,
  useContinueWatchingStore,
  type EpisodeItem,
} from '@/hooks';
import { useToast } from 'heroui-native';
import { useProviderStore, useActiveProvider, META_PROVIDERS } from '@/constants/provider';
import { constants, SUB_LANGUAGE } from '@/constants/config';
import { useEmbedMode, useProviderSelectionStore } from './components';
import {
  VideoPlayer,
  DefaultLayout,
  useVideoSelector,
  useFullscreen,
  CustomVideoTrack,
  BaseIconButton,
} from 'react-native-video-toolkit';
import { cn } from 'heroui-native';

const Watch = () => {
  const router = useRouter();
  const watchParams = useLocalSearchParams() as unknown as WatchSearchParams;
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
  } = watchParams;
  // console.log(useLocalSearchParams(), 'useLocalSearchParams');
  const { top } = useSafeAreaInsets();
  const setProgress = useWatchProgressStore((state) => state.setProgress);
  const getProgress = useWatchProgressStore((state) => state.getProgress);
  const setProvider = useProviderStore((state) => state.setProvider);
  const currentProvider = useActiveProvider(mediaType);
  const setServers = useServerStore((state) => state.setServers);
  const setCurrentServer = useServerStore((state) => state.setCurrentServer);
  const currentServer = useServerStore((state) => state.currentServer);
  const clearServers = useServerStore((state) => state.clearServers);
  const [serverInitialized, setServerInitialized] = useState(false);
  const { data: mediaInfo } = useMediaInfo();
  const recordContinueWatching = useContinueWatchingStore((state) => state.record);
  const { toast } = useToast();
  const fullscreen = useVideoSelector((state) => state.fullscreen);
  const videoRef = useVideoSelector((state) => state.videoRef);
  const { enterFullscreen, exitFullscreen } = useFullscreen();
  const navigation = useNavigation();
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const openEpisodes = useCallback(() => setEpisodesOpen(true), []);

  const setEpisodeIds = useEpisodesIdStore((state) => state.setEpisodeIds);
  const currentEpisodeId = useEpisodesIdStore((state) => state.currentEpisodeId);
  const currentUniqueId = useEpisodesIdStore((state) => state.currentUniqueId);

  // The same (cached) episode list the screen's EpisodeList shows
  const { episodes } = useEpisodeList();
  const adjacentEpisodes = useMemo(
    () => getAdjacentEpisodes(episodes, currentUniqueId || uniqueId),
    [episodes, currentUniqueId, uniqueId],
  );

  const { prevEpisode, nextEpisode, hasPrev, hasNext } = adjacentEpisodes;

  const { data: skipTimes = [] } = useSkipTimes({
    malId: (mediaInfo as IAnimeInfo | undefined)?.malId,
    episodeNumber,
    enabled: mediaType === MediaType.ANIME,
  });
  const upNext = useMemo<UpNext | undefined>(
    () =>
      nextEpisode
        ? { label: `EP ${nextEpisode.number ?? nextEpisode.episode ?? ''}`.trim(), title: nextEpisode.title }
        : undefined,
    [nextEpisode],
  );

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

  const openEpisode = useCallback(
    (episode: EpisodeItem | null) => {
      const routeParams = buildEpisodeRouteParams(episode, navigationContext);
      if (!routeParams) {
        toast.show({ variant: 'danger', label: 'Unable to navigate', description: 'Episode data is invalid' });
        return;
      }
      router.replace({ pathname: '/watch/[mediaType]', params: routeParams });
    },
    [navigationContext, router, toast],
  );
  const handlePrevEpisode = useCallback(() => {
    if (hasPrev) openEpisode(prevEpisode);
  }, [hasPrev, prevEpisode, openEpisode]);
  const handleNextEpisode = useCallback(() => {
    if (hasNext) openEpisode(nextEpisode);
  }, [hasNext, nextEpisode, openEpisode]);

  // The watch screen is always fullscreen. Changing episode replaces the route, so only leaving the screen exits
  // fullscreen; otherwise every episode would rotate to portrait and back.
  const leavingRef = useRef(false);
  useEffect(() => {
    if (!fullscreen && !leavingRef.current) enterFullscreen();
  }, [fullscreen, enterFullscreen]);
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (event.data.action.type === 'REPLACE') return;
        leavingRef.current = true;
        exitFullscreen();
      }),
    [navigation, exitFullscreen],
  );

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
  const dub = useProviderSelectionStore((state) => state.dub);
  const isEmbed = useEmbedMode(mediaType, currentProvider);
  // console.log({currentEpisodeId , episodeId})
  const animeQuery = useWatchAnimeEpisodes({
    episodeId: (episodeId as string) || (currentEpisodeId as string) || '',
    provider: currentProvider,
    server: currentServer!,
    dub,
    enabled: mediaType === MediaType.ANIME,
  });

  const movieQuery = useWatchMoviesEpisodes({
    episodeId: (episodeId as string) || (currentEpisodeId as string) || '',
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

  useBackHandler(episodesOpen, () => {
    setEpisodesOpen(false);
    return true;
  });

  const lastProgressUpdateRef = useRef({ currentTime: 0, seekableDuration: 0 });
  const recordedEpisodeRef = useRef<string | null>(null);

  // Puts this show at the front of Continue watching; the store keeps an earlier title and image if info hasn't loaded
  const rememberEpisode = useCallback(() => {
    const info = mediaInfo;
    const showTitle = info
      ? typeof info.title === 'string'
        ? info.title
        : info.title?.romaji || info.title?.english
      : undefined;
    const showImage = info?.image;
    const params = Object.fromEntries(
      Object.entries(watchParams).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '',
      ),
    );
    recordContinueWatching({
      mediaType,
      showId: id,
      showTitle,
      showImage,
      uniqueId,
      // Anime lists hold the whole series; a TV show's only holds the current season
      hasNextEpisode:
        mediaType === MediaType.ANIME && adjacentEpisodes.currentIndex >= 0 ? adjacentEpisodes.hasNext : undefined,
      watchParams: params,
      infoParams: {
        mediaType,
        id,
        provider: currentProvider ?? provider,
        metaProvider: META_PROVIDERS[mediaType],
        ...(type && { type: type as string }),
        ...(showTitle && { title: showTitle }),
        ...(showImage && { image: showImage }),
      },
    });
  }, [
    mediaInfo,
    id,
    watchParams,
    recordContinueWatching,
    mediaType,
    uniqueId,
    adjacentEpisodes,
    currentProvider,
    provider,
    type,
  ]);

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
        const progress = (newTime / newDuration) * 100;
        if (!savedProgress || newTime > (savedProgress.currentTime ?? 0)) {
          setProgress(uniqueId, { currentTime: newTime, duration: newDuration, progress });
        }
        // Again on finishing, by when the episode list (and so whether there's a next one) has loaded
        const recordKey = `${uniqueId}:${progress >= constants.PROGRESS_COMPLETION_PERCENTAGE}`;
        if (recordedEpisodeRef.current !== recordKey) {
          recordedEpisodeRef.current = recordKey;
          rememberEpisode();
        }
      }
    },
    [uniqueId, getProgress, setProgress, rememberEpisode],
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

  const sourceHeaders = useMemo<Record<string, string> | undefined>(() => {
    const h = data?.headers;
    if (!h || typeof h !== 'object') return undefined;
    // Flatten to Record<string, string>, dropping any non-string values
    return Object.fromEntries(Object.entries(h).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
  }, [data?.headers]);

  // const gestures = Gesture.Exclusive(doubleTapGesture, brightnessVolumeGesture, singleTapGesture);

  // External subtitles are only offered alongside the source's own
  const subtitleTracks = useMemo<(SubtitleTrack | ISubtitle)[]>(() => {
    if (!data?.subtitles?.length) return [];
    return externalSubtitles?.length ? [...externalSubtitles, ...data.subtitles] : data.subtitles;
  }, [data?.subtitles, externalSubtitles]);

  useEffect(() => {
    if (!isLoading && !source) {
      toast.show({
        variant: 'danger',
        label: 'No video source found',
        description: 'Please try changing servers or quality.',
      });
    }
    if (!isLoading && error) {
      toast.show({
        variant: 'danger',
        label: 'Error loading media',
        description: error?.message || 'An unknown error occurred.',
      });
    }
    if (isExternalSubtitlesError) {
      toast.show({
        variant: 'danger',
        label: 'Error loading external subtitles',
        description: 'Please try changing the subtitle language or check your internet connection.',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        key={(episodeId as string) || (currentEpisodeId as string) || 'video'}
        gestureProps={{ onSwipeUp: openEpisodes }}
        videoProps={{
          resizeMode: 'contain',
          poster: { source: { uri: poster }, resizeMode: 'contain' },
          onProgress: handleProgress,
          reportBandwidth: true,
          automaticallyWaitsToMinimizeStalling: true,
          preventsDisplaySleepDuringVideoPlayback: true,
          allowsEaxternalPlayback: true,
          mixWithOthers: 'mix',
          onError: () => {
            toast.show({ variant: 'danger', label: 'Video Error', description: 'Try changing servers' });
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
          headers: sourceHeaders,
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
            beforeTitle: (
              <BaseIconButton
                onTap={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                IconComponent={() => <MaterialIconsIcon name="arrow-back" size={26} color="white" />}
              />
            ),
            beforeMuteButton: (
              <BaseIconButton
                onTap={openEpisodes}
                IconComponent={() => <MaterialIconsIcon name="video-library" size={24} color="white" />}
              />
            ),
            beforeProgressBar: (
              <HUXStack>
                {/* This view is just to take the whole space */}
                <View className="flex-1 w-full" />
                <SkipSlot skipTimes={skipTimes} upNext={upNext} onNext={handleNextEpisode} />
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
        <PlayerOverlay skipTimes={skipTimes} upNext={upNext} onNext={handleNextEpisode} />
        {upNext && (
          <VideoPlayer.UpNext
            title={upNext.title ? `${upNext.label} · ${upNext.title}` : upNext.label}
            onPlayNext={handleNextEpisode}
          />
        )}
      </VideoPlayer>
      <EpisodesPanel open={episodesOpen} onOpenChange={setEpisodesOpen} onSelect={openEpisode} />
    </ThemedView>
  );
};

export default Watch;
