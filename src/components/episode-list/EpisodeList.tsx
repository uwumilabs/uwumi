import { ActivityIndicator, Pressable, StyleSheet, View, Text, TextProps } from 'react-native';
import { FlashListRef } from '@shopify/flash-list';
import React, { useRef, useState, useCallback, memo, ReactNode } from 'react';
import Image from '@/components/Image';
import { useRouter, useLocalSearchParams, usePathname } from 'expo-router';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  useEpisodesIdStore,
  useWatchProgressStore,
  useCurrentTheme,
  usePureBlackBackground,
  useEpisodeDisplayStore,
  useServerStore,
  useListJump,
  useEpisodeList,
  LIST_SHADOW_SIZE,
} from '@/hooks';
import WavyAnimation from './WavyAnimation';
import EpisodeActionsSheet from './EpisodeActionsSheet';
import { EpisodeDisplayMode, MediaType } from '@/constants/types';
import { IAnimeEpisode, IMovieEpisode, MediaFormat, TvType } from 'react-native-consumet';
import { formatTime, isTV } from '@/constants/utils';
import Select from '../Select';
import { useProviders, useProviderStore } from '@/constants/provider';
import List from '../List';
import { HUYStack, HUXStack, RippleButton } from '../ui-primitives';
import TVFocusWrapper from '../TVFocusWrapper';
import LinearGradient from '../LinearGradient';
import ListJumpBar from '../ListJumpBar';
import { ProviderEmptyState } from '../ListEmptyState';
import { Button, Card, cn, ScrollShadow } from 'heroui-native';
import Progress from '../native/progress/Progress';
import { IoniconsIcon, MaterialIconsIcon } from '../Icons';

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

const releaseDateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

// Rows subscribe to their own episode's progress, so a progress write re-renders one row, not the list
const EpisodeProgress = memo(({ uniqueId, isCurrent }: { uniqueId?: string; isCurrent: boolean }) => {
  const progress = useWatchProgressStore((state) => (uniqueId ? state.progresses[uniqueId] : undefined));

  if (isCurrent) return <WavyAnimation />;
  if (progress?.isCompleted) return <IoniconsIcon name="eye-off-outline" color="white" size={15} />;
  if (progress?.currentTime && progress.progress > 0) {
    return (
      <StyledText>
        {formatTime(progress.currentTime)}/{formatTime(progress.duration)}
      </StyledText>
    );
  }
  return <IoniconsIcon name="eye-outline" color="white" size={15} />;
});

const ProgressAndAirDate = memo(({ item, isCurrent }: { item: IAnimeEpisode | IMovieEpisode; isCurrent: boolean }) => {
  const date = item?.releaseDate ? new Date(item.releaseDate) : null;
  const isValidDate = !!date && !Number.isNaN(date.getTime());
  return (
    <HUXStack className="items-center justify-between w-full">
      <View>
        <EpisodeProgress uniqueId={item?.uniqueId as string} isCurrent={isCurrent} />
      </View>
      <StyledText>{isValidDate ? releaseDateFormat.format(date) : '—'}</StyledText>
    </HUXStack>
  );
});

const ThumbnailProgress = memo(({ uniqueId }: { uniqueId?: string }) => {
  const percent = useWatchProgressStore((state) => (uniqueId ? state.progresses[uniqueId]?.progress : undefined));
  if (percent === undefined) return null;
  return <Progress className="absolute inset-x-1 bottom-0.5" value={percent || 0} />;
});

EpisodeProgress.displayName = 'EpisodeProgress';
ProgressAndAirDate.displayName = 'ProgressAndAirDate';
ThumbnailProgress.displayName = 'ThumbnailProgress';

