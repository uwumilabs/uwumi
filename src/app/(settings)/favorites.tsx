import { ThemedView, CardList, HorizontalTabs, NoResults } from '@/components';
import { MediaType } from '@/constants/types';
import { useFavoriteStore } from '@/hooks';
import React from 'react';
import { View } from 'react-native';

const EMPTY_FAVORITES = <NoResults title="No favorites yet" hint="Use the heart on a show's page to save it here" />;

const Favorites = () => {
  const { favorites } = useFavoriteStore();
  // console.log(favorites);
  const tabItems = [
    {
      key: 'tab1',
      label: 'Anime',
      content: (
        <View className="h-full">
          <CardList
            staticData={favorites.filter((item) => item.mediaType === MediaType.ANIME)}
            mediaType={MediaType.ANIME}
            metaProvider="anilist"
            emptyState={EMPTY_FAVORITES}
          />
        </View>
      ),
    },
    {
      key: 'tab2',
      label: 'Manga',
      content: (
        <View className="h-full">
          <CardList
            staticData={favorites.filter((item) => item.mediaType === MediaType.MANGA)}
            mediaType={MediaType.MANGA}
            metaProvider="anilist-manga"
            emptyState={EMPTY_FAVORITES}
          />
        </View>
      ),
    },
    {
      key: 'tab3',
      label: 'Movie',
      content: (
        <View className="h-full">
          <CardList
            staticData={favorites.filter((item) => item.mediaType === MediaType.MOVIE)}
            mediaType={MediaType.MOVIE}
            metaProvider="tmdb"
            emptyState={EMPTY_FAVORITES}
          />
        </View>
      ),
    },
  ];
  return <ThemedView>{favorites && <HorizontalTabs items={tabItems} initialTab="tab1" />}</ThemedView>;
};

export default Favorites;
