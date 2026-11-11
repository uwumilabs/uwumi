import { ThemedView, NoResults } from '@/components/ui-primitives';
import { CardList } from '@/components/CardList';
import { HorizontalTabs } from '@/components/HorizontalTabs';
import { MediaType } from '@/constants/types';
import { useDownloadedOnlyFilter } from '@/downloads/useDownloadStore';
import { useFavoriteStore } from '@/hooks/stores/useFavoriteStore';
import { useUnwatchedCounts } from '@/hooks/queries/favoriteQueries';
import { infoTitle } from '@/utils/media';
import React from 'react';
import { View } from 'react-native';

const EMPTY_FAVORITES = <NoResults title="No favorites yet" hint="Use the heart on a show's page to save it here" />;

const Favorites = () => {
  const favorites = useFavoriteStore((state) => state.favorites);
  const unwatched = useUnwatchedCounts(favorites);
  const downloadedOnly = useDownloadedOnlyFilter();
  // Manga has no downloads, so "Downloaded only" leaves it alone
  const ofType = (mediaType: MediaType) =>
    favorites.filter(
      (item) =>
        item.mediaType === mediaType &&
        (mediaType === MediaType.MANGA || !downloadedOnly || downloadedOnly(String(item.id), infoTitle(item))),
    );
  const tabItems = [
    {
      key: 'tab1',
      label: 'Anime',
      content: (
        <View className="h-full">
          <CardList
            staticData={ofType(MediaType.ANIME)}
            mediaType={MediaType.ANIME}
            emptyState={EMPTY_FAVORITES}
            badges={unwatched}
          />
        </View>
      ),
    },
    {
      key: 'tab2',
      label: 'Manga',
      content: (
        <View className="h-full">
          <CardList staticData={ofType(MediaType.MANGA)} mediaType={MediaType.MANGA} emptyState={EMPTY_FAVORITES} />
        </View>
      ),
    },
    {
      key: 'tab3',
      label: 'Movie',
      content: (
        <View className="h-full">
          <CardList
            staticData={ofType(MediaType.MOVIE)}
            mediaType={MediaType.MOVIE}
            emptyState={EMPTY_FAVORITES}
            badges={unwatched}
          />
        </View>
      ),
    },
  ];
  return (
    <ThemedView>
      <HorizontalTabs items={tabItems} initialTab="tab1" />
    </ThemedView>
  );
};

export default Favorites;
