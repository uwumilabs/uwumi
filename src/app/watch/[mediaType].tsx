/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Dimensions, StyleProp, ViewStyle } from 'react-native'; // Removed Pressable as it's not directly used after changes
import Video, {
  ISO639_1,
  SelectedTrackType,
  TextTrackType,
  SelectedVideoTrackType,
  type VideoRef,
  VideoTrack,
  AudioTrack,
} from 'react-native-video';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { Button, Spinner, Text, View, XStack, YStack, styled } from 'tamagui';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ControlsOverlay from './ControlsOverlay';
import { MediaType, SubtitleTrack, WatchSearchParams } from '@/constants/types';
import { ISubtitle } from 'react-native-consumet';
import { ThemedView, EpisodeList } from '@/components';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Brightness from 'expo-brightness';
import { VolumeManager } from 'react-native-volume-manager';
import {
  useEpisodesIdStore,
  useWatchProgressStore,
  useDoubleTapGesture,
  useWatchAnimeEpisodes,
  useWatchMoviesEpisodes,
  useServerStore,
  useCurrentTheme,
  usePureBlackBackground,
  useExternalSubtitles,
  useCustomBackHandler,
} from '@/hooks';
import { toast } from 'sonner-native';
import { PROVIDERS, useProviderStore } from '@/constants/provider';
import FullscreenModule from '../../../modules/fullscreen-module';
import { Check } from '@tamagui/lucide-icons';
import { SystemBars, SystemBarsEntry } from 'react-native-edge-to-edge';
import { SUB_LANGUAGE } from '@/constants/config';

const SeekText = styled(Text, {
  fontSize: 10,
  fontWeight: 'bold',
  color: 'white',
  padding: 10,
  backgroundColor: 'rgba(0,0,0,0.5)',
  borderRadius: 8,
});
const OverlayedView = styled(Animated.View, {
  position: 'absolute',
  top: 0,
  // width: 200,
  // height: 200,
  width: '50%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  pointerEvents: 'none',
  zIndex: 10,
  overflow: 'hidden',
  borderRadius: '50%',
  transform: [{ scale: 1.5 }],
  // backgroundColor: 'red',
});

