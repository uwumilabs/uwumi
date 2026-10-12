import React, { memo, useCallback, useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TvType } from 'react-native-consumet';
import { MediaType } from '@/constants/types';
import { isTV } from '@/constants/utils';
import { ContinueWatchingEntry, useContinueWatchingStore, useWatchProgressStore } from '@/hooks';
import Image from './Image';
import List from './List';
import Progress from './native/progress/Progress';
import TVFocusWrapper from './TVFocusWrapper';
import { HUYStack } from './ui-primitives';

const MAX_ITEMS = 10;
const ROW_PADDING = 12;
const ITEM_GAP = 8;
const CARDS_PER_SCREEN = isTV ? 3.5 : 1.6;
const THUMBNAIL_ASPECT = 9 / 16;
const CAPTION_HEIGHT = 44;

const ContinueWatchingCard = memo(({ entry, width }: { entry: ContinueWatchingEntry; width: number }) => {
  const router = useRouter();
  const progress = useWatchProgressStore((state) => state.progresses[entry.uniqueId]);
  const remove = useContinueWatchingStore((state) => state.remove);
  const { episodeNumber, seasonNumber, title: episodeTitle, poster, type } = entry.watchParams;
  const isCompleted = !!progress?.isCompleted;

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
  const minutesLeft =
    progress?.duration && !isCompleted
      ? Math.max(1, Math.round((progress.duration - progress.currentTime) / 60))
      : null;
  const caption = isCompleted ? 'Watched · next episode' : minutesLeft ? `${minutesLeft}m left` : episodeTitle;

  return (
    <TVFocusWrapper
      onPress={open}
      onLongPress={isTV ? undefined : removeFromRow}
      focusBorderRadius={12}
      style={{ width }}
      accessibilityHint="Long press to remove from Continue watching">
      <View className="overflow-hidden rounded-xl bg-default" style={{ width, height: width * THUMBNAIL_ASPECT }}>
        <Image source={poster || entry.showImage} style={{ width: '100%', height: '100%' }} />
        {!!episodeLabel && (
          <Text className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-black text-accent">
            {episodeLabel}
          </Text>
        )}
        {progress && !isCompleted && <Progress className="absolute inset-x-2 bottom-2" value={progress.progress} />}
      </View>
      <HUYStack className="pt-1.5">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {entry.showTitle || episodeTitle}
        </Text>
        {!!caption && (
          <Text className="text-xs text-foreground/60" numberOfLines={1}>
            {caption}
          </Text>
        )}
      </HUYStack>
    </TVFocusWrapper>
  );
});
ContinueWatchingCard.displayName = 'ContinueWatchingCard';

/** The latest episode of each show watched on this media type, most recent first. Hidden when there are none. */
export const ContinueWatchingRow = memo(({ mediaType }: { mediaType: MediaType }) => {
  const entries = useContinueWatchingStore((state) => state.entries);
  const progresses = useWatchProgressStore((state) => state.progresses);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - ROW_PADDING - ITEM_GAP * Math.floor(CARDS_PER_SCREEN)) / CARDS_PER_SCREEN;

  // Nothing left to continue after a finished movie or an anime's last episode
  const items = useMemo(
    () =>
      entries
        .filter(
          (entry) =>
            entry.mediaType === mediaType &&
            !(
              progresses[entry.uniqueId]?.isCompleted &&
              (entry.watchParams.type === TvType.MOVIE || entry.hasNextEpisode === false)
            ),
        )
        .slice(0, MAX_ITEMS),
    [entries, mediaType, progresses],
  );

  if (items.length === 0) return null;

  return (
    <View className="gap-2">
      <Text className="text-foreground text-lg font-semibold" style={{ paddingLeft: ROW_PADDING + 4 }}>
        Continue watching
      </Text>
      <View style={{ height: cardWidth * THUMBNAIL_ASPECT + CAPTION_HEIGHT }}>
        <List<ContinueWatchingEntry>
          horizontal
          data={items}
          keyExtractor={(entry) => entry.key}
          showsHorizontalScrollIndicator={false}
          scrollsToTop={false}
          contentContainerStyle={{ paddingHorizontal: ROW_PADDING }}
          ItemSeparatorComponent={() => <View style={{ width: ITEM_GAP }} />}
          ListFooterComponent={null}
          renderItem={({ item }) => <ContinueWatchingCard entry={item} width={cardWidth} />}
        />
      </View>
    </View>
  );
});
ContinueWatchingRow.displayName = 'ContinueWatchingRow';

export default ContinueWatchingRow;
