import { ThemedView, CardList, HorizontalTabs } from '@/components';
import { MediaType } from '@/constants/types';
import { useFavoriteStore } from '@/hooks';
import React from 'react';
import { View } from 'react-native';

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
          />
        </View>
      ),
    },
    {
      key: 'tab2',
      label: 'Manga',
      content: (
        <View height="100%">
          <CardList
            staticData={favorites.filter((item) => item.mediaType === MediaType.MANGA)}
            mediaType={MediaType.MANGA}
            metaProvider="anilist-manga"
          />
        </View>
      ),
    },
    {
      key: 'tab3',
      label: 'Movie',
      content: (
        <View height="100%">
          <CardList
            staticData={favorites.filter((item) => item.mediaType === MediaType.MOVIE)}
            mediaType={MediaType.MOVIE}
            metaProvider="tmdb"
          />
        </View>
      ),
    },
  ];
  return <ThemedView>{favorites && <HorizontalTabs items={tabItems} initialTab="tab1" />}</ThemedView>;
};

export default Favorites;
