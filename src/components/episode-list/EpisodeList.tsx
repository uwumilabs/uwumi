/* eslint-disable react/display-name */
/* eslint-disable react-hooks/rules-of-hooks */
import { View, Text, YStack, XStack, Spinner, styled, Progress } from 'tamagui';
import { Pressable, StyleSheet } from 'react-native';
import { FlashListRef } from '@shopify/flash-list';
import React, { useEffect, useRef, useMemo, useState, useCallback, memo } from 'react';
import CustomImage from '@/components/CustomImage';
import { useRouter } from 'expo-router';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Captions, Eye, EyeOff, Mic, TableProperties, Images, ListOrdered } from '@tamagui/lucide-icons';
import {
  useEpisodesIdStore,
  useEpisodesStore,
  useWatchProgressStore,
  useAnimeEpisodes,
  useCurrentTheme,
  usePureBlackBackground,
  useEpisodeDisplayStore,
  useMoviesEpisodes,
  useServerStore,
  useSeasonStore,
} from '@/hooks';
import WavyAnimation from './WavyAnimation';
import EpisodeActionsSheet from './EpisodeActionsSheet';
import { EpisodeDisplayMode, MediaType } from '@/constants/types';
import { IAnimeEpisode, IMovieSeason, IMovieEpisode, MediaFormat, TvType } from 'react-native-consumet';
import { formatTime } from '@/constants/utils';
import CustomSelect from '../CustomSelect';
import { PROVIDERS, useProviderStore } from '@/constants/provider';
import CustomFlashlist from '../CustomFlashlist';

const LoadingState = () => (
  <YStack justifyContent="center" alignItems="center" minHeight={300}>
    <Spinner size="large" color="$color" />
  </YStack>
);

const StyledText = styled(Text, { fontWeight: '500', color: '$color1', fontSize: '$2.5', opacity: 0.7 });

