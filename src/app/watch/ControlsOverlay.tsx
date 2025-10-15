import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { YStack, XStack, Button, Text, View, Sheet, Spinner } from 'tamagui';
import { GestureResponderEvent, useWindowDimensions } from 'react-native';
import {
  Play,
  Pause,
  Volume2,
  VolumeOff,
  Maximize,
  Minimize,
  Settings,
  Captions,
  CaptionsOff,
  SkipForward,
  SkipBack,
  Sun,
  ListFilterPlus,
} from '@tamagui/lucide-icons';
import Animated, { FadeIn, FadeOut, Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ISubtitle, TvType } from 'react-native-consumet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCurrentTheme, useEpisodesIdStore, useEpisodesStore, useThemeStore } from '@/hooks';
import { formatTime } from '@/constants/utils';
import { VideoTrack, AudioTrack, WatchSearchParams, SubtitleTrack } from '@/constants/types';
import { RippleButton, HorizontalTabs, TabItem } from '@/components';
import SkiaSlider from './SkiaSlider';
import ExternalSubDialog from './components/ExternalSubDialog';
import { SHEET_COLOR } from '@/constants/config';

interface ControlsOverlayProps {
  showControls: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  isBuffering: boolean;
  subtitleTracks: (SubtitleTrack | ISubtitle)[] | undefined;
  selectedSubtitleIndex: number | undefined;
  externalSubtitleLanguage: string | null;
  setSelectedSubtitleIndex: (index: number | undefined) => void;
  isExternalSubtitlesLoading: boolean;
  setShouldFetchExternalSubs: (value: boolean) => void;
  setExternalSubtitleLanguage: (value: string | null) => void;
  videoTracks: VideoTrack[] | undefined;
  selectedVideoTrackIndex: number | undefined;
  setSelectedVideoTrackIndex: (height: number | undefined) => void;
  audioTracks: AudioTrack[] | undefined;
  selectedAudioTrackIndex: number | undefined;
  setSelectedAudioTrackIndex: (index: number | undefined) => void;
  currentTime: number;
  seekableDuration: number;
  onPlayPress: () => void;
  onMutePress: () => void;
  onFullscreenPress: () => void;
  onSeek: (time: number) => void;
  brightness: number;
  volume: number;
  setBrightness: (value: number) => void;
  setVolume: (value: number) => void;
}

const AnimatedYStack = Animated.createAnimatedComponent(YStack);
const AnimatedXStack = Animated.createAnimatedComponent(XStack);

