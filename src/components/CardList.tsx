/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/display-name */
import React, { memo, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedCustomImage } from './CustomImage';
import { MediaFeedType, MediaType, MetaProvider } from '@/constants/types';
import { IAnimeResult, IMovieResult, ISearch } from 'react-native-consumet';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import { InfiniteData } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { HUXStack, HUYStack, NoResults, RippleButton } from './ui-primitives';
import { useAnimeAndMangaSearch, useMediaFeed, useMovieSearch, useSearchStore } from '@/hooks';
import { DEFAULT_PROVIDERS, useProviderStore } from '@/constants/provider';
import CustomFlashlist from './CustomFlashlist';
import { Card } from 'heroui-native';

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
}

// const StyledCard = styled(Card, {
//   width: '100%',
//   aspectRatio: 2 / 3,
//   variants: { isHovered: { true: { scale: 0.95, borderColor: '$color' } } },
// });

const AnimatedStyledCard = Animated.createAnimatedComponent(Card);

const CustomCard: React.FC<CardProps> = memo(({ item, index, mediaType, metaProvider }) => {
  const { getProvider } = useProviderStore();
  const router = useRouter();
  const provider = getProvider(mediaType);
  return (
    item.image &&
    !item.image.includes('/originalundefined') &&
    !item.image.includes('/originalnull') && (
      <RippleButton
        className="p-0 rounded-none"
        onPress={() => {
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
            },
          });
        }}>
        <AnimatedStyledCard
          entering={FadeInDown.delay(50 * index)}
          className="flex-1 w-full aspect-2/3 rounded-lg overflow-hidden p-0">
          <Card.Body className="w-full h-full p-0 relative">
            <AnimatedCustomImage
              source={{ uri: item.image }}
              style={{ borderRadius: 10, zIndex: 0 }}
              width="100%"
              height="100%"
              sharedTransitionTag="shared-image"
              className="absolute inset-0"
            />
            <LinearGradient
              className="w-full h-full absolute inset-0 z-10l"
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              start={[0, 1]}
              end={[0, 0.3]}
              style={{ borderRadius: 10 }}
            />
            <Card.Title
              className="absolute bottom-0 left-0 right-0 z-20 py-2 px-2 text-sm font-medium m-0 text-white"
              numberOfLines={2}
              ellipsizeMode="tail">
              {typeof item.title === 'string' ? item.title : item.title?.romaji || item.title?.english}
            </Card.Title>
          </Card.Body>
        </AnimatedStyledCard>
      </RippleButton>
    )
  );
});

export const CardList: React.FC<CardListProps> = ({ staticData, mediaFeedType, mediaType, metaProvider }) => {
  const debouncedQuery = useSearchStore((state) => state.debouncedQuery);

  const {
    data: dynamicData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = staticData
    ? { data: undefined, isLoading: false, error: null, refetch: () => {}, fetchNextPage: () => {}, hasNextPage: false }
    : mediaFeedType === 'search' && mediaType === MediaType.MOVIE
      ? useMovieSearch<IAnimeResult | IMovieResult>(mediaType, debouncedQuery)
      : mediaFeedType === 'search'
        ? useAnimeAndMangaSearch<IAnimeResult | IMovieResult>(mediaType, debouncedQuery)
        : useMediaFeed<IAnimeResult | IMovieResult>(mediaType, metaProvider, mediaFeedType!);

  const data = staticData || dynamicData;
  const isInfiniteData = (
    data: InfiniteData<ISearch<IAnimeResult | IMovieResult>> | (IAnimeResult | IMovieResult)[] | undefined,
  ): data is InfiniteData<ISearch<IAnimeResult | IMovieResult>> => {
    return !!data && 'pages' in data;
  };
  const getItems = useMemo(() => {
    if (!data) return [];
    if (isInfiniteData(data)) {
      return data.pages.flatMap((page) => page.results as (IAnimeResult | IMovieResult)[]);
    }
    return data;
  }, [data]);
  // console.log(getItems, 'data cardlist');

  if (isLoading && !data) {
    return (
      <HUXStack className="p-2 justify-center">
        <ActivityIndicator size="large" color="$color" />
      </HUXStack>
    );
  }

  if (error) {
    //console.log(error);
    return (
      <HUYStack className="justify-center items-center">
        <NoResults />
        <Text className="text-sm text-center mt-2">Error: {error?.message}</Text>
      </HUYStack>
    );
  }

  return (
    <CustomFlashlist<IAnimeResult | IMovieResult>
      data={
        getItems?.filter(
          (item) => item.image && !item.image.includes('/originalundefined') && !item.image.includes('/originalnull'),
        ) || []
      }
      renderItem={({ item, index }) => (
        <View className="flex-1 p-1">
          <CustomCard item={item} index={index} mediaType={mediaType} metaProvider={metaProvider} />
        </View>
      )}
      numColumns={3}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 4 }}
      refreshControl={<RefreshControl refreshing={!!isLoading} onRefresh={refetch} />}
      onEndReached={() => {
        if (hasNextPage) {
          fetchNextPage?.();
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        hasNextPage ? (
          <HUXStack className="p-2 justify-center">
            <ActivityIndicator size="small" color="$color" />
          </HUXStack>
        ) : (
          <View className="h-25" />
        )
      }
    />
  );
};

export default memo(CardList);
