import { ThemedView, NoResults } from '@/components/ui-primitives';
import { CardList } from '@/components/CardList';
import { HorizontalTabs } from '@/components/HorizontalTabs';
import { MediaType } from '@/constants/types';
import { useDownloadedOnlyFilter } from '@/downloads/useDownloadStore';
import { useFavoriteStore } from '@/hooks/stores/useFavoriteStore';
import { useUnwatchedCounts } from '@/hooks/queries/favoriteQueries';
import { infoTitle, MEDIA_TABS } from '@/utils/media';
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
  const tabItems = MEDIA_TABS.map(({ mediaType, label }) => ({
    key: mediaType,
    label,
    content: (
      <View testID="favorites-list" className="h-full">
        <CardList
          staticData={ofType(mediaType)}
          mediaType={mediaType}
          emptyState={EMPTY_FAVORITES}
          badges={unwatched}
        />
      </View>
    ),
  }));
  return (
    <ThemedView testID="favorites-screen">
      <HorizontalTabs items={tabItems} />
    </ThemedView>
  );
};

export default Favorites;
