/* eslint-disable react/display-name */
/* eslint-disable react-hooks/rules-of-hooks */
import { ActivityIndicator, Pressable, StyleSheet, View, Text, TextProps } from 'react-native';
import { FlashListRef } from '@shopify/flash-list';
import React, { useEffect, useRef, useMemo, useState, useCallback, memo, ReactNode } from 'react';
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
import { HUYStack, HUXStack, RippleButton } from '../ui-primitives';
import { Card, cn } from 'heroui-native';
import Progress from '../Progress';

const LoadingState = () => (
  <Card className="mx-4 mt-6 bg-background">
    <HUYStack className="items-center gap-3 px-6 py-10">
      <ActivityIndicator size="large" color="$color" />
      <Text className="text-sm font-semibold text-foreground/80">Fetching episodes…</Text>
    </HUYStack>
  </Card>
);

const StyledText = ({ children, ...props }: { children: ReactNode } & TextProps) => {
  return (
    <Text {...props} className="text-[10px] text-overlay-foreground">
      {children}
    </Text>
  );
};

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
              { width: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: currentTheme?.default },
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
            {formatTime(progress.currentTime)}/{formatTime(progress.duration)}
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
        <RippleButton onPress={navigateToEpisode} onLongPress={handleLongPress} className="rounded-2xl py-1 w-full">
          {children}
        </RippleButton>
      );
    },
  );

  const ProgressAndAirDate = useCallback(
    ({ item }: { item: IAnimeEpisode | IMovieEpisode }) => {
      const date = new Date(item?.releaseDate ?? '');
      return (
        <HUXStack className="items-center justify-between w-full">
          <View>{renderEpisodeProgress(item)}</View>
          <StyledText>{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)}</StyledText>
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
            'flex-row gap-3 overflow-hidden rounded-2xl bg-background p-0 py-1.5 shadow-md',
            pureBlackBackground && 'bg-black',
          )}>
          <View className="relative overflow-hidden rounded-xl">
            <CustomImage
              source={typeof item?.image === 'string' ? item.image : (item?.image?.hd ?? '')}
              style={{ width: 160, height: 107 }}
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
                  <Captions size={12} />
                  {item?.isDubbed ? <Mic size={12} /> : null}
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
    [ProgressAndAirDate, progresses, pureBlackBackground, swipeable, mediaType],
  );

  const renderTitleOnlyPressableItem = useCallback(
    ({ item }: { item: IAnimeEpisode | IMovieEpisode }) => {
      return (
        <HUYStack className="flex-1 gap-2 rounded-2xl border border-border/60 bg-background/80 p-3 shadow-md">
          <HUXStack className="items-center justify-between gap-2">
            <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={2}>
              {item.title}
            </Text>
            <HUXStack className="flex-row items-center gap-1">
              <Captions size={18} color="#9ca3af" opacity={0.8} />
              {item?.isDubbed ? <Mic size={18} color="#9ca3af" opacity={0.8} /> : null}
            </HUXStack>
          </HUXStack>
          <ProgressAndAirDate item={item} />
        </HUYStack>
      );
    },
    [ProgressAndAirDate],
  );

  const renderNumberOnlyPressableItem = useCallback(
    ({ item }: { item: IAnimeEpisode | IMovieEpisode }) => {
      return (
        <HUYStack className="flex-1 gap-2 rounded-2xl border border-border/60 bg-background/80 p-3 shadow-md">
          <HUXStack className="items-center justify-between gap-2">
            <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
              {`EP ${(item.number ?? item.episode ?? '').toString()}`}
            </Text>
            <HUXStack className="gap-1">
              <Captions size={18} color="#9ca3af" opacity={0.8} />
              {item?.isDubbed ? <Mic size={18} color="#9ca3af" opacity={0.8} /> : null}
            </HUXStack>
          </HUXStack>
          <ProgressAndAirDate item={item} />
        </HUYStack>
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
