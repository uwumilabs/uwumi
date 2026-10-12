import { ActivityIndicator, Pressable, StyleSheet, View, Text, TextProps } from 'react-native';
import { FlashListRef, type ViewToken } from '@shopify/flash-list';
import React, { useEffect, useRef, useMemo, useState, useCallback, memo, ReactNode } from 'react';
import Image from '@/components/Image';
import { useRouter, useLocalSearchParams, usePathname } from 'expo-router';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
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
import { formatTime, isTV } from '@/constants/utils';
import Select from '../Select';
import { useProviders, useProviderStore } from '@/constants/provider';
import List from '../List';
import { HUYStack, HUXStack, RippleButton } from '../ui-primitives';
import TVFocusWrapper from '../TVFocusWrapper';
import LinearGradient from '../LinearGradient';
import { Button, Card, cn, ScrollShadow } from 'heroui-native';
import Progress from '../native/progress/Progress';
import { IoniconsIcon, MaterialIconsIcon } from '../Icons';

const EPISODE_RANGE_SIZE = 100;
// How far down, in screens, before the jump bar shows
const JUMP_BAR_SCREENS = 1.5;
const SHADOW_SIZE = 48;

const LoadingState = () => {
  const pureBlackBackground = usePureBlackBackground();
  return (
    <Card className={cn('mx-4 mt-6 bg-background', pureBlackBackground && 'bg-black')}>
      <HUYStack className="items-center gap-3 px-6 py-10">
        <ActivityIndicator size="large" />
        <Text className="text-sm font-semibold text-foreground/80">Fetching episodes…</Text>
      </HUYStack>
    </Card>
  );
};

const StyledText = ({ children, ...props }: { children: ReactNode } & TextProps) => {
  return (
    <Text {...props} className="text-[10px] text-overlay-foreground">
      {children}
    </Text>
  );
};

const ListPressable = memo(
  ({
    item,
    children,
    mediaType,
    provider,
    id,
    episodeDataId,
    type,
    swipeable,
    setSelectedEpisode,
    setSheetOpen,
  }: {
    item: IAnimeEpisode | IMovieEpisode;
    children: React.ReactNode;
    mediaType: MediaType;
    provider: string;
    id: string;
    episodeDataId?: string;
    type?: string;
    swipeable: boolean;
    setSelectedEpisode: (item: IAnimeEpisode | IMovieEpisode) => void;
    setSheetOpen: (open: boolean) => void;
  }) => {
    const router = useRouter();

    const navigateToEpisode = useCallback(() => {
      const routerParams = {
        pathname: '/watch/[mediaType]' as const,
        params: {
          mediaType,
          provider,
          id,
          mediaId: episodeDataId,
          episodeId: item?.id,
          ...(item?.dubId ? { episodeDubId: item.dubId as string } : null),
          ...(item?.isDubbed ? { isDubbed: item.isDubbed as string } : null),
          uniqueId: item?.uniqueId as string,
          poster: typeof item?.image === 'string' ? item.image : (item?.image?.hd ?? ''),
          title: item?.title,
          description: item?.description,
          episodeNumber: (item?.number ?? item?.episode) as string,
          seasonNumber: item?.season as string,
          type,
        },
      };
      if (swipeable) {
        router.push(routerParams);
      } else {
        router.replace(routerParams);
      }
    }, [router, mediaType, provider, id, episodeDataId, item, type, swipeable]);

    const handleLongPress = useCallback(() => {
      if (!isTV) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedEpisode(item);
      setSheetOpen(true);
    }, [item, setSelectedEpisode, setSheetOpen]);

    const handleActionsPress = useCallback(() => {
      setSelectedEpisode(item);
      setSheetOpen(true);
    }, [item, setSelectedEpisode, setSheetOpen]);

    return (
      <HUXStack className="items-center gap-1">
        <TVFocusWrapper
          onPress={navigateToEpisode}
          onLongPress={isTV ? undefined : handleLongPress}
          focusScale={1}
          className="rounded-2xl py-1 flex-1">
          {children}
        </TVFocusWrapper>
        {/* On TV, show a visible "⋮" button */}
        {isTV && swipeable && (
          <RippleButton onPress={handleActionsPress} className="p-2">
            <IoniconsIcon name="ellipsis-vertical" size={20} />
          </RippleButton>
        )}
      </HUXStack>
    );
  },
);

