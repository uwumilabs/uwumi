import React, { memo, useCallback, useMemo, useState } from 'react';
import { searchHref } from '@/utils/routes';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SearchField } from './heroui';
import { MediaType } from '@/constants/types';
import { mediaFeedKey, mediaFeeds } from '@/hooks/queries/mediaQueries';
import { mediaTypeLabel } from '@/utils/media';
import { isTV, tvFocusScrollProps, TV_SNAP_CENTER } from '@/utils/tv';
import { MediaCarousel } from './MediaCarousel';
import { ContinueWatchingRow, ContinueReadingRow } from './ContinueWatchingRow';
import { RippleButton, ThemedView } from './ui-primitives';
import { LazyTab } from './LazyTab';
import { PerfProfiler } from '@/perf/perfHarness';

interface MediaBrowserProps {
  mediaType: MediaType;
}

const FEED_TITLES = { trending: 'Trending', popular: 'Popular' } as const;

const MediaBrowserView: React.FC<MediaBrowserProps> = ({ mediaType }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const label = mediaTypeLabel(mediaType);

  const rows = useMemo(() => mediaFeeds(mediaType).map((feed) => ({ feed, title: FEED_TITLES[feed] })), [mediaType]);

  const openSearch = useCallback(() => {
    router.push(searchHref(mediaType));
  }, [router, mediaType]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all(rows.map(({ feed }) => queryClient.refetchQueries({ queryKey: mediaFeedKey(mediaType, feed) })));
    setRefreshing(false);
  }, [queryClient, rows, mediaType]);

  return (
    <ScrollView
      testID="home-feed"
      contentContainerClassName="gap-6 pb-32"
      showsVerticalScrollIndicator={false}
      {...tvFocusScrollProps(16)}
      refreshControl={isTV ? undefined : <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      {/* Looks like the search field but only opens the search screen, so the keyboard never opens here */}
      <View scrollSnapAlign={TV_SNAP_CENTER}>
        {/* No focus scale: it spans the screen, so growing would push it past the edges */}
        <RippleButton testID="home-search" onPress={openSearch} className="mx-3 mt-3 p-0 rounded-2xl" focusScale={1}>
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

      {mediaType === MediaType.MANGA ? <ContinueReadingRow /> : <ContinueWatchingRow mediaType={mediaType} />}

      {rows.map(({ feed, title }, index) => (
        <MediaCarousel
          key={feed}
          title={title}
          browseTitle={`${title} ${label}`}
          feed={feed}
          mediaType={mediaType}
          isFirstRow={index === 0}
        />
      ))}
    </ScrollView>
  );
};

const MediaBrowser = memo(MediaBrowserView);
MediaBrowser.displayName = 'MediaBrowser';

/** A home tab: its media type's rows, built the first time the tab opens */
export const MediaTabScreen = ({ name, mediaType }: { name: string; mediaType: MediaType }) => (
  <PerfProfiler id={`${name} tab`}>
    <ThemedView testID={`${name}-screen`}>
      <LazyTab>
        <MediaBrowser mediaType={mediaType} />
      </LazyTab>
    </ThemedView>
  </PerfProfiler>
);
