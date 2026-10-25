import React, { memo, useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SearchField } from 'heroui-native';
import { MediaFeedType, MediaType, MetaProvider } from '@/constants/types';
import { isTV, tvFocusScrollProps, TV_SNAP_CENTER } from '@/constants/utils';
import MediaCarousel from './MediaCarousel';
import ContinueWatchingRow from './ContinueWatchingRow';
import { RippleButton } from './ui-primitives';

interface MediaBrowserProps {
  mediaType: MediaType;
}

type FeedRow = { feed: Exclude<MediaFeedType, 'search'>; title: string };

export const getMetaProvider = (mediaType: MediaType): MetaProvider =>
  mediaType === MediaType.ANIME ? 'anilist' : mediaType === MediaType.MANGA ? 'anilist-manga' : 'tmdb';

export const mediaTypeLabel = (mediaType: MediaType) =>
  mediaType === MediaType.ANIME ? 'Anime' : mediaType === MediaType.MANGA ? 'Manga' : 'Movies & TV';

export const MediaBrowser: React.FC<MediaBrowserProps> = ({ mediaType }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const metaProvider = getMetaProvider(mediaType);
  const label = mediaTypeLabel(mediaType);

  const rows = useMemo<FeedRow[]>(
    () =>
      // TMDB has no "popular" feed in useMediaFeed
      mediaType === MediaType.MOVIE
        ? [{ feed: 'trending', title: 'Trending' }]
        : [
            { feed: 'trending', title: 'Trending' },
            { feed: 'popular', title: 'Popular' },
          ],
    [mediaType],
  );

  const openSearch = useCallback(() => {
    router.push({ pathname: '/search/[mediaType]', params: { mediaType } });
  }, [router, mediaType]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all(
      rows.map(({ feed }) => queryClient.refetchQueries({ queryKey: [mediaType, feed, metaProvider] })),
    );
    setRefreshing(false);
  }, [queryClient, rows, mediaType, metaProvider]);

  return (
    <ScrollView
      contentContainerClassName="gap-6 pb-32"
      showsVerticalScrollIndicator={false}
      {...tvFocusScrollProps(16)}
      refreshControl={isTV ? undefined : <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      {/* Looks like the search field but only opens the search screen, so the keyboard never opens here */}
      <View scrollSnapAlign={TV_SNAP_CENTER}>
        {/* No focus scale: it spans the screen, so growing would push it past the edges */}
        <RippleButton onPress={openSearch} className="mx-3 mt-3 p-0 rounded-2xl" focusScale={1}>
          <View pointerEvents="none">
            <SearchField value="">
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input editable={false} focusable={false} placeholder={`Search ${label.toLowerCase()}`} />
              </SearchField.Group>
            </SearchField>
          </View>
        </RippleButton>
      </View>

      {mediaType !== MediaType.MANGA && <ContinueWatchingRow mediaType={mediaType} />}

      {rows.map(({ feed, title }, index) => (
        <MediaCarousel
          key={feed}
          title={title}
          browseTitle={`${title} ${label}`}
          feed={feed}
          mediaType={mediaType}
          metaProvider={metaProvider}
          isFirstRow={index === 0}
        />
      ))}
    </ScrollView>
  );
};

export default memo(MediaBrowser);
