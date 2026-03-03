import React, { memo, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedCustomImage } from './CustomImage';
import { MediaFeedType, MediaType, MetaProvider } from '@/constants/types';
import { IAnimeResult, IMovieResult, ISearch } from 'react-native-consumet';
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from 'react-native';
import { isTV } from '@/constants/utils';
import { InfiniteData } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { HUXStack, HUYStack, NoResults } from './ui-primitives';
import { useAnimeAndMangaSearch, useMediaFeed, useMovieSearch, useSearchStore, useCurrentTheme } from '@/hooks';
import { useCardGridDimensions } from '@/hooks/useCardGridDimensions';
import { DEFAULT_PROVIDERS, useProviderStore } from '@/constants/provider';
import CustomFlashlist from './CustomFlashlist';
import { Card, SkeletonGroup } from 'heroui-native';

export interface CardListProps {
  staticData?: (IAnimeResult | IMovieResult)[] | undefined;
  mediaFeedType?: MediaFeedType;
  mediaType: MediaType;
  metaProvider: MetaProvider;
}

interface CardProps {
  item: IAnimeResult | IMovieResult;
  index: number;
  mediaType: MediaType;
  metaProvider: MetaProvider;
  isSearch?: boolean;
}

const AnimatedStyledCard = Animated.createAnimatedComponent(Card);
const AnimatedStyledCardTitle = Animated.createAnimatedComponent(Card.Title);

const CardSkeleton = ({ isLoading }: { isLoading: boolean }) => (
  <SkeletonGroup isLoading={isLoading}>
    <View className="flex-row flex-wrap px-2 gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <View key={i} className="flex-1 min-w-[30%] aspect-2/3">
          <SkeletonGroup.Item className="w-full h-full rounded-lg" />
        </View>
      ))}
    </View>
  </SkeletonGroup>
);

const CustomCard: React.FC<CardProps> = memo(({ item, index, mediaType, metaProvider, isSearch }) => {
  const currentProvider = useProviderStore((state) => state.providers[mediaType]);
  const currentTheme = useCurrentTheme();
  const router = useRouter();
  const provider = currentProvider;
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handlePress = useCallback(() => {
    router.push({
      pathname: '/info/[mediaType]',
      params: {
        mediaType: mediaType,
        metaProvider: metaProvider,
        type: item?.type,
        provider: (() => {
          switch (mediaType) {
            case MediaType.ANIME:
              return provider ?? DEFAULT_PROVIDERS.anime;
            case MediaType.MANGA:
              return provider ?? DEFAULT_PROVIDERS.manga;
            case MediaType.MOVIE:
              return provider ?? DEFAULT_PROVIDERS.movie;
            default:
              return provider ?? DEFAULT_PROVIDERS.anime;
          }
        })(),
        id: item.id,
        image: item.image,
        title: typeof item.title === 'string' ? item.title : item.title?.romaji || item.title?.english,
      },
    });
  }, [router, mediaType, metaProvider, item, provider]);

  return (
    <Pressable
      className={isTV ? 'p-0' : 'p-0 rounded-none'}
      focusable={isTV ? true : undefined}
      hasTVPreferredFocus={isTV && index === 0 ? true : undefined}
      onFocus={isTV ? handleFocus : undefined}
      onBlur={isTV ? handleBlur : undefined}
      onPress={handlePress}
      style={[
        // Always reserve space for the border + radius so focus doesn't cause layout jumps
        isTV && {
          borderWidth: 2,
          borderColor: 'transparent',
          borderRadius: 12,
          overflow: 'hidden' as const,
        },
        isTV &&
          isFocused && {
            borderColor: currentTheme?.accent,
            transform: [{ scale: 1.05 }],
          },
      ]}>
      <AnimatedStyledCard
        entering={!isSearch && index < 12 ? FadeInDown.delay(50 * index).duration(300) : undefined}
        className={`flex-1 w-full rounded-lg overflow-hidden p-0 ${isTV ? 'aspect-[2/3.2]' : 'aspect-2/3'}`}>
        <Card.Body className="w-full h-full p-0 relative">
          <AnimatedCustomImage
            source={{ uri: item.image }}
            style={{ borderRadius: 10, zIndex: 0 }}
            width="100%"
            height="100%"
            sharedTransitionTag={isSearch ? undefined : `shared-image-${item.id}`}
            className="absolute inset-0"
          />
          <LinearGradient
            className="w-full h-full absolute inset-0 z-10l"
            colors={['rgba(0,0,0,0.8)', 'transparent']}
            start={[0, 1]}
            end={[0, 0.3]}
            style={{ borderRadius: 10 }}
          />
          <AnimatedStyledCardTitle
            className="absolute bottom-0 left-0 right-0 z-20 py-2 px-2 text-sm font-medium m-0 text-white"
            numberOfLines={2}
            sharedTransitionTag={isSearch ? undefined : `shared-title-${item.id}`}
            ellipsizeMode="tail">
            {typeof item.title === 'string' ? item.title : item.title?.romaji || item.title?.english}
          </AnimatedStyledCardTitle>
        </Card.Body>
      </AnimatedStyledCard>
    </Pressable>
  );
});

