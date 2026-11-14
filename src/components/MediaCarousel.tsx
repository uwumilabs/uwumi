import React, { memo, useCallback, useMemo } from 'react';
import { browseHref } from '@/utils/routes';
import { Text, View, useWindowDimensions } from 'react-native';
import { CardRow, ROW, rowCardWidth } from './TVRow';
import { useRouter } from 'expo-router';
import type { InfiniteData } from '@tanstack/react-query';
import type { ISearch } from 'react-native-consumet';
import { SkeletonGroup } from './heroui';
import { Button } from './Button';
import { MediaFeedType, MediaType } from '@/constants/types';
import { isTV } from '@/utils/tv';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { useMediaFeed } from '@/hooks/queries/mediaQueries';
import { CARD_ASPECT, CARD_ASPECT_CLASS, CARD_RADIUS, MediaCard, cardKey, toCardItems } from './CardList';
import type { MediaItem } from '@/utils/media';
import { HUXStack } from './ui-primitives';
import { IoniconsIcon } from './Icons';
import TVFocusWrapper from './TVFocusWrapper';

// Only the first page, which keeps its reference as Browse loads more pages of the same feed, so the row skips those
const firstPage = (data: InfiniteData<ISearch<MediaItem>, number>) => data.pages[0];
const CARDS_PER_SCREEN = isTV ? 6.5 : 3.3;

interface MediaCarouselProps {
  title: string;
  mediaType: MediaType;
  feed?: Exclude<MediaFeedType, 'search'>;
  browseTitle?: string;
  items?: MediaItem[];
  isFirstRow?: boolean;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = memo(
  ({ title, browseTitle, feed, items: staticItems, mediaType, isFirstRow = false }) => {
    const router = useRouter();
    const currentTheme = useCurrentTheme();
    const { width: screenWidth } = useWindowDimensions();
    const cardWidth = rowCardWidth(screenWidth, CARDS_PER_SCREEN);

    const isStatic = staticItems !== undefined;
    const canBrowse = !isStatic && !!feed && !!browseTitle;
    const tagPrefix = isStatic ? 'similar' : feed;

    const feedResult = useMediaFeed<MediaItem, ISearch<MediaItem>>(mediaType, feed ?? 'trending', {
      enabled: !isStatic && !!feed,
      select: firstPage,
    });
    const isLoading = !isStatic && feedResult.isLoading && !feedResult.data;
    const error = isStatic ? null : feedResult.error;
    const items = useMemo(
      () => (isStatic ? toCardItems(staticItems) : toCardItems(feedResult.data?.results).slice(0, ROW.maxItems)),
      [isStatic, staticItems, feedResult.data],
    );

    const openBrowse = useCallback(() => {
      if (feed && browseTitle) router.push(browseHref({ mediaType, feed, title: browseTitle }));
    }, [router, mediaType, feed, browseTitle]);

    const placeholder = isLoading ? (
      <SkeletonGroup isLoading animation={false}>
        <HUXStack className="overflow-hidden" style={{ paddingLeft: ROW.padding, gap: ROW.gap }}>
          {Array.from({ length: Math.ceil(CARDS_PER_SCREEN) }).map((_, i) => (
            <View key={i} style={{ width: cardWidth }} className={CARD_ASPECT_CLASS}>
              <SkeletonGroup.Item className="w-full h-full rounded-lg" />
            </View>
          ))}
        </HUXStack>
      </SkeletonGroup>
    ) : error ? (
      <HUXStack className="items-center gap-2" style={{ paddingHorizontal: ROW.padding }}>
        <Text className="text-sm text-muted">Couldn't load {title.toLowerCase()}.</Text>
        <Button testID="feed-retry" variant="ghost" size="sm" onPress={() => feedResult.refetch()}>
          <Button.Label>Retry</Button.Label>
        </Button>
      </HUXStack>
    ) : undefined;

    if (!placeholder && items.length === 0) return null;

    return (
      <CardRow<MediaItem>
        testID="feed-row"
        title={title}
        action={
          !isTV &&
          canBrowse && (
            <Button testID="feed-see-more" variant="ghost" size="sm" onPress={openBrowse}>
              <Button.Label>See more</Button.Label>
              <IoniconsIcon name="chevron-forward" size={16} color={currentTheme.defaultForeground} />
            </Button>
          )
        }
        placeholder={placeholder}
        cardHeight={cardWidth * CARD_ASPECT}
        items={items}
        keyExtractor={(item, index) => (item.id != null ? cardKey(item) : `fallback-${index}`)}
        itemStyle={{ width: cardWidth, height: cardWidth * CARD_ASPECT }}
        renderItem={(item, index) => (
          <MediaCard
            item={item}
            index={index}
            mediaType={mediaType}
            preferredFocus={isFirstRow && index === 0}
            animateEntry={false}
            // The same title can sit in several rows; tags must stay unique on one screen
            sharedTag={`${tagPrefix}-${item.id}`}
          />
        )}
        // TV: the header link is hard to reach with a D-pad, so the row ends with a "See all" tile
        footer={
          isTV && canBrowse ? (
            <TVFocusWrapper
              testID="feed-see-more"
              onPress={openBrowse}
              style={{ width: cardWidth, marginLeft: ROW.gap }}>
              <View
                className={`${CARD_ASPECT_CLASS} items-center justify-center gap-2`}
                style={{ borderRadius: CARD_RADIUS, backgroundColor: currentTheme.segment }}>
                <IoniconsIcon name="arrow-forward" size={28} color={currentTheme.foreground} />
                <Text className="text-foreground font-semibold">See all</Text>
              </View>
            </TVFocusWrapper>
          ) : null
        }
      />
    );
  },
);

MediaCarousel.displayName = 'MediaCarousel';
