import { useShallow } from 'zustand/react/shallow';
import React, { memo, useCallback, useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { TVRow } from './TVRow';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TvType } from 'react-native-consumet';
import { MediaType } from '@/constants/types';
import { isTV, tvFocusScrollProps, TV_SNAP_CENTER } from '@/constants/utils';
import { ContinueWatchingEntry, useContinueWatchingStore, useWatchProgressStore } from '@/hooks';
import Image from './Image';
import List from './List';
import Progress from './native/progress/Progress';
import TVFocusWrapper from './TVFocusWrapper';
import { HUYStack } from './ui-primitives';

const MAX_ITEMS = 10;
const ROW_PADDING = 12;
// Room above and below for the TV focus ring's scale, which the horizontal list would clip
const ROW_VERTICAL_PADDING = isTV ? 10 : 0;
const ITEM_GAP = 8;
const CARDS_PER_SCREEN = isTV ? 3.5 : 1.6;
const THUMBNAIL_ASPECT = 9 / 16;
const CAPTION_HEIGHT = 44;

const ContinueWatchingCard = memo(({ entry, width }: { entry: ContinueWatchingEntry; width: number }) => {
  const router = useRouter();
  // What the card shows, rounded, so the saves every 5 s while watching only re-render it when that changes
  const { hasProgress, isCompleted, percent, minutesLeft } = useWatchProgressStore(
    useShallow((state) => {
      const progress = state.progresses[entry.uniqueId];
      return {
        hasProgress: !!progress,
        isCompleted: !!progress?.isCompleted,
        percent: Math.round(progress?.progress ?? 0),
        minutesLeft:
          progress?.duration && !progress.isCompleted
            ? Math.max(1, Math.round((progress.duration - progress.currentTime) / 60))
            : null,
      };
    }),
  );
  const remove = useContinueWatchingStore((state) => state.remove);
  const { episodeNumber, seasonNumber, title: episodeTitle, poster, type } = entry.watchParams;

  // A finished episode opens the show, where "Continue" points at the next one
  const open = useCallback(() => {
    router.push(
      isCompleted
        ? { pathname: '/info/[mediaType]', params: { ...entry.infoParams, mediaType: entry.mediaType } }
        : { pathname: '/watch/[mediaType]', params: { ...entry.watchParams, mediaType: entry.mediaType } },
    );
  }, [router, isCompleted, entry]);

  const removeFromRow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    remove(entry.key);
  }, [remove, entry.key]);

  const episodeLabel =
    type === TvType.MOVIE
      ? 'Movie'
      : [seasonNumber && `S${seasonNumber}`, episodeNumber && `EP ${episodeNumber}`].filter(Boolean).join(' · ');
  const caption = isCompleted ? 'Watched · next episode' : minutesLeft ? `${minutesLeft}m left` : episodeTitle;

  const title = entry.showTitle || episodeTitle;

  // Fills the wrapper rather than `width`, so on TV it sits inside the focus ring's border instead of covering it
  const thumbnail = (
    <View
      className="overflow-hidden rounded-xl bg-default"
      style={{ width: '100%', aspectRatio: 1 / THUMBNAIL_ASPECT }}>
      <Image source={poster || entry.showImage} style={{ width: '100%', height: '100%' }} />
      {!!episodeLabel && (
        <Text className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-black text-accent">
          {episodeLabel}
        </Text>
      )}
      {hasProgress && !isCompleted && <Progress className="absolute inset-x-2 bottom-2" value={percent} />}
    </View>
  );
  const details = (
    <HUYStack className="pt-1.5">
      <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
        {title}
      </Text>
      {!!caption && (
        <Text className="text-xs text-foreground/60" numberOfLines={1}>
          {caption}
        </Text>
      )}
    </HUYStack>
  );
  const pressProps = {
    onPress: open,
    onLongPress: removeFromRow,
    accessibilityHint: 'Long press to remove from Continue watching',
  };

  // TV: only the thumbnail takes focus, so the ring and scale wrap the picture and the text stays below it
  return isTV ? (
    <View style={{ width }}>
      <TVFocusWrapper {...pressProps} focusBorderRadius={12} accessibilityLabel={title}>
        {thumbnail}
      </TVFocusWrapper>
      {details}
    </View>
  ) : (
    <TVFocusWrapper {...pressProps} style={{ width }}>
      {thumbnail}
      {details}
    </TVFocusWrapper>
  );
});
ContinueWatchingCard.displayName = 'ContinueWatchingCard';

/** The latest episode of each show watched on this media type, most recent first. Hidden when there are none. */
export const ContinueWatchingRow = memo(({ mediaType }: { mediaType: MediaType }) => {
  const entries = useContinueWatchingStore((state) => state.entries);
  // Only which entries are finished, so the progress saves while watching don't re-render the row
  const finishedKey = useWatchProgressStore((state) =>
    entries
      .filter((entry) => state.progresses[entry.uniqueId]?.isCompleted)
      .map((entry) => entry.uniqueId)
      .join('|'),
  );
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - ROW_PADDING - ITEM_GAP * Math.floor(CARDS_PER_SCREEN)) / CARDS_PER_SCREEN;

  // Nothing left to continue after a finished movie or an anime's last episode
  const items = useMemo(() => {
    const finished = new Set(finishedKey.split('|'));
    return entries
      .filter(
        (entry) =>
          entry.mediaType === mediaType &&
          !(
            finished.has(entry.uniqueId) &&
            (entry.watchParams.type === TvType.MOVIE || entry.hasNextEpisode === false)
          ),
      )
      .slice(0, MAX_ITEMS);
  }, [entries, mediaType, finishedKey]);

  if (items.length === 0) return null;

  return (
    <View className="gap-2" scrollSnapAlign={TV_SNAP_CENTER}>
      <Text className="text-foreground text-lg font-semibold" style={{ paddingLeft: ROW_PADDING + 4 }}>
        Continue watching
      </Text>
      <TVRow style={{ height: cardWidth * THUMBNAIL_ASPECT + CAPTION_HEIGHT + ROW_VERTICAL_PADDING * 2 }}>
        <List<ContinueWatchingEntry>
          horizontal
          data={items}
          keyExtractor={(entry) => entry.key}
          showsHorizontalScrollIndicator={false}
          scrollsToTop={false}
          contentContainerStyle={{ paddingHorizontal: ROW_PADDING, paddingVertical: ROW_VERTICAL_PADDING }}
          {...tvFocusScrollProps(ROW_PADDING)}
          ItemSeparatorComponent={() => <View style={{ width: ITEM_GAP }} />}
          ListFooterComponent={null}
          renderItem={({ item }) => (
            <View scrollSnapAlign={TV_SNAP_CENTER}>
              <ContinueWatchingCard entry={item} width={cardWidth} />
            </View>
          )}
        />
      </TVRow>
    </View>
  );
});
ContinueWatchingRow.displayName = 'ContinueWatchingRow';

export default ContinueWatchingRow;