const SwipeAction = memo(
  ({
    drag,
    isCompleted,
    backgroundColor,
  }: {
    drag: SharedValue<number>;
    isCompleted: boolean;
    backgroundColor: string | undefined;
  }) => {
    const THRESHOLD = 100;

    const animatedStyle = useAnimatedStyle(() => {
      const progress = Math.min(Math.abs(drag.value) / THRESHOLD, 1);
      return {
        transform: [{ scale: withSpring(0.9 + progress * 0.1, { mass: 0.5, damping: 20, stiffness: 200 }) }],
        opacity: withSpring(progress > 0 ? 1 : 0.7),
      };
    });

    const firstIconStyle = useAnimatedStyle(() => {
      const progress = Math.min(Math.abs(drag.value) / THRESHOLD, 1);
      const opacity = interpolate(progress, [0, 0.5], [1, 0], Extrapolation.CLAMP);
      return { opacity };
    });

    const secondIconStyle = useAnimatedStyle(() => {
      const progress = Math.min(Math.abs(drag.value) / THRESHOLD, 1);
      const opacity = interpolate(progress, [0.5, 1], [0, 1], Extrapolation.CLAMP);
      return { opacity };
    });

    return (
      <Animated.View
        style={[animatedStyle, { width: 100, justifyContent: 'center', alignItems: 'center', backgroundColor }]}>
        {/* Show current state icon (fades out) */}
        <Animated.View
          style={[{ ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' }, firstIconStyle]}>
          {isCompleted ? (
            <IoniconsIcon name="eye-off-outline" color="white" size={24} />
          ) : (
            <IoniconsIcon name="eye-outline" color="white" size={24} />
          )}
        </Animated.View>

        {/* Show new state icon (fades in) */}
        <Animated.View
          style={[{ ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' }, secondIconStyle]}>
          {isCompleted ? (
            <IoniconsIcon name="eye-outline" color="white" size={24} />
          ) : (
            <IoniconsIcon name="eye-off-outline" color="white" size={24} />
          )}
        </Animated.View>
      </Animated.View>
    );
  },
);

interface EpisodeListProps {
  /** Rendered above the episode controls, inside the list, so it scrolls with the episodes. */
  header?: ReactNode;
  /** Jump to the episode being watched once the list loads; otherwise offer a "Continue" chip. */
  autoScrollToCurrent?: boolean;
}

export const EpisodeList = ({ header, autoScrollToCurrent = true }: EpisodeListProps) => {
  const swipeableRefs = useRef<Map<string, React.RefObject<SwipeableMethods | null>>>(new Map());
  const pathname = usePathname();
  const { mediaType, type, provider, id } = useLocalSearchParams<{
    mediaType: MediaType;
    type: MediaFormat | TvType;
    provider: string;
    id: string;
  }>();
  const swipeable = pathname.includes('/info/'); // Only enable swipe actions on the /info/[mediaType] screen, not in the episode list inside /watch/[mediaType]
  const currentTheme = useCurrentTheme();
  const flashListRef = useRef<FlashListRef<IAnimeEpisode | IMovieEpisode>>(null);
  const setProvider = useProviderStore((state) => state.setProvider);
  const currentProvider = useProviderStore((state) => state.providers[mediaType]);
  const providers = useProviders();
  const providerToUse = currentProvider ?? provider;

  useEffect(() => {
    if (!currentProvider) {
      setProvider(mediaType, provider);
    }
  }, [mediaType, provider, setProvider, currentProvider]);
  const animeResult = useAnimeEpisodes({
    id,
    provider: providerToUse,
    enabled: mediaType === MediaType.ANIME,
  });
  const movieResult = useMoviesEpisodes({
    id,
    type: type!,
    provider: providerToUse,
    enabled: mediaType === MediaType.MOVIE,
  });
  const { data: episodeData, isLoading } = mediaType === MediaType.ANIME ? animeResult : movieResult;
  const { seasonNumber, setSeasonNumber, resetSeasonNumber } = useSeasonStore();
  const movieSeasons = episodeData?.seasons as IMovieSeason[];
  // console.log('movieSeasons', movieSeasons);
  const animeEpisodes = useMemo(() => (Array.isArray(episodeData) ? episodeData : []), [episodeData]);
  // console.log(episodeData?.mappings, 'episodeData?.mappings');
  const episodes = useMemo(() => {
    if (mediaType === MediaType.MOVIE && movieSeasons?.[seasonNumber]?.episodes) {
      return movieSeasons[seasonNumber].episodes;
    }
    return animeEpisodes || [];
  }, [mediaType, movieSeasons, seasonNumber, animeEpisodes]);
  // console.log('episodes', episodes);

  const { currentUniqueId, setEpisodeIds } = useEpisodesIdStore();
  const { progresses, setProgress } = useWatchProgressStore();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const { displayMode, setDisplayMode } = useEpisodeDisplayStore();
  const setCurrentServer = useServerStore((state) => state.setCurrentServer);
  const servers = useServerStore((state) => state.servers);
  const currentServer = useServerStore((state) => state.currentServer);

  // Track the last synced uniqueId to prevent infinite loops
  const lastSyncedUniqueIdRef = useRef<string | null>(null);

  // Sync adjacent episode IDs to store whenever currentUniqueId changes
  // Uses ref to prevent infinite re-renders from episodes array reference changes
  useEffect(() => {
    // Skip if no uniqueId, no episodes, or already synced this uniqueId
    if (!currentUniqueId || episodes.length === 0) return;
    if (lastSyncedUniqueIdRef.current === currentUniqueId) return;

    const currentIndex = episodes.findIndex((ep) => ep.uniqueId === currentUniqueId);
    if (currentIndex === -1) return;

    const currentEp = episodes[currentIndex];
    const prevEp = currentIndex > 0 ? episodes[currentIndex - 1] : null;
    const nextEp = currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

    // Mark as synced before calling setEpisodeIds to prevent loops
    lastSyncedUniqueIdRef.current = currentUniqueId;

    setEpisodeIds(
      currentEp?.id ?? null,
      currentUniqueId,
      (prevEp?.uniqueId as string) ?? null,
      (nextEp?.uniqueId as string) ?? null,
    );
  }, [currentUniqueId, episodes, setEpisodeIds]);

  // console.log('servers', servers[0], getCurrentServer(), servers, getServers());

  const [listKey, setListKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<IAnimeEpisode | IMovieEpisode | null>(null);

  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const [jumpBarVisible, setJumpBarVisible] = useState(false);

  useEffect(() => {
    setListKey((prev) => prev + 1);
    scrollY.set(0);
  }, [displayMode, scrollY]);

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

  // Where "Continue" points: the episode being watched, else the furthest one with progress (or the one after it if
  // that one is finished). No progress, no chip.
  const continueIndex = useMemo(() => {
    if (autoScrollToCurrent) return -1;
    const current = currentEpisodeIndex();
    if (current >= 0) return current;
    for (let i = episodes.length - 1; i >= 0; i--) {
      const progress = progresses[episodes[i].uniqueId as string];
      if (progress) return progress.isCompleted && i < episodes.length - 1 ? i + 1 : i;
    }
    return -1;
  }, [autoScrollToCurrent, currentEpisodeIndex, episodes, progresses]);
  const continueEpisode = continueIndex >= 0 ? episodes[continueIndex] : undefined;

  const episodeRanges = useMemo(() => {
    if (episodes.length <= EPISODE_RANGE_SIZE) return [];
    const label = (index: number) => String(episodes[index].number ?? episodes[index].episode ?? index + 1);
    const ranges: { name: string; value: string }[] = [];
    for (let start = 0; start < episodes.length; start += EPISODE_RANGE_SIZE) {
      const end = Math.min(start + EPISODE_RANGE_SIZE, episodes.length) - 1;
      ranges.push({ name: `EP ${label(start)}–${label(end)}`, value: String(start) });
    }
    return ranges;
  }, [episodes]);
  const [visibleRangeStart, setVisibleRangeStart] = useState(0);
  const rangeValue = String(
    Math.min(visibleRangeStart, Math.floor(Math.max(episodes.length - 1, 0) / EPISODE_RANGE_SIZE) * EPISODE_RANGE_SIZE),
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<IAnimeEpisode | IMovieEpisode>[] }) => {
      const first = Math.min(...viewableItems.map((token) => token.index ?? Infinity));
      if (Number.isFinite(first)) setVisibleRangeStart(Math.floor(first / EPISODE_RANGE_SIZE) * EPISODE_RANGE_SIZE);
    },
    [],
  );

  const jumpToRange = useCallback((value: string) => {
    const index = Number(value);
    setVisibleRangeStart(index);
    flashListRef.current?.scrollToIndex({ index, animated: true, viewOffset: -SHADOW_SIZE });
  }, []);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
    viewportHeight.set(event.layoutMeasurement.height);
  });
  useAnimatedReaction(
    () => scrollY.get() > viewportHeight.get() * JUMP_BAR_SCREENS,
    (isFar, wasFar) => {
      if (isFar !== wasFar) scheduleOnRN(setJumpBarVisible, isFar);
    },
  );
  const jumpBarStyle = useAnimatedStyle(() => ({
    opacity: withTiming(jumpBarVisible ? 1 : 0, { duration: 200 }),
    transform: [{ translateY: withTiming(jumpBarVisible ? 0 : 24, { duration: 200 }) }],
  }));

  const scrollToTop = useCallback(() => {
    const list = flashListRef.current;
    if (!list) return;
    if (!isTV) Haptics.selectionAsync();
    // Jump to two screens from the top first, as FlashList's scrollToIndex does, so the animation doesn't fly
    // past thousands of rows it can't render in time
    const glideDistance = viewportHeight.get() * 2;
    if (scrollY.get() > glideDistance) list.scrollToOffset({ offset: glideDistance, animated: false });
    requestAnimationFrame(() => list.scrollToOffset({ offset: 0, animated: true }));
  }, [scrollY, viewportHeight]);

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

      if (!isTV) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [progresses, setProgress],
  );

  const rightActions = useCallback(
    (item: IAnimeEpisode | IMovieEpisode) => {
      return (_prog: SharedValue<number>, drag: SharedValue<number>) => {
        const progress = progresses[item?.uniqueId as string];
        const isCompleted = progress?.isCompleted ?? false;

        return <SwipeAction drag={drag} isCompleted={isCompleted} backgroundColor={currentTheme?.default} />;
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
        return <IoniconsIcon name="eye-off-outline" color="white" size={15} />;
      }

      // Show progress if watching but not completed
      if (progress?.currentTime && progress?.progress > 0) {
        return (
          <StyledText>
            {formatTime(progress.currentTime)}/{formatTime(progress.duration)}
          </StyledText>
        );
      }

      // Not started
      return <IoniconsIcon name="eye-outline" color="white" size={15} />;
    },
    [currentUniqueId, progresses],
  );

  const ProgressAndAirDate = useCallback(
    ({ item }: { item: IAnimeEpisode | IMovieEpisode }) => {
      const rawReleaseDate = item?.releaseDate;
      const date = rawReleaseDate ? new Date(rawReleaseDate) : null;
      const isValidDate = !!date && !Number.isNaN(date.getTime());
      return (
        <HUXStack className="items-center justify-between w-full">
          <View>{renderEpisodeProgress(item)}</View>
          <StyledText>
            {isValidDate ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date) : '—'}
          </StyledText>
        </HUXStack>
      );
    },
    [renderEpisodeProgress],
  );

  const renderFullMetadataPressableItem = useCallback(
    ({ item }: { item: IAnimeEpisode | IMovieEpisode }) => {
      return (
        <Card
          className={cn(
            'flex-row gap-3 overflow-hidden rounded-2xl bg-background p-1.5 shadow-md border-0',
            pureBlackBackground && 'bg-black',
            currentUniqueId === item?.uniqueId && 'border-2 border-default',
          )}>
          <View className="relative overflow-hidden rounded-xl">
            <Image
              source={typeof item?.image === 'string' ? item.image : (item?.image?.hd ?? '')}
              style={{ width: 160, height: 107 }}
              // className="pl-1.5"
            />
            <Text className="absolute left-2 bottom-2.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-black text-accent">
              {`EP ${(item.number ?? item.episode ?? '').toString()}`}
            </Text>
            {progresses[item?.uniqueId as string] && swipeable ? (
              <Progress
                className="absolute inset-x-1 bottom-0.5"
                value={progresses[item?.uniqueId as string]?.progress || 0}
              />
            ) : null}
          </View>
          <HUYStack className="flex-1 justify-between gap-2 px-2 ">
            <Card.Header>
              <HUXStack className="items-center justify-between gap-2">
                <Card.Title className="w-4/5" numberOfLines={1}>
                  {item.title}
                </Card.Title>
                <HUXStack className="items-center gap-1">
                  <MaterialIconsIcon name="closed-caption-off" size={12} />
                  {item?.isDubbed ? <IoniconsIcon name="mic" size={12} /> : null}
                </HUXStack>
              </HUXStack>
            </Card.Header>

            <Card.Description className="text-xs text-foreground/85" numberOfLines={3}>
              {item?.description}
            </Card.Description>
            <Card.Footer>
              <HUXStack className="items-center justify-between">
                <ProgressAndAirDate item={item} />
              </HUXStack>
            </Card.Footer>
          </HUYStack>
        </Card>
      );
    },
    [ProgressAndAirDate, progresses, pureBlackBackground, swipeable, mediaType, currentUniqueId, currentTheme],
  );

  const renderTitleOnlyPressableItem = useCallback(
    ({ item }: { item: IAnimeEpisode | IMovieEpisode }) => {
      return (
        <HUYStack
          className={cn('flex-1 gap-2 rounded-2xl bg-background p-3 shadow-md', pureBlackBackground && 'bg-black')}>
          <HUXStack className="items-center justify-between gap-2">
            <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={2}>
              {item.title}
            </Text>
            <HUXStack className="flex-row items-center gap-1">
              <MaterialIconsIcon name="closed-caption-off" size={18} />
              {item?.isDubbed ? <IoniconsIcon name="mic" size={18} /> : null}
            </HUXStack>
          </HUXStack>
          <ProgressAndAirDate item={item} />
        </HUYStack>
      );
    },
    [ProgressAndAirDate, pureBlackBackground],
  );

  const renderNumberOnlyPressableItem = useCallback(
    ({ item }: { item: IAnimeEpisode | IMovieEpisode }) => {
      return (
        <HUYStack
          className={cn('flex-1 gap-2 rounded-2xl bg-background p-3 shadow-md', pureBlackBackground && 'bg-black')}>
          <HUXStack className="items-center justify-between gap-2">
            <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
              {`EP ${(item.number ?? item.episode ?? '').toString()}`}
            </Text>
            <HUXStack className="gap-1">
              <MaterialIconsIcon name="closed-caption-off" size={18} />
              {item?.isDubbed ? <IoniconsIcon name="mic" size={18} /> : null}
            </HUXStack>
          </HUXStack>
          <ProgressAndAirDate item={item} />
        </HUYStack>
      );
    },
    [ProgressAndAirDate, pureBlackBackground],
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

      return swipeable && !isTV ? (
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
          <ListPressable
            item={item}
            mediaType={mediaType}
            provider={providerToUse}
            id={id}
            episodeDataId={episodeData?.id}
            type={type as string}
            swipeable={swipeable}
            setSelectedEpisode={setSelectedEpisode}
            setSheetOpen={setSheetOpen}>
            {renderItemContent(item)}
          </ListPressable>
        </ReanimatedSwipeable>
      ) : (
        <ListPressable
          item={item}
          mediaType={mediaType}
          provider={providerToUse}
          id={id}
          episodeDataId={episodeData?.id}
          type={type as string}
          swipeable={swipeable}
          setSelectedEpisode={setSelectedEpisode}
          setSheetOpen={setSheetOpen}>
          {renderItemContent(item)}
        </ListPressable>
      );
    },
    [
      swipeable,
      getItemKey,
      handleToggleComplete,
      rightActions,
      renderItemContent,
      mediaType,
      providerToUse,
      id,
      episodeData?.id,
      type,
    ],
  );

  return (
    <>
      <View className="flex-1">
        <ScrollShadow
          key={listKey}
          className="flex-1"
          size={SHADOW_SIZE}
          color={pureBlackBackground ? '#000000' : currentTheme?.background}
          LinearGradientComponent={LinearGradient}>
          <List<IAnimeEpisode | IMovieEpisode>
            ref={flashListRef}
            onScroll={onScroll}
            onViewableItemsChanged={handleViewableItemsChanged}
            data={isLoading ? [] : episodes}
            // Loading renders inside the list so `header` stays visible meanwhile
            {...(isLoading && { ListEmptyComponent: <LoadingState /> })}
            // ItemSeparatorComponent={() => <View className="h-3" />}
            ListHeaderComponent={
              <>
                {header}
                <HUXStack className="w-full flex-wrap items-center justify-center gap-5 px-4 py-2">
                  {swipeable && (
                    <Select
                      SelectItem={mediaType === MediaType.ANIME ? providers.anime : providers.movie}
                      SelectLabel="Provider"
                      value={providerToUse}
                      onValueChange={handleProviderChange}
                    />
                  )}
                  {movieSeasons && type !== TvType.MOVIE && (
                    <Select
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
                  {episodeRanges.length > 0 && (
                    <Select
                      SelectItem={episodeRanges}
                      SelectLabel="Episodes"
                      value={rangeValue}
                      onValueChange={jumpToRange}
                    />
                  )}
                  {servers && servers.length > 0 && !swipeable && (
                    <Select
                      SelectItem={servers.map((server) => ({ name: server.name, value: server.name })) || []}
                      SelectLabel="Servers"
                      value={currentServer?.name || ''}
                      onValueChange={(value: string) =>
                        setCurrentServer(value || currentServer?.name || servers[0].name)
                      }
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
                        <IoniconsIcon name="list" />
                      ) : displayMode === EpisodeDisplayMode.TitleOnly ? (
                        <MaterialIconsIcon name="format-list-numbered" />
                      ) : (
                        <IoniconsIcon name="image-outline" />
                      )}
                    </Pressable>
                  )}
                  {continueEpisode && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() =>
                        flashListRef.current?.scrollToIndex({ index: continueIndex, animated: true, viewPosition: 0.3 })
                      }>
                      <IoniconsIcon name="play" size={14} color={currentTheme?.foreground} />
                      <Button.Label>{`Continue · EP ${(continueEpisode.number ?? continueEpisode.episode ?? '').toString()}`}</Button.Label>
                    </Button>
                  )}
                </HUXStack>
              </>
            }
            onLoad={() => {
              const index = currentEpisodeIndex();
              if (!autoScrollToCurrent || index < 0) return;
              flashListRef?.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 1,
                viewOffset: 200,
              });
            }}
            keyExtractor={getItemKey}
            renderItem={renderItem}
          />
        </ScrollShadow>
        {!isTV && (
          <Animated.View
            pointerEvents={jumpBarVisible ? 'box-none' : 'none'}
            style={[styles.jumpBar, { bottom: insets.bottom + 16 }, jumpBarStyle]}>
            <HUXStack className="items-center gap-2">
              <Button isIconOnly size="sm" onPress={scrollToTop} accessibilityLabel="Back to top">
                <IoniconsIcon name="arrow-up" size={18} className="text-accent-foreground" />
              </Button>
              {episodeRanges.length > 0 && (
                <Select
                  size="sm"
                  SelectItem={episodeRanges}
                  SelectLabel="Episodes"
                  value={rangeValue}
                  onValueChange={jumpToRange}
                />
              )}
            </HUXStack>
          </Animated.View>
        )}
      </View>
      {swipeable && (
        <EpisodeActionsSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          episode={selectedEpisode}
          mediaType={mediaType}
          provider={providerToUse}
          mediaId={episodeData?.id ?? id}
          type={type as string}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  jumpBar: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});

export default memo(EpisodeList);