const SwipeAction = memo(
  ({
    drag,
    uniqueId,
    backgroundColor,
  }: {
    drag: SharedValue<number>;
    uniqueId?: string;
    backgroundColor: string | undefined;
  }) => {
    const THRESHOLD = 100;
    const isCompleted = useWatchProgressStore((state) => !!(uniqueId && state.progresses[uniqueId]?.isCompleted));

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
  const { mediaType, type, id } = useLocalSearchParams<{
    mediaType: MediaType;
    type: MediaFormat | TvType;
    id: string;
  }>();
  const swipeable = pathname.includes('/info/'); // Only enable swipe actions on the /info/[mediaType] screen, not in the episode list inside /watch/[mediaType]
  const currentTheme = useCurrentTheme();
  const flashListRef = useRef<FlashListRef<IAnimeEpisode | IMovieEpisode>>(null);
  const setProvider = useProviderStore((state) => state.setProvider);
  const { episodes, episodeData, movieSeasons, activeSeason, setSeason, providerToUse, isLoading, error, refetch } =
    useEpisodeList();
  const providers = useProviders();

  const currentUniqueId = useEpisodesIdStore((state) => state.currentUniqueId);
  const setProgress = useWatchProgressStore((state) => state.setProgress);
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const displayMode = useEpisodeDisplayStore((state) => state.displayMode);
  const setDisplayMode = useEpisodeDisplayStore((state) => state.setDisplayMode);
  const setCurrentServer = useServerStore((state) => state.setCurrentServer);
  const servers = useServerStore((state) => state.servers);
  const currentServer = useServerStore((state) => state.currentServer);

  // console.log('servers', servers[0], getCurrentServer(), servers, getServers());

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<IAnimeEpisode | IMovieEpisode | null>(null);

  const episodeRangeLabel = useCallback(
    (start: number, end: number) => {
      const label = (index: number) => String(episodes[index].number ?? episodes[index].episode ?? index + 1);
      return `EP ${label(start)}–${label(end)}`;
    },
    [episodes],
  );
  const {
    listProps,
    ranges: episodeRanges,
    rangeValue,
    jumpToRange,
    resetScroll,
    jumpBar,
  } = useListJump({ items: episodes, listRef: flashListRef, rangeLabel: episodeRangeLabel });

  // console.log('episodes', episodeData);
  const currentEpisodeIndex = useCallback(() => {
    return episodes.findIndex((episode: IAnimeEpisode | IMovieEpisode) => episode.uniqueId === currentUniqueId);
  }, [episodes, currentUniqueId]);

  // Where "Continue" points: the episode being watched, else the furthest one with progress, or the one after it if
  // that one is finished. No chip without progress, or once the last episode is finished.
  const continueIndex = useWatchProgressStore(
    useCallback(
      ({ progresses }) => {
        if (autoScrollToCurrent) return -1;
        let index = currentEpisodeIndex();
        if (index < 0) {
          index = episodes.length - 1;
          while (index >= 0 && !progresses[episodes[index].uniqueId as string]) index--;
        }
        if (index < 0) return -1;
        if (!progresses[episodes[index].uniqueId as string]?.isCompleted) return index;
        return index < episodes.length - 1 ? index + 1 : -1;
      },
      [autoScrollToCurrent, currentEpisodeIndex, episodes],
    ),
  );
  const continueEpisode = continueIndex >= 0 ? episodes[continueIndex] : undefined;

  const handleProviderChange = useCallback(
    (value: string) => {
      setProvider(mediaType, value);
    },
    [mediaType, setProvider],
  );

  const handleToggleComplete = useCallback(
    (item: IAnimeEpisode | IMovieEpisode) => {
      if (!item?.uniqueId) return;

      const progress = useWatchProgressStore.getState().progresses[item.uniqueId];
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
    [setProgress],
  );

  const rightActions = useCallback(
    (item: IAnimeEpisode | IMovieEpisode) => {
      return (_prog: SharedValue<number>, drag: SharedValue<number>) => (
        <SwipeAction drag={drag} uniqueId={item?.uniqueId as string} backgroundColor={currentTheme?.default} />
      );
    },
    [currentTheme],
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
            {swipeable && <ThumbnailProgress uniqueId={item?.uniqueId as string} />}
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
                <ProgressAndAirDate item={item} isCurrent={currentUniqueId === item?.uniqueId} />
              </HUXStack>
            </Card.Footer>
          </HUYStack>
        </Card>
      );
    },
    [pureBlackBackground, swipeable, currentUniqueId],
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
          <ProgressAndAirDate item={item} isCurrent={currentUniqueId === item?.uniqueId} />
        </HUYStack>
      );
    },
    [pureBlackBackground, currentUniqueId],
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
          <ProgressAndAirDate item={item} isCurrent={currentUniqueId === item?.uniqueId} />
        </HUYStack>
      );
    },
    [pureBlackBackground, currentUniqueId],
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
          key={displayMode}
          className="flex-1"
          size={LIST_SHADOW_SIZE}
          color={pureBlackBackground ? '#000000' : currentTheme?.background}
          LinearGradientComponent={LinearGradient}>
          <List<IAnimeEpisode | IMovieEpisode>
            ref={flashListRef}
            {...listProps}
            data={isLoading ? [] : episodes}
            // Rendered inside the list so `header` stays visible
            ListEmptyComponent={
              isLoading ? (
                <LoadingState />
              ) : (
                <ProviderEmptyState
                  providers={mediaType === MediaType.ANIME ? providers.anime : providers.movie}
                  provider={providerToUse}
                  error={error}
                  onRetry={() => refetch()}
                  onProviderChange={handleProviderChange}
                  itemsLabel="episodes"
                />
              )
            }
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
                      value={String(activeSeason)}
                      onValueChange={(value: string) => {
                        setSeason(Number(value));
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
                        // The new display mode remounts the list at the top
                        resetScroll();
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
        <ListJumpBar {...jumpBar} rangesLabel="Episodes" />
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

export default memo(EpisodeList);
