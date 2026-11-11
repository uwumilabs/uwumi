import React, { memo, useCallback, useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { ROW, TVRow, rowCardWidth } from './TVRow';
import { useRouter } from 'expo-router';
import type { InfiniteData } from '@tanstack/react-query';
import type { ISearch } from 'react-native-consumet';
import { SkeletonGroup } from './heroui';
import { Button } from './Button';
import { MediaFeedType, MediaType } from '@/constants/types';
import { isTV, tvFocusScrollProps, TV_SNAP_CENTER } from '@/utils/tv';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { useMediaFeed } from '@/hooks/queries/mediaQueries';
import { CARD_ASPECT, CARD_ASPECT_CLASS, MediaCard, MediaItem, cardKey, toCardItems } from './CardList';
import { HUXStack } from './ui-primitives';
import { IoniconsIcon } from './Icons';
import TVFocusWrapper from './TVFocusWrapper';
import List from './List';

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
    const rowHeight = cardWidth * CARD_ASPECT + ROW.verticalPadding * 2;

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
      router.push({ pathname: '/browse/[mediaType]', params: { mediaType, feed, title: browseTitle } });
    }, [router, mediaType, feed, browseTitle]);

    const renderBody = () => {
      if (isLoading) {
        return (
          <SkeletonGroup isLoading animation={false}>
            <HUXStack className="overflow-hidden" style={{ paddingLeft: ROW.padding, gap: ROW.gap }}>
              {Array.from({ length: Math.ceil(CARDS_PER_SCREEN) }).map((_, i) => (
                <View key={i} style={{ width: cardWidth }} className={CARD_ASPECT_CLASS}>
                  <SkeletonGroup.Item className="w-full h-full rounded-lg" />
                </View>
              ))}
            </HUXStack>
          </SkeletonGroup>
        );
      }

      if (error) {
        return (
          <HUXStack className="items-center gap-2" style={{ paddingHorizontal: ROW.padding }}>
            <Text className="text-sm text-muted">Couldn't load {title.toLowerCase()}.</Text>
            <Button variant="ghost" size="sm" onPress={() => feedResult.refetch()}>
              <Button.Label>Retry</Button.Label>
            </Button>
          </HUXStack>
        );
      }

      return (
        // List fills its parent's height, so the row needs an explicit one
        <TVRow style={{ height: rowHeight }}>
          <List<MediaItem>
            horizontal
            data={items}
            keyExtractor={(item, index) => (item.id != null ? cardKey(item) : `fallback-${index}`)}
            showsHorizontalScrollIndicator={false}
            scrollsToTop={false}
            contentContainerStyle={{ paddingHorizontal: ROW.padding, paddingVertical: ROW.verticalPadding }}
            {...tvFocusScrollProps(ROW.padding)}
            // FlashList ignores `gap` in contentContainerStyle
            ItemSeparatorComponent={() => <View style={{ width: ROW.gap }} />}
            renderItem={({ item, index }) => (
              <View style={{ width: cardWidth, height: cardWidth * CARD_ASPECT }} scrollSnapAlign={TV_SNAP_CENTER}>
                <MediaCard
                  item={item}
                  index={index}
                  mediaType={mediaType}
                  preferredFocus={isFirstRow && index === 0}
                  animateEntry={false}
                  // The same title can sit in several rows; tags must stay unique on one screen
                  sharedTag={`${tagPrefix}-${item.id}`}
                />
              </View>
            )}
            // TV: the header link is hard to reach with a D-pad, so the row ends with a "See all" tile
            ListFooterComponent={
              isTV && canBrowse ? (
                <TVFocusWrapper onPress={openBrowse} style={{ width: cardWidth, marginLeft: ROW.gap }}>
                  <View
                    className="aspect-[2/3.2] rounded-[10px] items-center justify-center gap-2"
                    style={{ backgroundColor: currentTheme?.segment }}>
                    <IoniconsIcon name="arrow-forward" size={28} color={currentTheme?.foreground} />
                    <Text className="text-foreground font-semibold">See all</Text>
                  </View>
                </TVFocusWrapper>
              ) : null
            }
          />
        </TVRow>
      );
    };

    if (!isLoading && !error && items.length === 0) return null;

    return (
      <View className="gap-2" scrollSnapAlign={TV_SNAP_CENTER}>
        <HUXStack className="items-center justify-between" style={{ paddingLeft: ROW.padding + 4 }}>
          <Text className="text-foreground text-lg font-semibold">{title}</Text>
          {!isTV && canBrowse && (
            <Button variant="ghost" size="sm" onPress={openBrowse}>
              <Button.Label>See more</Button.Label>
              <IoniconsIcon name="chevron-forward" size={16} color={currentTheme?.defaultForeground} />
            </Button>
          )}
        </HUXStack>
        {renderBody()}
      </View>
    );
  },
);

MediaCarousel.displayName = 'MediaCarousel';

export default MediaCarousel;
