import { ActivityIndicator, Pressable, StyleSheet, View, Text, TextProps } from 'react-native';
import { FlashListRef } from '@shopify/flash-list';
import React, { useEffect, useRef, useMemo, useState, useCallback, memo, ReactNode } from 'react';
import CustomImage from '@/components/CustomImage';
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
import { HUYStack, HUXStack } from '../ui-primitives';
import { Card, cn } from 'heroui-native';
import Progress from '../Progress';
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
    const navigateToEpisode = () => {
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
    };

    const handleLongPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedEpisode(item);
      setSheetOpen(true);
    };

    return (
      <Pressable onPress={navigateToEpisode} onLongPress={handleLongPress} className="rounded-2xl py-1 w-full">
        {children}
      </Pressable>
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
          style={[
            { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
            firstIconStyle,
          ]}>
          {isCompleted ? (
            <IoniconsIcon name="eye-off-outline" color="white" size={24} />
          ) : (
            <IoniconsIcon name="eye-outline" color="white" size={24} />
          )}
        </Animated.View>

        {/* Show new state icon (fades in) */}
        <Animated.View
          style={[
            { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
            secondIconStyle,
          ]}>
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

export const EpisodeList = () => {
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
  const { setProvider, getProvider } = useProviderStore();
  useEffect(() => {
    setProvider(mediaType, getProvider(mediaType) ?? provider);
  }, [mediaType, provider, setProvider, getProvider]);
  const animeResult = useAnimeEpisodes({
    id,
    provider: getProvider(mediaType),
    enabled: mediaType === MediaType.ANIME,
  });
  const movieResult = useMoviesEpisodes({
    id,
    type: type!,
    provider: getProvider(mediaType),
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
  const { setCurrentServer, getCurrentServer, servers } = useServerStore();
  // subscribe to servers array to trigger re-renders when it changes
  const getServers = useServerStore((state) => state.getServers);

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
            <CustomImage
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
          <ListPressable
            item={item}
            mediaType={mediaType}
            provider={getProvider(mediaType) ?? provider}
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
          provider={getProvider(mediaType) ?? provider}
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
      getProvider,
      provider,
      id,
      episodeData?.id,
      type,
    ],
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
        // ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={
          <HUXStack className="w-full items-center justify-center gap-5 px-4 py-2">
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
            {getServers() && getServers().length > 0 && !swipeable && (
              <CustomSelect
                SelectItem={getServers().map((server) => ({ name: server.name, value: server.name })) || []}
                SelectLabel="Servers"
                value={getCurrentServer()?.name!}
                onValueChange={(value: string) =>
                  setCurrentServer(value || getCurrentServer()?.name! || getServers()[0].name)
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
          </HUXStack>
        }
        onLoad={() => {
          flashListRef?.current?.scrollToIndex({
            index: currentEpisodeIndex(),
            animated: true,
            viewPosition: 1,
            viewOffset: 200,
          });
        }}
        keyExtractor={getItemKey}
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
