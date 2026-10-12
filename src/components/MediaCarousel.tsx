import React, { memo, useCallback, useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, SkeletonGroup } from 'heroui-native';
import { MediaFeedType, MediaType, MetaProvider } from '@/constants/types';
import { isTV } from '@/constants/utils';
import { useCurrentTheme, useMediaFeed } from '@/hooks';
import { MediaCard, MediaItem, cardKey, toCardItems } from './CardList';
import { HUXStack } from './ui-primitives';
import { IoniconsIcon } from './Icons';
import TVFocusWrapper from './TVFocusWrapper';
import CustomFlashlist from './CustomFlashlist';

const MAX_ITEMS = 10;
const ROW_PADDING = 12;
const ITEM_GAP = 8;
// A fractional count leaves part of the next card visible, which signals the row scrolls.
const CARDS_PER_SCREEN = isTV ? 6.5 : 3.3;
const CARD_ASPECT = isTV ? 3.2 / 2 : 3 / 2;
// TV: room for the focus ring's 1.05 scale, which the list would otherwise clip
const ROW_VERTICAL_PADDING = isTV ? 10 : 0;

interface MediaCarouselProps {
  title: string;
  /** Title of the full grid opened by "See more". */
  browseTitle: string;
  feed: Exclude<MediaFeedType, 'search'>;
  mediaType: MediaType;
  metaProvider: MetaProvider;
  /** TV: the first card of this row takes initial focus. */
  isFirstRow?: boolean;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = memo(
  ({ title, browseTitle, feed, mediaType, metaProvider, isFirstRow = false }) => {
    const router = useRouter();
    const currentTheme = useCurrentTheme();
    const { width: screenWidth } = useWindowDimensions();
    const cardWidth = (screenWidth - ROW_PADDING - ITEM_GAP * Math.floor(CARDS_PER_SCREEN)) / CARDS_PER_SCREEN;
    const rowHeight = cardWidth * CARD_ASPECT + ROW_VERTICAL_PADDING * 2;

    const { data, isLoading, error, refetch } = useMediaFeed<MediaItem>(mediaType, metaProvider, feed);
    const items = useMemo(() => toCardItems(data).slice(0, MAX_ITEMS), [data]);

    const openBrowse = useCallback(() => {
      router.push({ pathname: '/browse/[mediaType]', params: { mediaType, feed, metaProvider, title: browseTitle } });
    }, [router, mediaType, feed, metaProvider, browseTitle]);

    const renderBody = () => {
      if (isLoading && !data) {
        return (
          <SkeletonGroup isLoading animation={false}>
            <HUXStack className="overflow-hidden" props={{ style: { paddingLeft: ROW_PADDING, gap: ITEM_GAP } }}>
              {Array.from({ length: Math.ceil(CARDS_PER_SCREEN) }).map((_, i) => (
                <View key={i} style={{ width: cardWidth }} className={isTV ? 'aspect-[2/3.2]' : 'aspect-2/3'}>
                  <SkeletonGroup.Item className="w-full h-full rounded-lg" />
                </View>
              ))}
            </HUXStack>
          </SkeletonGroup>
        );
      }

      if (error) {
        return (
          <HUXStack className="items-center gap-2" props={{ style: { paddingHorizontal: ROW_PADDING } }}>
            <Text className="text-sm text-muted">Couldn't load {title.toLowerCase()}.</Text>
            <Button variant="ghost" size="sm" onPress={() => refetch()}>
              <Button.Label>Retry</Button.Label>
            </Button>
          </HUXStack>
        );
      }

      return (
        // CustomFlashlist fills its parent's height, so the row needs an explicit one
        <View style={{ height: rowHeight }}>
          <CustomFlashlist<MediaItem>
            horizontal
            data={items}
            keyExtractor={(item, index) => (item.id != null ? cardKey(item) : `fallback-${index}`)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: ROW_PADDING, paddingVertical: ROW_VERTICAL_PADDING }}
            // FlashList ignores `gap` in contentContainerStyle
            ItemSeparatorComponent={() => <View style={{ width: ITEM_GAP }} />}
            renderItem={({ item, index }) => (
              <View style={{ width: cardWidth, height: cardWidth * CARD_ASPECT }}>
                <MediaCard
                  item={item}
                  index={index}
                  mediaType={mediaType}
                  metaProvider={metaProvider}
                  preferredFocus={isFirstRow && index === 0}
                  animateEntry={false}
                  // The same title can sit in several rows; tags must stay unique on one screen
                  sharedTag={`${feed}-${item.id}`}
                />
              </View>
            )}
            // TV: the header link is hard to reach with a D-pad, so the row ends with a "See all" tile
            ListFooterComponent={
              isTV ? (
                <TVFocusWrapper onPress={openBrowse} style={{ width: cardWidth, marginLeft: ITEM_GAP }}>
                  <View
                    className="aspect-[2/3.2] rounded-lg items-center justify-center gap-2"
                    style={{ backgroundColor: currentTheme?.segment }}>
                    <IoniconsIcon name="arrow-forward" size={28} color={currentTheme?.foreground} />
                    <Text className="text-foreground font-semibold">See all</Text>
                  </View>
                </TVFocusWrapper>
              ) : null
            }
          />
        </View>
      );
    };

    if (!isLoading && !error && items.length === 0) return null;

    return (
      <View className="gap-2">
        <HUXStack className="items-center justify-between" props={{ style: { paddingLeft: ROW_PADDING + 4 } }}>
          <Text className="text-foreground text-lg font-semibold">{title}</Text>
          {!isTV && (
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
