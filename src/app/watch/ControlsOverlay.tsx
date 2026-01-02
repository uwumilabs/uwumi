import React, { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Text, useWindowDimensions, View, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut, Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ISubtitle, TvType } from 'react-native-consumet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCurrentTheme, useEpisodesIdStore, useEpisodesStore, useSheetColor, useMediaInfoStore } from '@/hooks';
import { formatTime } from '@/constants/utils';
import { VideoTrack, AudioTrack, WatchSearchParams, SubtitleTrack } from '@/constants/types';
import type { FlashListProps } from '@shopify/flash-list';
import {
  CustomFlashlist,
  CustomSheet,
  HorizontalTabs,
  HUYStack,
  HUXStack,
  RippleButton,
  type TabItem,
  MaterialIconsIcon,
} from '@/components';
import SkiaSlider from './SkiaSlider';
import { Button, cn } from 'heroui-native';
import { ExternalSubDialog } from './components';

type SheetSettingsListProps<T> = Pick<
  FlashListProps<T>,
  'data' | 'keyExtractor' | 'renderItem' | 'ListHeaderComponent'
>;

function SheetSettingsList<T>({ data, keyExtractor, renderItem, ListHeaderComponent }: SheetSettingsListProps<T>) {
  return (
    <HUYStack className="w-full self-start px-4 py-3">
      <CustomFlashlist
        data={data}
        keyExtractor={keyExtractor}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        ListHeaderComponent={ListHeaderComponent}
        renderItem={renderItem}
      />
    </HUYStack>
  );
}

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