export const EpisodeList = ({
  mediaType,
  provider,
  id,
  type,
  swipeable = false,
}: {
  mediaType: MediaType;
  provider: string;
  id: string;
  type?: MediaFormat | TvType;
  swipeable?: boolean;
}) => {
  const swipeableRefs = useRef<Map<string, React.RefObject<SwipeableMethods | null>>>(new Map());
  const router = useRouter();
  const currentTheme = useCurrentTheme();
  const flashListRef = useRef<FlashListRef<IAnimeEpisode | IMovieEpisode>>(null);
  const { setProvider, getProvider } = useProviderStore();
  useEffect(() => {
    setProvider(mediaType, getProvider(mediaType) ?? provider);
  }, [mediaType, provider, setProvider, getProvider]);
  const { data: episodeData, isLoading } =
    mediaType === MediaType.ANIME
      ? useAnimeEpisodes({ id, provider: getProvider(mediaType) })
      : useMoviesEpisodes({
          id,
          type: type!,
          provider: getProvider(mediaType),
        });
  const { seasonNumber, setSeasonNumber, resetSeasonNumber } = useSeasonStore();
  const movieSeasons = episodeData?.seasons as IMovieSeason[];
  // console.log('movieSeasons', movieSeasons);
  const animeEpisodes = useMemo(() => (Array.isArray(episodeData) ? episodeData : []), [episodeData]);
  const episodes = useMemo(() => {
    if (mediaType === MediaType.MOVIE && movieSeasons?.[seasonNumber]?.episodes) {
      return movieSeasons[seasonNumber].episodes;
    }
    return animeEpisodes || [];
  }, [mediaType, movieSeasons, seasonNumber, animeEpisodes]);
  // console.log('episodes', episodes);

  const { currentUniqueId } = useEpisodesIdStore();
  const { progresses, setProgress } = useWatchProgressStore();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const { displayMode, setDisplayMode } = useEpisodeDisplayStore();
  const { setCurrentServer, getCurrentServer, servers } = useServerStore();

  // console.log('servers', servers[0], getCurrentServer());

  const [listKey, setListKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<IAnimeEpisode | IMovieEpisode | null>(null);

  useEffect(() => {
    setListKey((prev) => prev + 1);
  }, [displayMode]);

  const setEpisodes = useEpisodesStore((state) => state.setEpisodes);
  useEffect(() => {
    if (episodes) {
      setEpisodes(episodes);
      // console.log('episodes', episodes);
    }
  }, [episodes, setEpisodes]);

  useEffect(() => {
    if (swipeable) {
      resetSeasonNumber();
    }
  }, [id, resetSeasonNumber, swipeable]);

  useEffect(() => {
    if (movieSeasons && seasonNumber >= movieSeasons.length) {
      resetSeasonNumber();
    }
  }, [episodeData, movieSeasons, seasonNumber, resetSeasonNumber]);
  // console.log('episodes', episodeData);
  const currentEpisodeIndex = useCallback(() => {
    return episodes.findIndex((episode: IAnimeEpisode | IMovieEpisode) => episode.uniqueId === currentUniqueId);
  }, [episodes, currentUniqueId]);

  const handleProviderChange = useCallback(
    (value: string) => {
      setProvider(mediaType, value);
    },
    [mediaType, setProvider],
  );

  const handleToggleComplete = useCallback(
    (item: IAnimeEpisode | IMovieEpisode) => {
      if (!item?.uniqueId) return;

      const progress = progresses[item.uniqueId];
      const isCompleted = progress?.isCompleted ?? false;

      const newProgress = {
        currentTime: isCompleted ? 0 : (progress?.duration ?? 0),
        duration: progress?.duration ?? 0,
        progress: isCompleted ? 0 : 100,
        isCompleted: !isCompleted,
      };

      setProgress(item.uniqueId, newProgress);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [progresses, setProgress],
  );

  const rightActions = useCallback(
    (item: IAnimeEpisode | IMovieEpisode) => {
      return (_prog: SharedValue<number>, drag: SharedValue<number>) => {
        const THRESHOLD = 100;

        // Check if episode is already completed
        const progress = progresses[item?.uniqueId as string];
        const isCompleted = progress?.isCompleted ?? false;

        const animatedStyle = useAnimatedStyle(() => {
          const progress = Math.min(Math.abs(drag.value) / THRESHOLD, 1);
          return {
            transform: [{ scale: withSpring(0.9 + progress * 0.1, { mass: 0.5, damping: 20, stiffness: 200 }) }],
            opacity: withSpring(progress > 0 ? 1 : 0.7),
          };
        });

        const firstIconStyle = useAnimatedStyle(() => {
          const progress = Math.min(Math.abs(drag.value) / THRESHOLD, 1);
          // If completed: show EyeOff first (fade out), else show Eye first (fade out)
          const opacity = interpolate(progress, [0, 0.5], [1, 0], Extrapolation.CLAMP);
          return { opacity };
        });

        const secondIconStyle = useAnimatedStyle(() => {
          const progress = Math.min(Math.abs(drag.value) / THRESHOLD, 1);
          // If completed: show Eye after (fade in), else show EyeOff after (fade in)
          const opacity = interpolate(progress, [0.5, 1], [0, 1], Extrapolation.CLAMP);
          return { opacity };
        });

        return (
          <Animated.View
            style={[
              animatedStyle,
              { width: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: currentTheme?.color4 },
            ]}>
            {/* Show current state icon (fades out) */}
            <Animated.View
              style={[
                { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
                firstIconStyle,
              ]}>
              {isCompleted ? <EyeOff color="white" size={24} /> : <Eye color="white" size={24} />}
            </Animated.View>

            {/* Show new state icon (fades in) */}
            <Animated.View
              style={[
                { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
                secondIconStyle,
              ]}>
              {isCompleted ? <Eye color="white" size={24} /> : <EyeOff color="white" size={24} />}
            </Animated.View>
          </Animated.View>
        );
      };
    },
    [progresses, currentTheme],
  );

  const renderEpisodeProgress = useMemo(
    () => (item: IAnimeEpisode | IMovieEpisode) => {
      if (currentUniqueId === item?.uniqueId) {
        return <WavyAnimation />;
      }

      const progress = progresses[item?.uniqueId as string];

      // Check if episode is completed (either manually marked or watched to 90%+)
      if (progress?.isCompleted) {
        return <EyeOff opacity={0.7} color="white" size={15} />;
      }

      // Show progress if watching but not completed
      if (progress?.currentTime && progress?.progress > 0) {
        return (
          <StyledText>
            Progress: {formatTime(progress.currentTime)}/{formatTime(progress.duration)}
          </StyledText>
        );
      }

      // Not started
      return <Eye opacity={0.7} color="white" size={15} />;
    },
    [currentUniqueId, progresses],
  );

  const ListPressable = memo(
    ({ item, children }: { item: IAnimeEpisode | IMovieEpisode; children: React.ReactNode }) => {
      const navigateToEpisode = () => {
        const routerParams = {
          pathname: '/watch/[mediaType]' as const,
          params: {
            mediaType,
            provider: getProvider(mediaType),
            id,
            mediaId: episodeData?.id,
            episodeId: item?.id,
            ...(item?.dubId ? { episodeDubId: item.dubId as string } : null),
            ...(item?.isDubbed ? { isDubbed: item.isDubbed as string } : null),
            uniqueId: item?.uniqueId as string,
            poster: typeof item?.image === 'string' ? item.image : (item?.image?.hd ?? ''),
            title: item?.title,
            description: item?.description,
            episodeNumber: (item?.number ?? item?.episode) as string,
            seasonNumber: item?.season as string,
            mappings: JSON.stringify(episodeData?.mappings),
            type,
          },
        };
        if (swipeable) {
          router.push(routerParams);
        } else {
          router.replace(routerParams);
        }
      };

      const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedEpisode(item);
        setSheetOpen(true);
      };

      return (
        <Pressable onPress={navigateToEpisode} onLongPress={handleLongPress}>
          <YStack
            gap={'$4'}
            padding={4}
            marginVertical={1}
            borderWidth={2}
            borderRadius={10}
            borderColor={currentUniqueId === item?.uniqueId ? '$color4' : 'transparent'}
            backgroundColor={pureBlackBackground ? '#000' : '$background'}>
            <XStack gap={'$4'}>{children}</XStack>
          </YStack>
        </Pressable>
      );
    },
  );

  const ProgressAndAirDate = useCallback(
    ({ item }: { item: IAnimeEpisode | IMovieEpisode }) => {
      return (
        <XStack justifyContent="space-between" alignItems="center">
          <View>{renderEpisodeProgress(item)}</View>
          <StyledText>{new Date(item?.releaseDate ?? '').toDateString()}</StyledText>
        </XStack>
      );
    },
    [renderEpisodeProgress],
  );

  const renderFullMetadataPressableItem = useCallback(
    ({ item }: { item: IAnimeEpisode | IMovieEpisode }) => {
      return (
        <>
          <View position="relative" overflow="hidden" borderRadius={4}>
            {/* 10 - 4 (of gap) = 6 */}
            <CustomImage
              source={typeof item?.image === 'string' ? item.image : (item?.image?.hd ?? '')}
              style={{ width: 160, height: 107 }}
            />
            <View
              position="absolute"
              bottom="$2.5"
              left="$2.5"
              backgroundColor="$background"
              opacity={0.8}
              borderRadius="$4"
              paddingHorizontal="$2"
              paddingVertical="$1">
              <Text fontSize="$3" fontWeight="700" color="$color">
                EP {item.number ?? item.episode}
              </Text>
            </View>
            {progresses[item?.uniqueId as string] && swipeable && (
              <View position="absolute" bottom="$0" left="50%" transform={[{ translateX: '-50%' }]}>
                <Progress
                  size={'$2'}
                  scaleX={1.15}
                  borderRadius={0}
                  backgroundColor="$color1"
                  value={Math.round(progresses[item?.uniqueId as string]?.progress) || 0}
                  max={100}>
                  <Progress.Indicator animation="bouncy" backgroundColor="$color4" />
                </Progress>
              </View>
            )}
          </View>
          <YStack padding={2} flex={1} justifyContent="space-between">
            <YStack>
              <XStack alignItems="center" justifyContent="space-between" gap={2}>
                <Text fontSize="$3" fontWeight="700" numberOfLines={1} flex={1}>
                  {item.title}
                </Text>
                <XStack gap={2}>
                  <Captions size={20} color="$color1" opacity={0.7} />
                  {item?.isDubbed && <Mic size={20} color="$color1" opacity={0.7} />}
                </XStack>
              </XStack>
              <StyledText numberOfLines={4}>{item?.description}</StyledText>
            </YStack>
            {ProgressAndAirDate({ item })}
          </YStack>
        </>
      );
    },
    [ProgressAndAirDate, progresses, swipeable],
  );

  const renderTitleOnlyPressableItem = useCallback(
    ({ item }: { item: IAnimeEpisode | IMovieEpisode }) => {
      return (
        <>
          <YStack padding={2} flex={1} justifyContent="space-between">
            <YStack>
              <XStack alignItems="center" justifyContent="space-between" gap={2}>
                <Text fontSize="$3" fontWeight="700" numberOfLines={1} flex={1}>
                  {item.title}
                </Text>
                <XStack gap={2}>
                  <Captions size={20} color="$color1" opacity={0.7} />
                  {item?.isDubbed && <Mic size={20} color="$color1" opacity={0.7} />}
                </XStack>
              </XStack>
            </YStack>
            {ProgressAndAirDate({ item })}
          </YStack>
        </>
      );
    },
    [ProgressAndAirDate],
  );

  const renderNumberOnlyPressableItem = useCallback(
    ({ item }: { item: IAnimeEpisode | IMovieEpisode }) => {
      return (
        <>
          <YStack padding={2} flex={1} justifyContent="space-between">
            <YStack>
              <XStack alignItems="center" justifyContent="space-between" gap={2}>
                <Text fontSize="$3" fontWeight="700" numberOfLines={1} flex={1}>
                  EP {item.number ?? item.episode}
                </Text>
                <XStack gap={2}>
                  <Captions size={20} color="$color1" opacity={0.7} />
                  {item?.isDubbed && <Mic size={20} color="$color1" opacity={0.7} />}
                </XStack>
              </XStack>
            </YStack>
            {ProgressAndAirDate({ item })}
          </YStack>
        </>
      );
    },
    [ProgressAndAirDate],
  );

  const renderItemContent = useCallback(
    (item: IAnimeEpisode | IMovieEpisode) => {
      // console.log('renderContent', displayMode);
      switch (displayMode) {
        case EpisodeDisplayMode.FullMetadata:
          return renderFullMetadataPressableItem({ item });
        case EpisodeDisplayMode.TitleOnly:
          return renderTitleOnlyPressableItem({ item });
        case EpisodeDisplayMode.NumberOnly:
          return renderNumberOnlyPressableItem({ item });
        default:
          return renderFullMetadataPressableItem({ item });
      }
    },
    [renderFullMetadataPressableItem, renderTitleOnlyPressableItem, renderNumberOnlyPressableItem, displayMode],
  );

  const getItemKey = useCallback((item: IAnimeEpisode | IMovieEpisode) => {
    return item?.id ?? item?.uniqueId;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: IAnimeEpisode | IMovieEpisode }) => {
      const itemKey = getItemKey(item);
      // Get or create a stable ref object for this item
      const itemRef =
        swipeableRefs.current.get(itemKey) ??
        (() => {
          const newRef = React.createRef<SwipeableMethods | null>();
          swipeableRefs.current.set(itemKey, newRef);
          return newRef;
        })();

      return swipeable ? (
        <ReanimatedSwipeable
          ref={itemRef}
          friction={2}
          enableTrackpadTwoFingerGesture
          rightThreshold={40}
          onSwipeableOpen={() => {
            // Toggle completion status
            handleToggleComplete(item);
            // Close the swipeable
            const currentRef = swipeableRefs.current.get(itemKey);
            currentRef?.current?.close();
          }}
          onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          onSwipeableWillClose={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          renderRightActions={rightActions(item)}>
          <ListPressable item={item}>{renderItemContent(item)}</ListPressable>
        </ReanimatedSwipeable>
      ) : (
        <ListPressable item={item}>{renderItemContent(item)}</ListPressable>
      );
    },
    [swipeable, getItemKey, handleToggleComplete, rightActions, renderItemContent],
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <>
      <CustomFlashlist<IAnimeEpisode | IMovieEpisode>
        key={listKey}
        ref={flashListRef}
        data={episodes}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        ListHeaderComponent={
          <XStack paddingHorizontal={16} padding={8} gap="$5" alignItems="center" justifyContent="center">
            {swipeable && (
              <CustomSelect
                SelectItem={mediaType === MediaType.ANIME ? PROVIDERS.anime : PROVIDERS.movie}
                SelectLabel="Provider"
                value={getProvider(mediaType)}
                onValueChange={handleProviderChange}
              />
            )}
            {movieSeasons && type !== TvType.MOVIE && (
              <CustomSelect
                SelectItem={
                  movieSeasons?.map((_: any, index: number): { name: string; value: string } => ({
                    name: `Season ${index + 1}`,
                    value: String(index),
                  })) || []
                }
                SelectLabel="Season"
                value={String(seasonNumber)}
                onValueChange={(value: string) => {
                  setSeasonNumber(Number(value));
                  setEpisodes(movieSeasons[Number(value)].episodes);
                }}
              />
            )}
            {servers && servers.length > 0 && !swipeable && (
              <CustomSelect
                SelectItem={servers.map((server) => ({ name: server.name, value: server.name })) || []}
                SelectLabel="Servers"
                value={getCurrentServer()?.name!}
                onValueChange={(value: string) => setCurrentServer(value || servers[0].name)}
              />
            )}
            {swipeable && (
              <Pressable
                onPress={() => {
                  setDisplayMode(
                    displayMode === EpisodeDisplayMode.FullMetadata
                      ? EpisodeDisplayMode.TitleOnly
                      : displayMode === EpisodeDisplayMode.TitleOnly
                        ? EpisodeDisplayMode.NumberOnly
                        : EpisodeDisplayMode.FullMetadata,
                  );
                }}>
                {displayMode === EpisodeDisplayMode.FullMetadata ? (
                  <TableProperties color="$color" />
                ) : displayMode === EpisodeDisplayMode.TitleOnly ? (
                  <ListOrdered color="$color" />
                ) : (
                  <Images color="$color" />
                )}
              </Pressable>
            )}
          </XStack>
        }
        onLoad={() => {
          flashListRef?.current?.scrollToIndex({
            index: currentEpisodeIndex(),
            animated: true,
            viewPosition: 1,
            viewOffset: 200,
          });
        }}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
      />
      {swipeable && sheetOpen && (
        <EpisodeActionsSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          episode={selectedEpisode}
          mediaType={mediaType}
          provider={getProvider(mediaType) ?? provider}
          mediaId={episodeData?.id ?? id}
          type={type as string}
        />
      )}
    </>
  );
};
export default memo(EpisodeList);
