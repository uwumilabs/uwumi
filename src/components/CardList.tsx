import React, { memo, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from './LinearGradient';
import { AnimatedImage } from './Image';
import { MediaFeedType, MediaType, MetaProvider } from '@/constants/types';
import { IAnimeResult, IMovieResult, ISearch } from 'react-native-consumet';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import { isTV } from '@/constants/utils';
import { InfiniteData } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { HUXStack, HUYStack, NoResults } from './ui-primitives';
import { useAnimeAndMangaSearch, useMediaFeed, useMovieSearch } from '@/hooks';
import { useCardGridDimensions } from '@/hooks/useCardGridDimensions';
import { resolveProvider, useProviderStore } from '@/constants/provider';
import List from './List';
import { Card, SkeletonGroup } from './heroui';
import TVFocusWrapper from './TVFocusWrapper';

export type MediaItem = IAnimeResult | IMovieResult;

export interface CardListProps {
  staticData?: MediaItem[] | undefined;
  mediaFeedType?: MediaFeedType;
  mediaType: MediaType;
  metaProvider: MetaProvider;
  searchQuery?: string;
  onItemPress?: (item: MediaItem) => void;
  /** Shown when the list is empty, instead of the generic "No results found" */
  emptyState?: React.ReactElement;
}

export interface MediaCardProps {
  item: MediaItem;
  index: number;
  mediaType: MediaType;
  metaProvider: MetaProvider;
  isSearch?: boolean;
  preferredFocus?: boolean;
  animateEntry?: boolean;
  sharedTag?: string;
  onPress?: (item: MediaItem) => void;
}

// TMDB movie and TV ids share a numeric space, so the id alone isn't unique.
export const cardKey = (item: MediaItem) => `${item.type}-${item.id}`;
const AnimatedStyledCard = Animated.createAnimatedComponent(Card);
const AnimatedStyledCardTitle = Animated.createAnimatedComponent(Card.Title);

const isInfiniteData = (
  data: InfiniteData<ISearch<MediaItem>> | MediaItem[] | undefined,
): data is InfiniteData<ISearch<MediaItem>> => !!data && 'pages' in data;

/** Flattens feed pages into displayable cards: de-duplicated and with a usable image. */
export const toCardItems = (data: InfiniteData<ISearch<MediaItem>> | MediaItem[] | undefined): MediaItem[] => {
  if (!data) return [];
  const items = isInfiniteData(data) ? data.pages.flatMap((page) => (page.results ?? []) as MediaItem[]) : data;
  // Paged feeds (e.g. TMDB trending) repeat items across pages as ranks shift; a duplicate
  // key makes FlashList render the item in its later slot and leave a hole at the earlier one.
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.image || item.image.includes('/originalundefined') || item.image.includes('/originalnull')) return false;
    if (item.id == null) return true;
    const key = cardKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const CardSkeleton = ({ isLoading, grid }: { isLoading: boolean; grid: ReturnType<typeof useCardGridDimensions> }) => {
  const cardHeight = grid.itemWidth * (isTV ? 3.2 / 2 : 3 / 2);
  const usableHeight = Math.max(grid.screenHeight - grid.verticalPadding * 2, cardHeight);
  const rows = Math.max(2, Math.ceil(usableHeight / (cardHeight + grid.itemSpacing * 2)));
  const skeletonCount = rows * grid.numColumns;

  return (
    <SkeletonGroup isLoading={isLoading} animation={false}>
      <View
        className="flex-row flex-wrap"
        style={{
          paddingHorizontal: grid.horizontalPadding,
          paddingVertical: grid.verticalPadding,
        }}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <View key={i} style={{ width: `${100 / grid.numColumns}%`, padding: grid.itemSpacing }}>
            <View className={isTV ? 'aspect-[2/3.2]' : 'aspect-2/3'}>
              <SkeletonGroup.Item className="w-full h-full rounded-lg" />
            </View>
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
};

export const MediaCard: React.FC<MediaCardProps> = memo(
  ({ item, index, mediaType, metaProvider, isSearch, preferredFocus, animateEntry = true, sharedTag, onPress }) => {
    const router = useRouter();
    const transitionTag = isSearch ? undefined : (sharedTag ?? String(item.id));

    const handlePress = useCallback(() => {
      onPress?.(item);
      router.push({
        pathname: '/info/[mediaType]',
        params: {
          mediaType: mediaType,
          metaProvider: metaProvider,
          type: item?.type,
          provider: resolveProvider(mediaType, useProviderStore.getState().providers[mediaType]),
          id: item.id,
          image: item.image,
          title: typeof item.title === 'string' ? item.title : item.title?.romaji || item.title?.english,
          ...(sharedTag && { sharedTag }),
        },
      });
    }, [router, mediaType, metaProvider, item, sharedTag, onPress]);

    return (
      <TVFocusWrapper
        className={isTV ? 'p-0' : 'p-0 rounded-none'}
        hasTVPreferredFocus={isTV && (preferredFocus ?? index === 0) ? true : undefined}
        onPress={handlePress}>
        <AnimatedStyledCard
          entering={animateEntry && !isSearch && index < 12 ? FadeInDown.delay(50 * index).duration(300) : undefined}
          // Height comes from the aspect ratio alone; flex-1 let FlashList's horizontal cells collapse it to 0
          className={`w-full rounded-[10px] overflow-hidden p-0 ${isTV ? 'aspect-[2/3.2]' : 'aspect-2/3'}`}>
          <Card.Body className="w-full h-full p-0 relative">
            <AnimatedImage
              source={{ uri: item.image }}
              style={{ borderRadius: 10, zIndex: 0 }}
              width="100%"
              height="100%"
              sharedTransitionTag={transitionTag && `shared-image-${transitionTag}`}
              className="absolute inset-0"
            />
            <LinearGradient
              className="w-full h-full absolute inset-0 z-10"
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              start={[0, 1]}
              end={[0, 0.3]}
              style={{ borderRadius: 10 }}
            />
            <AnimatedStyledCardTitle
              className="absolute bottom-0 left-0 right-0 z-20 py-2 px-2 text-sm font-medium m-0 text-white"
              numberOfLines={2}
              sharedTransitionTag={transitionTag && `shared-title-${transitionTag}`}
              ellipsizeMode="tail">
              {typeof item.title === 'string' ? item.title : item.title?.romaji || item.title?.english}
            </AnimatedStyledCardTitle>
          </Card.Body>
        </AnimatedStyledCard>
      </TVFocusWrapper>
    );
  },
);

MediaCard.displayName = 'MediaCard';

export const CardList: React.FC<CardListProps> = ({
  staticData,
  mediaFeedType,
  mediaType,
  metaProvider,
  searchQuery = '',
  onItemPress,
  emptyState,
}) => {
  const isSearch = mediaFeedType === 'search';
  const isMovieSearch = isSearch && mediaType === MediaType.MOVIE;
  const isAnimeSearch = isSearch && !isMovieSearch;
  const isFeed = !staticData && !isSearch;

  const movieSearchResult = useMovieSearch<MediaItem>(mediaType, searchQuery, {
    enabled: !staticData && isMovieSearch,
  });
  const animeSearchResult = useAnimeAndMangaSearch<MediaItem>(mediaType, searchQuery, {
    enabled: !staticData && isAnimeSearch,
  });
  const feedResult = useMediaFeed<MediaItem>(mediaType, metaProvider, mediaFeedType!, {
    enabled: !staticData && isFeed,
  });

  const activeResult = staticData
    ? { data: undefined, isLoading: false, error: null, refetch: () => {}, fetchNextPage: () => {}, hasNextPage: false }
    : isMovieSearch
      ? movieSearchResult
      : isAnimeSearch
        ? animeSearchResult
        : feedResult;

  const { data: dynamicData, isLoading, error, refetch, fetchNextPage, hasNextPage } = activeResult;

  const data = staticData || dynamicData;
  const filteredItems = useMemo(() => toCardItems(data), [data]);

  /*
  this is used in key to force re-render of flashlist when screen width changes,
   to fix layout issues on orientation change from /watch/[mediaType] screen
  */
  const grid = useCardGridDimensions();
  if (isLoading && !data) {
    return <CardSkeleton isLoading={isLoading} grid={grid} />;
  }

  if (error) {
    return (
      <HUYStack className="justify-center items-center">
        <NoResults />
        <Text className="text-sm text-center mt-2">Error: {error?.message}</Text>
      </HUYStack>
    );
  }

  return (
    <List<MediaItem>
      key={`${grid.screenWidth}-${mediaType}-${mediaFeedType}-${grid.numColumns}`}
      data={filteredItems}
      {...(emptyState && { ListEmptyComponent: emptyState })}
      renderItem={({ item, index }) => (
        <View style={{ width: grid.itemWidth, padding: grid.itemSpacing }}>
          <MediaCard
            item={item}
            index={index}
            mediaType={mediaType}
            metaProvider={metaProvider}
            isSearch={isSearch}
            // Search results must not pull TV focus away from the search input
            preferredFocus={!isSearch && index === 0}
            onPress={onItemPress}
          />
        </View>
      )}
      numColumns={grid.numColumns}
      keyExtractor={(item, index) => (item.id != null ? cardKey(item) : `fallback-${index}`)}
      contentContainerStyle={{ paddingHorizontal: grid.horizontalPadding, paddingVertical: grid.verticalPadding }}
      refreshControl={isTV ? undefined : <RefreshControl refreshing={!!isLoading} onRefresh={() => void refetch()} />}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onEndReached={() => {
        if (hasNextPage) {
          fetchNextPage?.();
        }
      }}
      onEndReachedThreshold={1.5}
      ListFooterComponent={
        hasNextPage ? (
          <HUXStack className="p-2 justify-center">
            <ActivityIndicator size="small" />
          </HUXStack>
        ) : (
          <View className="h-25" />
        )
      }
    />
  );
};

export default memo(CardList);