const AnimatedHUYStack = Animated.createAnimatedComponent(HUYStack);
const AnimatedHUXStack = Animated.createAnimatedComponent(HUXStack);

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
    const inactivityTimerRef = useRef<number | null>(null);
    const lastActivityTimeRef = useRef(Date.now());
    const controlsTimeoutDuration = 5000;
    const sheetColor = useSheetColor();
    const { mediaInfo } = useMediaInfoStore();

    const currentTheme = useCurrentTheme();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const settingsSheetWidth = isFullscreen ? screenWidth * 0.5 : screenWidth * 0.9;
    const settingsSheetMargin = Math.max(0, (screenWidth - settingsSheetWidth) / 2);

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

    const controlsVisible = openSettings || (showControls && isUserActive);

    const router = useRouter();
    const { mediaType, provider, id, mediaId, type, title, episodeNumber, seasonNumber } =
      useLocalSearchParams() as unknown as WatchSearchParams;
    const parsedMappings = mediaInfo?.mappings ? mediaInfo?.mappings : null;
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
    const tabItems = useMemo(
      () =>
        [
          {
            key: 'tab1',
            label: 'Quality',
            content: (
              <SheetSettingsList<VideoTrack>
                data={videoTracks ?? []}
                keyExtractor={(item, index) => String(item?.index ?? index)}
                renderItem={({ item }) => (
                  <RippleButton
                    style={{
                      backgroundColor: sheetColor,
                    }}
                    onPress={() => {
                      setSelectedVideoTrackIndex(item.index);
                      setOpenSettings(false);
                    }}>
                    <Text
                      style={{
                        color: selectedVideoTrackIndex === item.index ? currentTheme.accent : currentTheme.foreground,
                      }}>
                      {item.height === 9999 ? 'Auto' : `${item.height}p`}
                    </Text>
                  </RippleButton>
                )}
              />
            ),
          },
          {
            key: 'tab2',
            label: 'Subtitle',
            content: (
              <SheetSettingsList<SubtitleTrack | ISubtitle>
                data={subtitleTracks ?? []}
                keyExtractor={(item, index) =>
                  String(('lang' in (item as any) ? (item as any).lang : (item as any).language) ?? index)
                }
                ListHeaderComponent={
                  parsedMappings ? (
                    <HUYStack className="pb-2">
                      <ExternalSubDialog
                        externalSubtitleLanguage={externalSubtitleLanguage}
                        setExternalSubtitleLanguage={setExternalSubtitleLanguage}
                        isExternalSubtitlesLoading={isExternalSubtitlesLoading}
                        setShouldFetchExternalSubs={setShouldFetchExternalSubs}
                        isFullscreen={isFullscreen}
                        onOpenDialog={() => setOpenSettings(false)}
                      />
                    </HUYStack>
                  ) : null
                }
                renderItem={({ item, index }) => (
                  <RippleButton
                    style={{
                      backgroundColor: sheetColor,
                    }}
                    onPress={() => {
                      setSelectedSubtitleIndex(index);
                      setOpenSettings(false);
                    }}>
                    <Text
                      style={{
                        color: selectedSubtitleIndex === index ? currentTheme.accent : currentTheme.foreground,
                      }}>
                      {'lang' in item ? item.lang : item.language}-{'title' in item ? item.title : undefined}
                    </Text>
                  </RippleButton>
                )}
              />
            ),
          },
          // Only include audio tab if audioTracks exist and have items
          ...(audioTracks && audioTracks.length > 0
            ? [
                {
                  key: 'tab3',
                  label: 'Audio',
                  content: (
                    <SheetSettingsList<AudioTrack>
                      data={audioTracks}
                      keyExtractor={(item, index) => `${item.language}-${item.title}-${index}`}
                      renderItem={({ item, index }) => (
                        <RippleButton
                          style={{
                            backgroundColor: sheetColor,
                          }}
                          onPress={() => {
                            setSelectedAudioTrackIndex(index);
                            setOpenSettings(false);
                          }}>
                          <Text
                            style={{
                              color: selectedAudioTrackIndex === index ? currentTheme.accent : currentTheme.foreground,
                            }}>
                            {item.language}-{item.title}
                          </Text>
                        </RippleButton>
                      )}
                    />
                  ),
                },
              ]
            : []),
        ].filter(Boolean) as TabItem[],
      [
        videoTracks,
        sheetColor,
        setSelectedVideoTrackIndex,
        selectedVideoTrackIndex,
        currentTheme,
        subtitleTracks,
        parsedMappings,
        externalSubtitleLanguage,
        setExternalSubtitleLanguage,
        isExternalSubtitlesLoading,
        setShouldFetchExternalSubs,
        isFullscreen,
        setSelectedSubtitleIndex,
        selectedSubtitleIndex,
        audioTracks,
        setSelectedAudioTrackIndex,
        selectedAudioTrackIndex,
      ],
    );
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
        <AnimatedHUYStack
          className="flex-1 h-full w-full justify-between"
          style={{ backgroundColor: controlsVisible ? 'rgba(0, 0, 0, 0.5)' : 'transparent' }}
          entering={FadeIn.duration(100).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}
          exiting={FadeOut.duration(100).easing(Easing.bezierFn(0.25, 0.1, 0.25, 1))}>
          {/* Top Controls - Always mounted, visibility controlled by animation */}
          <AnimatedHUXStack
            style={[topControlsAnimatedStyle, { pointerEvents: controlsVisible ? 'auto' : 'none' }]}
            className={cn('w-full justify-between items-center px-2', isFullscreen && 'py-5 px-4')}>
            <HUYStack className="w-3/5">
              <Text className="text-white font-bold text-base" numberOfLines={1}>
                {title}
              </Text>
              {type !== TvType.MOVIE && (
                <Text className="text-white font-medium italic text-sm">
                  {seasonNumber ? `Season ${seasonNumber}` : null} Episode {episodeNumber}
                </Text>
              )}
            </HUYStack>
            <HUXStack className="gap-4">
              {(selectedSubtitleIndex ?? -1) > -1 ? (
                <RippleButton onPress={() => setSelectedSubtitleIndex(-1)}>
                  <MaterialIconsIcon name="closed-caption-off" color="white" size={20} />
                </RippleButton>
              ) : (
                <RippleButton onPress={() => setSelectedSubtitleIndex(0)}>
                  <MaterialIconsIcon name="closed-caption-disabled" color="white" size={20} />
                </RippleButton>
              )}

              <RippleButton
                onPress={() => {
                  setOpenSettings(!openSettings);
                }}>
                <MaterialIconsIcon name="video-settings" color="white" size={20} />
              </RippleButton>
              <CustomSheet
                open={openSettings}
                onOpenChange={setOpenSettings}
                snapPoints={isFullscreen ? ['80%'] : ['50%']}
                scrollable={false}
                modalProps={{
                  containerStyle: { alignItems: 'center' },
                  style: {
                    width: settingsSheetWidth,
                    marginHorizontal: settingsSheetMargin,
                  },
                }}>
                <HorizontalTabs items={tabItems as TabItem[]} initialTab="tab1" />
              </CustomSheet>
            </HUXStack>
          </AnimatedHUXStack>

          {/* Center play/pause button - Always mounted, visibility controlled by animation */}
          <AnimatedHUXStack
            style={[
              centerControlsAnimatedStyle,
              {
                pointerEvents: controlsVisible || isBuffering ? 'auto' : 'none',
              },
            ]}
            className="absolute gap-10 inset-0 items-center justify-center">
            {isFullscreen && (
              <HUYStack className="items-center gap-2">
                <MaterialIconsIcon name="sunny" color="white" size={20} />
                <SkiaSlider
                  orientation="vertical"
                  height={Math.max(50, screenHeight * 0.3)}
                  thumbColor={currentTheme?.accent}
                  thumbSize={0}
                  style={{ transform: [{ rotate: '180deg' }, { scaleX: 2.5 }] }}
                  activeTrackColor={currentTheme?.accent}
                  initialValue={brightness}
                  minValue={0}
                  maxValue={1}
                  onValueChange={(value) => {
                    setBrightness(value);
                  }}
                />
                <Text className="text-white font-bold text-sm">{`${Math.round(brightness * 100)}%`}</Text>
              </HUYStack>
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
              <MaterialIconsIcon name="skip-previous" color={prevEpisodeIndex >= 0 ? 'white' : 'gray'} size={30} />
            </RippleButton>
            {isBuffering ? (
              <ActivityIndicator className="p-2.5" size="large" color="white" />
            ) : (
              <RippleButton
                onPress={() => {
                  onPlayPress();
                }}>
                {isPlaying ? (
                  <MaterialIconsIcon name="pause" color="white" size={40} />
                ) : (
                  <MaterialIconsIcon name="play-arrow" color="white" size={40} />
                )}
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
              <MaterialIconsIcon name="skip-next" color={nextEpisodeIndex >= 0 ? 'white' : 'gray'} size={30} />
            </RippleButton>

            {isFullscreen && (
              <HUYStack className="items-center gap-2">
                <MaterialIconsIcon name="volume-up" color="white" size={20} />
                <SkiaSlider
                  orientation="vertical"
                  height={Math.max(50, screenHeight * 0.3)}
                  thumbColor={currentTheme?.accent}
                  thumbSize={0}
                  style={{ transform: [{ rotate: '180deg' }, { scaleX: 2.5 }] }}
                  activeTrackColor={currentTheme?.accent}
                  initialValue={volume}
                  minValue={0}
                  maxValue={1}
                  onValueChange={(value) => {
                    setVolume(value);
                  }}
                />
                <Text className="text-white font-bold text-sm">{`${Math.round(volume * 100)}%`}</Text>
              </HUYStack>
            )}
          </AnimatedHUXStack>

          {/* Bottom Controls - Always mounted, visibility controlled by animation */}
          <AnimatedHUYStack
            style={[bottomControlsAnimatedStyle, { pointerEvents: controlsVisible ? 'auto' : 'none' }]}
            className={cn('px-2', isFullscreen && 'py-5 px-4')}>
            <HUXStack className="justify-center items-center" style={{ width: screenWidth }}>
              <RippleButton onPress={onMutePress}>
                {isMuted ? (
                  <MaterialIconsIcon name="volume-off" color="white" size={20} />
                ) : (
                  <MaterialIconsIcon name="volume-up" color="white" size={20} />
                )}
              </RippleButton>
              <HUXStack className="gap-2 ml-auto items-center">
                <Button onPress={() => onSeek(Math.round(currentTime) + 85)}>+85 s</Button>
                <RippleButton onPress={onFullscreenPress}>
                  {isFullscreen ? (
                    <MaterialIconsIcon name="fullscreen-exit" color="white" size={20} />
                  ) : (
                    <MaterialIconsIcon name="fullscreen" color="white" size={20} />
                  )}
                </RippleButton>
              </HUXStack>
            </HUXStack>
            <HUXStack className="justify-center items-center gap-2" style={{ width: screenWidth }}>
              <Text className="text-white text-sm font-bold">{formatTime(currentTime)}</Text>
              <View className="items-center justify-center">
                <SkiaSlider
                  width={screenWidth - screenWidth * 0.25}
                  thumbColor={currentTheme?.accent}
                  thumbSize={15}
                  activeTrackColor={currentTheme?.accent}
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
              <Text className="text-white text-sm font-bold">{formatTime(seekableDuration)}</Text>
            </HUXStack>
          </AnimatedHUYStack>
        </AnimatedHUYStack>
      </>
    );
  },
);
ControlsOverlay.displayName = 'ControlsOverlay';
export default ControlsOverlay;