const ControlsOverlay = memo(
  ({
    showControls,
    isPlaying,
    isMuted,
    isFullscreen,
    isBuffering,
    subtitleTracks,
    selectedSubtitleIndex,
    externalSubtitleLanguage,
    setSelectedSubtitleIndex,
    isExternalSubtitlesLoading,
    setShouldFetchExternalSubs,
    setExternalSubtitleLanguage,
    videoTracks,
    selectedVideoTrackIndex,
    setSelectedVideoTrackIndex,
    audioTracks,
    selectedAudioTrackIndex,
    setSelectedAudioTrackIndex,
    currentTime,
    seekableDuration,
    onPlayPress,
    onMutePress,
    onFullscreenPress,
    onSeek,
    brightness,
    volume,
    setBrightness,
    setVolume,
  }: ControlsOverlayProps) => {
    const [openSettings, setOpenSettings] = useState(false);
    const [isUserActive, setIsUserActive] = useState(true);
    const [openExternalSubtitleLanguageDialog, setOpenExternalSubtitleLanguageDialog] = useState(false);
    const inactivityTimerRef = useRef<number | null>(null);
    const lastActivityTimeRef = useRef(Date.now());
    const controlsTimeoutDuration = 5000;

    const currentTheme = useCurrentTheme();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    // Function to reset inactivity timer with debounce protection
    const resetInactivityTimer = useCallback(() => {
      const now = Date.now();
      if (now - lastActivityTimeRef.current < 150) return;
      lastActivityTimeRef.current = now;

      setIsUserActive(true);

      // Clear any existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }

      // Set a new timer only if controls should auto-hide
      if (isPlaying && !openSettings && !isBuffering) {
        inactivityTimerRef.current = setTimeout(() => {
          setIsUserActive(false);
        }, controlsTimeoutDuration);
      }
    }, [isPlaying, openSettings, isBuffering]);

    // Setup the inactivity timer
    useEffect(() => {
      resetInactivityTimer();

      return () => {
        // Clean up timer when component unmounts
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    }, [resetInactivityTimer, isPlaying, openSettings]);

    useEffect(() => {
      resetInactivityTimer();
    }, [isPlaying, openSettings, resetInactivityTimer]);

    const handleUserActivity = useCallback(
      (e: GestureResponderEvent | React.SyntheticEvent) => {
        // Stop event from bubbling to prevent multiple calls
        e.stopPropagation();
        resetInactivityTimer();
      },
      [resetInactivityTimer],
    );
    const controlsVisible = openSettings || (showControls && isUserActive);

    const router = useRouter();
    const { mediaType, provider, id, mediaId, type, title, episodeNumber, seasonNumber, mappings } =
      useLocalSearchParams() as unknown as WatchSearchParams;
    const parsedMappings = mappings ? JSON.parse(mappings) : null;
    const prevUniqueId = useEpisodesIdStore((state) => state.prevUniqueId);
    const currentUniqueId = useEpisodesIdStore((state) => state.currentUniqueId);
    const nextUniqueId = useEpisodesIdStore((state) => state.nextUniqueId);
    const setEpisodeIds = useEpisodesIdStore((state) => state.setEpisodeIds);
    const episodes = useEpisodesStore((state) => state.episodes);
    const currentEpisodeIndex = episodes.findIndex((ep) => ep.uniqueId === currentUniqueId);
    const prevEpisodeIndex = episodes.findIndex((ep) => ep.uniqueId === prevUniqueId);
    const nextEpisodeIndex = episodes.findIndex((ep) => ep.uniqueId === nextUniqueId);
    const prevId = currentEpisodeIndex > 0 ? String(episodes[currentEpisodeIndex - 1].uniqueId) : null;
    const nextId =
      currentEpisodeIndex < episodes.length - 1 ? String(episodes[currentEpisodeIndex + 1].uniqueId) : null;

    // console.log({
    //   prevUniqueId,
    //   currentUniqueId,
    //   nextUniqueId,
    //   episodes,
    //   currentEpisodeIndex,
    //   prevEpisodeIndex,
    //   nextEpisodeIndex,
    //   prevId,
    //   nextId,
    // });
    // console.log('selectedSubtitleIndex', selectedSubtitleIndex, subtitleTracks![selectedSubtitleIndex!]);
    const tabItems = [
      {
        key: 'tab1',
        label: 'Quality',
        content: (
          <YStack flex={1} width="100%" gap="$2" alignSelf="flex-start" paddingHorizontal="$4">
            {videoTracks?.map((track, index) => (
              <RippleButton
                key={index}
                style={{
                  backgroundColor: SHEET_COLOR,
                }}
                onPress={() => {
                  setSelectedVideoTrackIndex(track.index);
                  setOpenSettings(false);
                }}>
                <Text color={selectedVideoTrackIndex === track.index ? '$color' : '$color1'}>
                  {track.height === 9999 ? 'Auto' : `${track.height}p`}
                </Text>
              </RippleButton>
            ))}
          </YStack>
        ),
      },
      {
        key: 'tab2',
        label: 'Subtitle',
        content: (
          <YStack flex={1} width="100%" gap="$2" alignSelf="flex-start" paddingHorizontal="$4">
            <RippleButton
              onPress={() => {
                setOpenExternalSubtitleLanguageDialog(true);
                setOpenSettings(false);
              }}>
              {parsedMappings && (
                <XStack alignItems="center" justifyContent="center" gap="$3">
                  <ListFilterPlus color="$color1" size={16} />
                  <Text color="$color1" fontSize="$3" fontWeight="600">
                    Add External Subtitle
                  </Text>
                </XStack>
              )}
            </RippleButton>

            {subtitleTracks?.map((track, index) => (
              <RippleButton
                key={index}
                style={{
                  backgroundColor: SHEET_COLOR,
                }}
                onPress={() => {
                  setSelectedSubtitleIndex(index);
                  setOpenSettings(false);
                }}>
                <Text color={selectedSubtitleIndex === index ? '$color' : '$color1'}>
                  {'lang' in track ? track.lang : track.language}-{'title' in track ? track.title : undefined}
                </Text>
              </RippleButton>
            ))}
          </YStack>
        ),
      },
      ,
      // Only include audio tab if audioTracks exist and have items
      ...(audioTracks && audioTracks.length > 0
        ? [
            {
              key: 'tab3',
              label: 'Audio',
              content: (
                <YStack flex={1} width="100%" gap="$2" alignSelf="flex-start" paddingHorizontal="$4">
                  {audioTracks.map((track, index) => (
                    <RippleButton
                      key={index}
                      style={{
                        backgroundColor: SHEET_COLOR,
                      }}
                      onPress={() => {
                        setSelectedAudioTrackIndex(index);
                        setOpenSettings(false);
                      }}>
                      <Text color={selectedAudioTrackIndex === index ? '$color' : '$color1'}>
                        {track.language}-{track.title}
                      </Text>
                    </RippleButton>
                  ))}
                </YStack>
              ),
            },
          ]
        : []),
    ];
    useEffect(() => {
      // Check if currentEpisodeIndex is valid before accessing episodes array
      if ((prevId || nextId) && currentEpisodeIndex >= 0 && episodes[currentEpisodeIndex]) {
        setEpisodeIds(episodes[currentEpisodeIndex].id, currentUniqueId!, prevId, nextId);
      }
    }, [currentUniqueId, prevId, nextId, setEpisodeIds, episodes, currentEpisodeIndex]);

    // --- New Reanimated styles for visibility ---
    const topControlsAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: withTiming(controlsVisible ? 1 : 0, { duration: 100, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) }),
        transform: [
          {
            translateY: withTiming(controlsVisible ? 0 : -50, {
              duration: 100,
              easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
            }),
          },
        ],
      };
    }, [controlsVisible]);

    const bottomControlsAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: withTiming(controlsVisible ? 1 : 0, { duration: 100, easing: Easing.bezierFn(0.25, 0.1, 0.25, 1) }),
        transform: [
          {
            translateY: withTiming(controlsVisible ? 0 : 50, {
              duration: 100,
              easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
            }),
          },
        ],
      };
    }, [controlsVisible]);

    const centerControlsAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: withTiming(controlsVisible || isBuffering ? 1 : 0, {
          duration: 100,
          easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
        }),
        // Keep position absolute and translate for centering
      };
    }, [controlsVisible, isBuffering]);
    // --- End New Reanimated styles ---

    return (
      <>
        {/* Main Overlay Background */}
        <AnimatedYStack
          flex={1}
          justifyContent="space-between"
          backgroundColor={controlsVisible ? 'rgba(0, 0, 0, 0.5)' : 'transparent'}
          entering={FadeIn.duration(100).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
          exiting={FadeOut.duration(100).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
          onTouchStart={handleUserActivity}
          onMouseEnter={handleUserActivity}
          onMouseLeave={handleUserActivity}>
          {/* Top Controls - Always mounted, visibility controlled by animation */}
          <AnimatedXStack
            style={topControlsAnimatedStyle}
            paddingVertical={isFullscreen ? '$5' : '$2'}
            paddingHorizontal={isFullscreen ? '$4' : '$2'}
            width="100%"
            justifyContent="space-between"
            alignItems="center"
            pointerEvents={controlsVisible ? 'auto' : 'none'}>
            <YStack width="60%">
              <Text color="white" numberOfLines={1} fontWeight={700} fontSize="$3.5">
                {title}
              </Text>
              {type !== TvType.MOVIE && (
                <Text color="white" fontStyle="italic" fontWeight={500} fontSize="$2.5">
                  {seasonNumber ? `Season ${seasonNumber}` : null} Episode {episodeNumber}
                </Text>
              )}
            </YStack>
            <XStack gap="$4">
              {(selectedSubtitleIndex ?? -1) > -1 ? (
                <RippleButton onPress={() => setSelectedSubtitleIndex(-1)}>
                  <Captions color="white" size={20} />
                </RippleButton>
              ) : (
                <RippleButton onPress={() => setSelectedSubtitleIndex(0)}>
                  <CaptionsOff color="white" size={20} />
                </RippleButton>
              )}

              <RippleButton
                onPress={() => {
                  setOpenSettings(!openSettings);
                }}>
                <Settings color="white" size={20} />
              </RippleButton>
              <Sheet
                forceRemoveScrollEnabled={false}
                modal
                open={openSettings}
                onOpenChange={(value: boolean) => setOpenSettings(value)}
                snapPoints={isFullscreen ? [80, 25] : [50, 25]}
                snapPointsMode={'percent'}
                dismissOnSnapToBottom
                zIndex={100_000}
                animation="quick">
                <Sheet.Overlay
                  backgroundColor="transparent"
                  animation="lazy"
                  enterStyle={{ opacity: 0 }}
                  exitStyle={{ opacity: 0 }}
                />
                <Sheet.Frame backgroundColor={SHEET_COLOR} marginHorizontal="auto" width={isFullscreen ? '50%' : '90%'}>
                  <Sheet.ScrollView>
                    <HorizontalTabs items={tabItems as TabItem[]} initialTab="tab1" />
                  </Sheet.ScrollView>
                </Sheet.Frame>
              </Sheet>
              <ExternalSubDialog
                openExternalSubtitleLanguageDialog={openExternalSubtitleLanguageDialog}
                setOpenExternalSubtitleLanguageDialog={setOpenExternalSubtitleLanguageDialog}
                externalSubtitleLanguage={externalSubtitleLanguage}
                setExternalSubtitleLanguage={setExternalSubtitleLanguage}
                isExternalSubtitlesLoading={isExternalSubtitlesLoading}
                setShouldFetchExternalSubs={setShouldFetchExternalSubs}
                isFullscreen={isFullscreen}
              />
            </XStack>
          </AnimatedXStack>

          {/* Center play/pause button - Always mounted, visibility controlled by animation */}
          <AnimatedXStack
            style={centerControlsAnimatedStyle}
            alignItems="center"
            gap="$12"
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            pointerEvents={controlsVisible || isBuffering ? 'auto' : 'none'}>
            {isFullscreen && (
              <YStack alignItems="center" gap="$2">
                <Sun color="white" size={20} />
                <SkiaSlider
                  orientation="vertical"
                  height={Math.max(50, screenHeight * 0.3)}
                  thumbColor={currentTheme?.color}
                  thumbSize={0}
                  style={{ transform: [{ rotate: '180deg' }, { scaleX: 2.5 }] }}
                  activeTrackColor={currentTheme?.color}
                  initialValue={brightness}
                  minValue={0}
                  maxValue={1}
                  onValueChange={(value) => {
                    setBrightness(value);
                  }}
                />
                <Text color="white" fontSize="$2.5" fontWeight="bold">
                  {`${Math.round(brightness * 100)}%`}
                </Text>
              </YStack>
            )}
            <RippleButton
              onPress={() => {
                if (prevEpisodeIndex >= 0) {
                  router.replace({
                    pathname: '/watch/[mediaType]',
                    params: {
                      mediaType,
                      provider,
                      id,
                      mediaId,
                      episodeId: episodes[prevEpisodeIndex].id,
                      uniqueId: episodes[prevEpisodeIndex].uniqueId,
                      ...(episodes[prevEpisodeIndex].dubId
                        ? { episodeDubId: episodes[prevEpisodeIndex].dubId as string }
                        : null),
                      ...(episodes[prevEpisodeIndex].isDubbed
                        ? { isDubbed: episodes[prevEpisodeIndex].isDubbed as string }
                        : null),
                      poster:
                        typeof episodes[prevEpisodeIndex].image === 'string'
                          ? episodes[prevEpisodeIndex].image
                          : episodes[prevEpisodeIndex].image?.hd,
                      title: episodes[prevEpisodeIndex].title,
                      description: episodes[prevEpisodeIndex].description,
                      episodeNumber: (episodes[prevEpisodeIndex].number ??
                        episodes[prevEpisodeIndex].episode) as string,
                      seasonNumber: episodes[prevEpisodeIndex].season as string,
                      mappings: JSON.stringify(parsedMappings),
                      type: type,
                    },
                  });
                }
              }}>
              <SkipBack color={prevEpisodeIndex >= 0 ? 'white' : 'gray'} size={30} />
            </RippleButton>
            {isBuffering ? (
              <Spinner scale={2} size="large" color="white" />
            ) : (
              <RippleButton
                onPress={() => {
                  onPlayPress();
                }}>
                {isPlaying ? <Pause color="white" size={40} /> : <Play color="white" size={40} />}
              </RippleButton>
            )}

            <RippleButton
              onPress={() => {
                if (nextEpisodeIndex >= 0) {
                  router.replace({
                    pathname: '/watch/[mediaType]',
                    params: {
                      mediaType,
                      provider,
                      id,
                      mediaId,
                      episodeId: episodes[nextEpisodeIndex].id,
                      uniqueId: episodes[nextEpisodeIndex].uniqueId,
                      ...(episodes[nextEpisodeIndex].dubId
                        ? { episodeDubId: episodes[nextEpisodeIndex].dubId as string }
                        : null),
                      ...(episodes[nextEpisodeIndex].isDubbed
                        ? { isDubbed: episodes[nextEpisodeIndex].isDubbed as string }
                        : null),
                      poster:
                        typeof episodes[nextEpisodeIndex].image === 'string'
                          ? episodes[nextEpisodeIndex].image
                          : episodes[nextEpisodeIndex].image?.hd,
                      title: episodes[nextEpisodeIndex].title,
                      description: episodes[nextEpisodeIndex].description,
                      episodeNumber: (episodes[nextEpisodeIndex].number ??
                        episodes[nextEpisodeIndex].episode) as string,
                      seasonNumber: episodes[nextEpisodeIndex].season as string,
                      mappings: JSON.stringify(parsedMappings),
                      type: type,
                    },
                  });
                }
              }}>
              <SkipForward color={nextEpisodeIndex >= 0 ? 'white' : 'gray'} size={30} />
            </RippleButton>

            {isFullscreen && (
              <YStack alignItems="center" gap="$2">
                <Volume2 color="white" size={20} />
                <SkiaSlider
                  orientation="vertical"
                  height={Math.max(50, screenHeight * 0.3)}
                  thumbColor={currentTheme?.color}
                  thumbSize={0}
                  style={{ transform: [{ rotate: '180deg' }, { scaleX: 2.5 }] }}
                  activeTrackColor={currentTheme?.color}
                  initialValue={volume}
                  minValue={0}
                  maxValue={1}
                  onValueChange={(value) => {
                    setVolume(value);
                  }}
                />
                <Text color="white" fontSize="$2.5" fontWeight="bold">
                  {`${Math.round(volume * 100)}%`}
                </Text>
              </YStack>
            )}
          </AnimatedXStack>

          {/* Bottom Controls - Always mounted, visibility controlled by animation */}
          <AnimatedYStack
            style={[bottomControlsAnimatedStyle, { alignItems: 'center' }]}
            paddingVertical={isFullscreen ? '$5' : '$2'}
            paddingHorizontal={isFullscreen ? '$4' : '$2'}
            pointerEvents={controlsVisible ? 'auto' : 'none'}>
            <XStack gap="$2" alignItems="center" justifyContent="space-between" width="100%">
              <RippleButton onPress={onMutePress}>
                {isMuted ? <VolumeOff color="white" size={20} /> : <Volume2 color="white" size={20} />}
              </RippleButton>
              <XStack gap="$2" marginLeft="auto" alignItems="center">
                <Button
                  onPress={() => onSeek(Math.round(currentTime) + 85)}
                  backgroundColor="$color"
                  color="$color4"
                  borderRadius="$10"
                  height="$3"
                  paddingHorizontal="$3"
                  fontWeight={500}
                  fontSize={13}>
                  +85 s
                </Button>
                <RippleButton onPress={onFullscreenPress}>
                  {isFullscreen ? <Minimize color="white" size={20} /> : <Maximize color="white" size={20} />}
                </RippleButton>
              </XStack>
            </XStack>
            <YStack width={screenWidth} alignItems="center">
              <View alignItems="center" justifyContent="center">
                <SkiaSlider
                  width={screenWidth - 10}
                  thumbColor={currentTheme?.color}
                  thumbSize={15}
                  activeTrackColor={currentTheme?.color}
                  initialValue={Math.round(currentTime)}
                  minValue={0}
                  maxValue={Math.round(seekableDuration)}
                  onValueChange={(value) => {
                    onSeek(value);
                  }}
                  onSlidingComplete={(value) => {
                    onSeek(value);
                  }}
                />
              </View>
              <XStack justifyContent="space-between" width="100%" paddingHorizontal="$2">
                <Text color="white" fontSize={13} fontWeight={700}>
                  {formatTime(currentTime)}
                </Text>
                <Text color="white" fontSize={13} fontWeight={700}>
                  {formatTime(seekableDuration)}
                </Text>
              </XStack>
            </YStack>
          </AnimatedYStack>
        </AnimatedYStack>
      </>
    );
  },
);
ControlsOverlay.displayName = 'ControlsOverlay';
export default ControlsOverlay;
