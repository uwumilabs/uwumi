/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/display-name */
import React, { memo, useMemo } from 'react';
import { Text, Card, ZStack, styled, XStack, Spinner, YStack, View } from 'tamagui';
import { Link } from 'expo-router';
import { LinearGradient } from 'tamagui/linear-gradient';
import { AnimatedCustomImage } from './CustomImage';
import { MediaFeedType, MediaType, MetaProvider } from '@/constants/types';
import { IAnimeResult, IMovieResult, ISearch } from 'react-native-consumet';
import { RefreshControl } from 'react-native';
import { InfiniteData } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NoResults } from './ui-primitives';
import { useAnimeAndMangaSearch, useMediaFeed, useMovieSearch, useSearchStore } from '@/hooks';
import { DEFAULT_PROVIDERS, useProviderStore } from '@/constants/provider';
import CustomFlashlist from './CustomFlashlist';

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

const StyledCard = styled(Card, {
  width: '100%',
  aspectRatio: 2 / 3,
  variants: { isHovered: { true: { scale: 0.95, borderColor: '$color' } } },
});

const AnimatedStyledCard = Animated.createAnimatedComponent(StyledCard);

const CustomCard: React.FC<CardProps> = memo(({ item, index, mediaType, metaProvider }) => {
  const { getProvider } = useProviderStore();
  const provider = getProvider(mediaType);
  return (
    item.image &&
    !item.image.includes('/originalundefined') &&
    !item.image.includes('/originalnull') && (
      <Link
        asChild
        href={{
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
        }}>
        <AnimatedStyledCard entering={FadeInDown.delay(50 * index)} flex={1} elevate animation="bouncy">
          <Card.Footer paddingVertical="$2" paddingHorizontal="$2">
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              fontSize="$3"
              fontWeight="500"
              margin={0}
              // width={100}
              color="#ffffff">
              {typeof item.title === 'string' ? item.title : item.title?.romaji || item.title?.english}
            </Text>
          </Card.Footer>
          <Card.Background>
            <ZStack width="100%" height="100%" alignItems="center">
              <AnimatedCustomImage
                source={{ uri: item.image }}
                style={{ borderRadius: 10 }}
                width="100%"
                height="100%"
                sharedTransitionTag="shared-image"
              />
              <LinearGradient
                width="100%"
                height="100%"
                colors={['rgba(0,0,0,0.8)', 'transparent']}
                start={[0, 1]}
                end={[0, 0.3]}
                borderRadius={10}
                opacity={0.9}
              />
            </ZStack>
          </Card.Background>
        </AnimatedStyledCard>
      </Link>
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
      <XStack padding="$4" justifyContent="center">
        <Spinner size="large" color="$color" />
      </XStack>
    );
  }

  if (error) {
    //console.log(error);
    return (
      <YStack justifyContent="center" alignItems="center">
        <NoResults />
        <Text fontSize="$4" color="$color4" textAlign="center" marginTop="$4">
          Error: {error?.message}
        </Text>
      </YStack>
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
        <View flex={1} paddingVertical={4} paddingHorizontal={4}>
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
          <XStack padding="$4" justifyContent="center">
            <Spinner size="small" color="$color" />
          </XStack>
        ) : (
          <View height={100} />
        )
      }
    />
  );
};

export default memo(CardList);