export const CardList: React.FC<CardListProps> = ({ staticData, mediaFeedType, mediaType, metaProvider }) => {
  const debouncedQuery = useSearchStore((state) => state.debouncedQuery);

  const isSearch = mediaFeedType === 'search';
  const isMovieSearch = isSearch && mediaType === MediaType.MOVIE;
  const isAnimeSearch = isSearch && !isMovieSearch;
  const isFeed = !staticData && !isSearch;

  const movieSearchResult = useMovieSearch<IAnimeResult | IMovieResult>(mediaType, debouncedQuery, {
    enabled: !staticData && isMovieSearch,
  });
  const animeSearchResult = useAnimeAndMangaSearch<IAnimeResult | IMovieResult>(mediaType, debouncedQuery, {
    enabled: !staticData && isAnimeSearch,
  });
  const feedResult = useMediaFeed<IAnimeResult | IMovieResult>(mediaType, metaProvider, mediaFeedType!, {
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
  const isInfiniteData = (
    data: InfiniteData<ISearch<IAnimeResult | IMovieResult>> | (IAnimeResult | IMovieResult)[] | undefined,
  ): data is InfiniteData<ISearch<IAnimeResult | IMovieResult>> => {
    return !!data && 'pages' in data;
  };
  const getItems = useMemo(() => {
    if (!data) return [];
    if (isInfiniteData(data)) {
      return data.pages.flatMap((page) => (page.results ?? []) as (IAnimeResult | IMovieResult)[]);
    }
    return data;
  }, [data]);

  const filteredItems =
    getItems?.filter(
      (item) => item.image && !item.image.includes('/originalundefined') && !item.image.includes('/originalnull'),
    ) || [];

  /*
  this is used in key to force re-render of flashlist when screen width changes,
   to fix layout issues on orientation change from /watch/[mediaType] screen
  */
  const grid = useCardGridDimensions();
  if (isLoading && !data) {
    return <CardSkeleton isLoading={isLoading} />;
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
    <CustomFlashlist<IAnimeResult | IMovieResult>
      key={`${grid.screenWidth}-${mediaType}-${mediaFeedType}-${grid.numColumns}`}
      data={filteredItems}
      renderItem={({ item, index }) => (
        <View style={{ width: grid.itemWidth, padding: grid.itemSpacing }}>
          <CustomCard item={item} index={index} mediaType={mediaType} metaProvider={metaProvider} isSearch={isSearch} />
        </View>
      )}
      numColumns={grid.numColumns}
      keyExtractor={(item, index) => (item.id != null ? item.id.toString() : `fallback-${index}`)}
      contentContainerStyle={{ paddingHorizontal: grid.horizontalPadding, paddingVertical: grid.verticalPadding }}
      refreshControl={isTV ? undefined : <RefreshControl refreshing={!!isLoading} onRefresh={refetch} />}
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