const Watch = () => {
  const {
    mediaType,
    provider,
    id,
    mediaId,
    episodeId,
    uniqueId,
    isDubbed,
    poster,
    type,
    mappings,
    episodeNumber,
    seasonNumber,
  } = useLocalSearchParams() as unknown as WatchSearchParams;
  // console.log(useLocalSearchParams(), 'useLocalSearchParams');
  const { top } = useSafeAreaInsets();
  const { setProgress, getProgress } = useWatchProgressStore();
  const { setProvider, getProvider } = useProviderStore();
  const { setServers, setCurrentServer, currentServer, clearServers } = useServerStore();
  const [isEmbed, setIsEmbed] = useState<boolean>(true);
  const [serverInitialized, setServerInitialized] = useState(false);

  const setEpisodeIds = useEpisodesIdStore((state) => state.setEpisodeIds);
  const currentEpisodeId = useEpisodesIdStore((state) => state.currentEpisodeId);
  const currentTheme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);

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

  const videoRef = useRef<VideoRef>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekableDuration, setSeekableDuration] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [dub, setDub] = useState(false);
  const [playerDimensions, setPlayerDimensions] = useState({ width: 0, height: 0 });
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('screen').width,
    height: Dimensions.get('screen').height,
  });
  const [wrapperDimensions, setWrapperDimensions] = useState({ width: 0, height: 0 }); // Not actively used
  // console.log({currentEpisodeId , episodeId})
  const animeQuery =
    mediaType === MediaType.ANIME
      ? useWatchAnimeEpisodes({
          episodeId: currentEpisodeId ?? episodeId,
          provider: getProvider(mediaType),
          server: currentServer!,
          dub,
        })
      : { data: undefined, isLoading: false, error: null };

  const movieQuery =
    mediaType === MediaType.MOVIE
      ? useWatchMoviesEpisodes({
          episodeId: currentEpisodeId ?? episodeId,
          mediaId,
          type,
          provider: getProvider(mediaType),
          server: currentServer!,
          embed: isEmbed,
        })
      : { data: undefined, isLoading: false, error: null };

  const { data, isLoading, error } = mediaType === MediaType.ANIME ? animeQuery : movieQuery;

  // Track the current provider to detect changes
  const currentProvider = getProvider(mediaType);

  /**
   * keep it for future reference
   */
  // const {
  //   data: serverData,
  //   isLoading: isServerLoading,
  //   error: serverError,
  // } = mediaType === MediaType.MOVIE
  //   ? useMoviesEpisodesServers({ tmdbId: id, episodeNumber, seasonNumber, type, provider, embed: isEmbed })
  //   : { data: undefined, isLoading: false, error: null };

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
  const [nullSubtitleIndex, setNullSubtitleIndex] = useState<number | undefined>(0);
  const [selectedSubtitleIndex, setSelectedSubtitleIndex] = useState<number | undefined>(0);
  const [shouldFetchExternalSubs, setShouldFetchExternalSubs] = useState(false);
  const [externalSubtitleLanguage, setExternalSubtitleLanguage] = useState<string | null>(null);
  const [videoTracks, setVideoTracks] = useState<VideoTrack[]>();
  const [selectedVideoTrackIndex, setSelectedVideoTrackIndex] = useState<number | undefined>(0);
  const [nullAudioTrackIndex, setNullAudioTrackIndex] = useState<number | undefined>(0);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>();
  const [selectedAudioTrackIndex, setSelectedAudioTrackIndex] = useState<number | undefined>(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [volume, setVolume] = useState(1);
  const [systemVolume, setSystemVolume] = useState(1);

  const parsedMappings = mappings ? JSON.parse(mappings) : null;
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

  useCustomBackHandler(isFullscreen, () => {
    // If in fullscreen, exit fullscreen instead of going back
    if (isFullscreen) {
      exitFullscreen();
      return true;
    }
    return false;
  });

  const systemBarsStackEntry = useRef<SystemBarsEntry | null>(null);

  /**
   * systemBarsStackEntry is used to manage the system bars state due to the edge-to-edge support.
   */

  useEffect(() => {
    // Set initial SystemBars state for normal mode
    systemBarsStackEntry.current = SystemBars.pushStackEntry({
      style: 'auto',
      hidden: false,
    });

    const subscription = Dimensions.addEventListener('change', ({ screen }) => {
      setDimensions({ width: screen.width, height: screen.height });
    });

    return () => {
      subscription?.remove();
      if (systemBarsStackEntry.current) {
        SystemBars.popStackEntry(systemBarsStackEntry.current);
        systemBarsStackEntry.current = null;
      }
      Promise.all([
        SystemNavigationBar.setNavigationColor(
          pureBlackBackground ? currentTheme?.color5 || 'black' : currentTheme?.color3 || 'black',
        ),
        SystemNavigationBar.navigationShow(),
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP),
        FullscreenModule.exitFullscreen(),
      ]).catch((err) => console.error('Cleanup failed:', err));
    };
  }, [pureBlackBackground, currentTheme]);

  const enterFullscreen = useCallback(async () => {
    try {
      setIsFullscreen(true);
      if (systemBarsStackEntry.current) {
        systemBarsStackEntry.current = SystemBars.replaceStackEntry(systemBarsStackEntry.current, {
          style: 'dark',
          hidden: true,
        });
      }
      SystemNavigationBar.stickyImmersive();
      await Promise.all([
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE),
        FullscreenModule.enterFullscreen(),
      ]);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
      setIsFullscreen(false);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      setIsFullscreen(false);
      if (systemBarsStackEntry.current) {
        systemBarsStackEntry.current = SystemBars.replaceStackEntry(systemBarsStackEntry.current, {
          style: 'auto',
          hidden: false,
        });
      }
      SystemNavigationBar.setNavigationColor(
        pureBlackBackground ? currentTheme?.color5?.val || 'black' : currentTheme?.color3?.val || 'black',
      );
      SystemNavigationBar.navigationShow();
      await Promise.all([
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP),
        FullscreenModule.exitFullscreen(),
      ]);
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
      setIsFullscreen(true);
    }
  }, [pureBlackBackground, currentTheme]);

  const lastProgressUpdateRef = useRef({ currentTime: 0, seekableDuration: 0 });

  const handleProgress = useCallback(
    ({ currentTime: newTime, seekableDuration: newDuration }: { currentTime: number; seekableDuration: number }) => {
      // Only update state if the time has changed by at least 0.5 seconds to prevent excessive re-renders
      const lastUpdate = lastProgressUpdateRef.current;

      if (Math.abs(newTime - lastUpdate.currentTime) >= 0.5) {
        setCurrentTime(newTime);
        lastUpdate.currentTime = newTime;
      }
      if (Math.abs(newDuration - lastUpdate.seekableDuration) >= 0.5) {
        setSeekableDuration(newDuration);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uniqueId],
  );

  const handlePlayPress = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleMutePress = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleSeek = useCallback((value: number) => {
    videoRef.current?.seek(value);
    setCurrentTime(value);
  }, []);

  const {
    doubleTapGesture,
    doubleTapValue,
    backwardRippleRef,
    forwardRippleRef,
    backwardAnimatedRipple,
    forwardAnimatedRipple,
  } = useDoubleTapGesture({
    videoRef,
    seekInterval: 10,
    onSeekStart: () => console.log('Seek started'),
    onSeekEnd: () => console.log('Seek ended'),
  });

  useEffect(() => {
    const initBrightness = async () => {
      const result = await Brightness.getBrightnessAsync();
      setBrightness(result);
    };

    initBrightness();

    const brightnessListener = Brightness.addBrightnessListener((result) => {
      setVolume(result.brightness);
    });

    return () => brightnessListener.remove();
  }, []);

  const updateBrightness = useCallback(async (value: number) => {
    await Brightness.setBrightnessAsync(value);
    setBrightness(value);
    //console.log('bright:', value);
  }, []);

  useEffect(() => {
    const initVolume = async () => {
      const result = await VolumeManager.getVolume();
      setVolume(result.volume);
      setSystemVolume(result.volume);
    };

    initVolume();

    const volumeListener = VolumeManager.addVolumeListener((result) => {
      setVolume(result.volume);
      setSystemVolume(result.volume);
    });

    return () => volumeListener.remove();
  }, []);

  const updateVolume = useCallback(async (value: number) => {
    try {
      await VolumeManager.setVolume(value, { showUI: false });
      setVolume(value);
      //console.log('volume:', value * 100);
    } catch (error) {
      console.error('Failed to update volume:', error);
    }
  }, []);

  // Vertical gesture handler for brightness/volume
  const brightnessVolumeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .onUpdate((event) => {
          'worklet';
          const side = event.x < dimensions.width / 2 ? 'brightness' : 'volume';
          const delta = -event.translationY / 200;
          if (side === 'brightness') {
            const newBrightness = Math.max(0, Math.min(1, brightness + delta));
            scheduleOnRN(updateBrightness, newBrightness);
          } else {
            const newVolume = Math.max(0, Math.min(1, volume + delta));
            scheduleOnRN(updateVolume, newVolume);
          }
        }),
    [brightness, volume, dimensions.width, updateBrightness, updateVolume],
  );

  // Horizontal gesture handler for seeking
  // const seekGesture = useMemo(
  //   () =>
  //     Gesture.Pan()
  //       .activeOffsetX([-10, 10])
  //       .onUpdate((event) => {
  //         'worklet';
  //         const MAX_SEEK_SECONDS = 15;
  //         const direction = Math.sign(event.translationX);
  //         const absTranslation = Math.abs(event.translationX);
  //         // Non-linear scaling for smoother control
  //         const scale = Math.min(absTranslation / dimensions.width, 1);
  //         const seekDelta = direction * scale * MAX_SEEK_SECONDS;
  //         const newTime = Math.max(0, Math.min(seekableDuration, currentTime + seekDelta));
  //         scheduleOnRN (handleSeek)(newTime);
  //       }),
  //   [dimensions.width, seekableDuration, currentTime, handleSeek],
  // );

  const toggleControls = useCallback(() => {
    setShowControls((isShowControls) => !isShowControls);
  }, []);

  const singleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .numberOfTaps(1)
        .onEnd(() => {
          'worklet';
          scheduleOnRN(toggleControls);
        }),
    [toggleControls],
  );
  const videoStyle = useMemo<StyleProp<ViewStyle>>(
    () => ({
      width: isFullscreen ? dimensions.width : '100%',
      height: isFullscreen ? dimensions.height : undefined,
      aspectRatio: isFullscreen ? undefined : 16 / 9,
      backgroundColor: 'black',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
    }),
    [isFullscreen, dimensions],
  );

  const source = useMemo(() => {
    // Build video quality tracks from data.sources
    if (data?.sources && data.sources.length > 0) {
      const tracks: VideoTrack[] = [];
      data.sources.forEach((track, index) => {
        if (track?.url) {
          // Extract height from quality string (e.g., "1080p" -> 1080)
          // For "auto" or "default", use a very high value (9999) to sort it to the top
          const qualityStr = track.quality?.toLowerCase() || '';
          const match = qualityStr.match(/(\d{3,4})p/);
          const height = match ? Number(match[1]) : qualityStr === 'auto' || qualityStr === 'default' ? 9999 : 0;

          tracks.push({
            width: undefined,
            height,
            index,
          });
        }
      });
      setVideoTracks(tracks.sort((a, b) => (b.height || 0) - (a.height || 0)));
    }

    // Return the selected quality URL or default to 'auto' or first available
    return (
      data?.sources?.[selectedVideoTrackIndex ?? 0]?.url ||
      data?.sources?.find((s) => s.quality === 'auto' || s.quality === 'default')?.url ||
      data?.sources?.[0]?.url ||
      ''
    );
  }, [data, selectedVideoTrackIndex]);

  const gestures = Gesture.Exclusive(doubleTapGesture, brightnessVolumeGesture, singleTapGesture);

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
    //   subtitleTracks?.map((track, index) => ({
    //     title:
    //       ('title' in track ? track.title : undefined) || ('lang' in track ? track.lang : track.language) || 'Untitled',
    //     language: (('lang' in track ? track.lang : track.language)?.toLowerCase() as ISO639_1) || 'en',
    //     type: 'type' in track && track.type !== 'application/x-media-cues' ? track.type : TextTrackType.VTT,
    //     uri: ('url' in track ? track.url : track.uri) || '',
    //     index,
    //   })),
    // );
  }, [data?.subtitles, externalSubtitles]);

  useEffect(() => {
    // Set initial embed state based on provider capabilities
    const currentProvider = PROVIDERS[mediaType].find((p) => p.value === getProvider(mediaType));
    if (currentProvider) {
      // If provider only supports one type, set accordingly
      if (currentProvider.embed && !currentProvider.nonEmbed) {
        setIsEmbed(true);
      } else if (!currentProvider.embed && currentProvider.nonEmbed) {
        setIsEmbed(false);
      }
    }
  }, [getProvider(mediaType)]);

  useEffect(() => {
    if (!isLoading && !source && isVideoReady) {
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
  }, [source, isLoading, error, isVideoReady, isExternalSubtitlesError]);

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="large" color="$color" />
      </ThemedView>
    );
  }

  return (
    <ThemedView
      useSafeArea
      useStatusBar={!isFullscreen}
      style={{ flex: 1, backgroundColor: pureBlackBackground ? '#000' : currentTheme?.background }}>
      <View height="100%" top={top}>
        <GestureDetector gesture={gestures}>
          <View
            // This View is the main container for the video player and overlays
            // It should define the aspect ratio or take full screen dimensions
            overflow="hidden" // Important to contain the video and overlays
            // Undefined to respect aspectRatio
            aspectRatio={16 / 9}
            // style={{ backgroundColor: 'black' }} // Already on parent
          >
            <View
              style={{ height: playerDimensions.height, position: 'relative' }}
              // style={{height:"100%", position: 'relative' }} //keep for future ref
              onLayout={(e) => {
                setWrapperDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
              }}>
              <Video
                ref={videoRef}
                source={{
                  uri: source,
                  textTracks: subtitleTracks?.map((track, index) => ({
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
                }}
                style={videoStyle}
                resizeMode={'contain'}
                poster={{ source: { uri: poster }, resizeMode: 'contain' }}
                onProgress={handleProgress}
                paused={!isPlaying}
                volume={isMuted ? 0 : volume}
                // onPlaybackStateChanged={handlePlaybackStateChange}
                onLayout={(e) => {
                  setPlayerDimensions({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
                }}
                onBuffer={({ isBuffering }) => setIsBuffering(isBuffering)}
                reportBandwidth={true}
                automaticallyWaitsToMinimizeStalling={true}
                preventsDisplaySleepDuringVideoPlayback={true}
                allowsExternalPlayback={true}
                mixWithOthers={'mix'}
                onError={(error) => {
                  toast.error('Video Error', { description: 'Try changing servers' });
                  //console.log('Video Error:', error);
                }}
                onLoad={(value) => {
                  // console.log(getProgress(uniqueId)?.currentTime, 'Video loaded:', value);
                  setIsVideoReady(true);
                  // to find how much of the textTracks have null language and title
                  const nullTextTrackCount =
                    value.textTracks?.filter((track) => !track.language && !track.title).length || 0;
                  const nullAudioTrackCount =
                    value.audioTracks?.filter((track) => !track.language && !track.title).length || 0;
                  const uniqueAudioTrack = value.audioTracks.slice(nullAudioTrackCount)?.reduce((acc, track) => {
                    const exists = acc.some(
                      (existingTrack) =>
                        existingTrack.language === track.language && existingTrack.title === track.title,
                    );
                    if (!exists) {
                      acc.push(track);
                    }
                    return acc;
                  }, [] as AudioTrack[]);
                  setNullSubtitleIndex(nullTextTrackCount);
                  // console.log('nullTextTrackCount:', nullTextTrackCount);
                  setNullAudioTrackIndex(nullAudioTrackCount);
                  // console.log('nullAudioTrackCount:', nullAudioTrackCount, uniqueAudioTrack);
                  setAudioTracks(uniqueAudioTrack);
                  videoRef?.current?.seek(getProgress(uniqueId)?.currentTime || 0);
                  // videoRef?.current?.resume();
                  setIsPlaying(true);
                }}
                selectedVideoTrack={{ type: SelectedVideoTrackType.INDEX, value: selectedVideoTrackIndex ?? 0 }}
                selectedTextTrack={{
                  type: SelectedTrackType.INDEX,
                  value: (selectedSubtitleIndex ?? 0) + nullSubtitleIndex!,
                }}
                selectedAudioTrack={
                  audioTracks && audioTracks.length > 0
                    ? {
                        type: SelectedTrackType.INDEX,
                        value: (selectedAudioTrackIndex ?? 0) + nullAudioTrackIndex!,
                      }
                    : undefined
                }
                // onVideoTracks={(tracks) => {
                //   console.log('Video Tracks:', tracks);
                // }}
                // onTextTracks={(tracks) => {
                //   console.log('Text Tracks:', tracks);
                // }}
                subtitleStyle={{ paddingBottom: 50, fontSize: 20, opacity: 0.8 }}
              />

              <ControlsOverlay
                showControls={showControls}
                isPlaying={isPlaying}
                isMuted={isMuted}
                isFullscreen={isFullscreen}
                currentTime={currentTime}
                seekableDuration={seekableDuration}
                isBuffering={isBuffering}
                subtitleTracks={subtitleTracks}
                selectedSubtitleIndex={selectedSubtitleIndex}
                setSelectedSubtitleIndex={setSelectedSubtitleIndex}
                isExternalSubtitlesLoading={isExternalSubtitlesLoading}
                setShouldFetchExternalSubs={setShouldFetchExternalSubs}
                externalSubtitleLanguage={externalSubtitleLanguage}
                setExternalSubtitleLanguage={setExternalSubtitleLanguage}
                videoTracks={videoTracks}
                selectedVideoTrackIndex={selectedVideoTrackIndex}
                setSelectedVideoTrackIndex={setSelectedVideoTrackIndex}
                audioTracks={audioTracks}
                selectedAudioTrackIndex={selectedAudioTrackIndex}
                setSelectedAudioTrackIndex={setSelectedAudioTrackIndex}
                onPlayPress={handlePlayPress}
                onMutePress={handleMutePress}
                onFullscreenPress={isFullscreen ? exitFullscreen : enterFullscreen}
                onSeek={handleSeek}
                brightness={brightness}
                volume={volume}
                setBrightness={updateBrightness}
                setVolume={updateVolume}
              />
              <OverlayedView ref={backwardRippleRef} style={{ left: 0 }}>
                <Animated.View style={[backwardAnimatedRipple]}>
                  <SeekText>-{doubleTapValue.backward}s</SeekText>
                </Animated.View>
              </OverlayedView>
              <OverlayedView ref={forwardRippleRef} style={{ right: 0 }}>
                <Animated.View style={[forwardAnimatedRipple]}>
                  <SeekText>+{doubleTapValue.forward}s</SeekText>
                </Animated.View>
              </OverlayedView>
            </View>
          </View>
        </GestureDetector>
        {!isFullscreen && (
          <YStack flex={1} gap="$2">
            {/* {description && (
            <>
              <Text textAlign="justify" padding="$2">
                {description}
              </Text>
            </>
          )} */}
            {mediaType === MediaType.ANIME && (
              <YStack paddingTop="$2" paddingHorizontal="$2" borderRadius="$4">
                {[{ label: 'Sub', key: 'sub' }, isDubbed === 'true' && { label: 'Dub', key: 'dub' }]
                  // @ts-ignore
                  .map(({ label, key }, index) => (
                    <XStack
                      key={`${key}-${index}`}
                      alignItems="center"
                      justifyContent="space-between"
                      marginBottom="$2">
                      {key && (
                        <Text color="$color1" fontWeight="bold" width={50}>
                          {label}:
                        </Text>
                      )}
                      <XStack flexWrap="wrap" flex={1} gap={4}>
                        {PROVIDERS[mediaType].map(({ name, value, subbed, dubbed }) => {
                          const isAvailable = key === 'sub' ? subbed : key === 'dub' ? dubbed : false;
                          const isSelected = getProvider(mediaType) === value && dub === (key === 'dub');
                          if (!isAvailable) return null;
                          return (
                            <Button
                              key={value}
                              onPress={() => {
                                setDub(key === 'dub');
                                setProvider(mediaType, value);
                              }}
                              backgroundColor={isSelected ? '$color' : '$color3'}
                              flex={1}
                              minWidth={150}
                              justifyContent="center">
                              <XStack alignItems="center">
                                {isSelected && <Check color="$color4" />}
                                <Text fontWeight={900} color={isSelected ? '$color4' : '$color'}>
                                  {name}
                                </Text>
                              </XStack>
                            </Button>
                          );
                        })}
                      </XStack>
                    </XStack>
                  ))}
              </YStack>
            )}

            {mediaType === MediaType.MOVIE && (
              <YStack paddingTop="$2" paddingHorizontal="$2" borderRadius="$4">
                {[
                  { label: 'Embed', key: 'embed' },
                  { label: 'Direct', key: 'nonEmbed' },
                ].map(({ label, key }) => (
                  <XStack key={key} alignItems="center" justifyContent="space-between" marginBottom="$2">
                    {key && (
                      <Text color="$color1" fontWeight="bold" width={70}>
                        {label}:
                      </Text>
                    )}
                    <XStack flexWrap="wrap" flex={1} gap={4}>
                      {PROVIDERS[mediaType].map(({ name, value, embed, nonEmbed }) => {
                        const isAvailable = key === 'embed' ? embed : key === 'nonEmbed' ? nonEmbed : false;
                        const isSelected =
                          getProvider(mediaType) === value &&
                          ((key === 'embed' && isEmbed) || (key === 'nonEmbed' && !isEmbed));
                        // console.log('isEmbed:', isEmbed, isSelected);

                        if (!isAvailable) return null;

                        return (
                          <Button
                            key={`${value}-${key}`}
                            onPress={() => {
                              setProvider(mediaType, value);
                              setIsEmbed(key === 'embed');
                            }}
                            backgroundColor={isSelected ? '$color' : '$color3'}
                            flex={1}
                            minWidth={150}
                            justifyContent="center">
                            <XStack alignItems="center">
                              {isSelected && <Check color="$color4" />}
                              <Text fontWeight={900} color={isSelected ? '$color4' : '$color'}>
                                {name}
                              </Text>
                            </XStack>
                          </Button>
                        );
                      })}
                    </XStack>
                  </XStack>
                ))}
              </YStack>
            )}
            <View flex={1}>
              <EpisodeList mediaType={mediaType} provider={provider} id={id} type={type} swipeable={false} />
            </View>
          </YStack>
        )}
      </View>
    </ThemedView>
  );
};

export default Watch;
