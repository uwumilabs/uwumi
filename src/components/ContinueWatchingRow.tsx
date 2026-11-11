import { useShallow } from 'zustand/react/shallow';
import {
  continueWatchingEpisodeLabel,
  mangaPageLabel,
  openContinueWatchingEntry,
  openMangaProgress,
  useMangaHistory,
  type MangaHistoryEntry,
} from '@/hooks/useHistory';
import React, { memo, useCallback, useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { ROW, TVRow, rowCardWidth } from './TVRow';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TvType } from 'react-native-consumet';
import { MediaType } from '@/constants/types';
import { isTV, tvFocusScrollProps, TV_SNAP_CENTER } from '@/utils/tv';
import { ContinueWatchingEntry, useContinueWatchingStore } from '@/hooks/stores/useContinueWatchingStore';
import { resumePage, useMangaProgressStore } from '@/hooks/stores/useMangaProgressStore';
import { useDownloadedOnlyFilter } from '@/downloads/useDownloadStore';
import { useWatchProgressStore } from '@/hooks/stores/useWatchProgressStore';
import Image from './Image';
import List from './List';
import Progress from './native/progress/Progress';
import TVFocusWrapper from './TVFocusWrapper';
import { HUYStack } from './ui-primitives';

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
  const { title: episodeTitle, poster } = entry.watchParams;

  const open = useCallback(() => openContinueWatchingEntry(router, entry, isCompleted), [router, isCompleted, entry]);

  const removeFromRow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    remove(entry.key);
  }, [remove, entry.key]);

  const episodeLabel = continueWatchingEpisodeLabel(entry);
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
  const downloadedOnly = useDownloadedOnlyFilter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = rowCardWidth(screenWidth, CARDS_PER_SCREEN);

  // Nothing left to continue after a finished movie or an anime's last episode
  const items = useMemo(() => {
    const finished = new Set(finishedKey.split('|'));
    return entries
      .filter(
        (entry) =>
          entry.mediaType === mediaType &&
          (!downloadedOnly || downloadedOnly(entry.showId, entry.showTitle)) &&
          !(
            finished.has(entry.uniqueId) &&
            (entry.watchParams.type === TvType.MOVIE || entry.hasNextEpisode === false)
          ),
      )
      .slice(0, ROW.maxItems);
  }, [entries, mediaType, finishedKey, downloadedOnly]);

  if (items.length === 0) return null;

  return (
    <View className="gap-2" scrollSnapAlign={TV_SNAP_CENTER}>
      <Text className="text-foreground text-lg font-semibold" style={{ paddingLeft: ROW.padding + 4 }}>
        Continue watching
      </Text>
      <TVRow style={{ height: cardWidth * THUMBNAIL_ASPECT + CAPTION_HEIGHT + ROW.verticalPadding * 2 }}>
        <List<ContinueWatchingEntry>
          horizontal
          data={items}
          keyExtractor={(entry) => entry.key}
          showsHorizontalScrollIndicator={false}
          scrollsToTop={false}
          contentContainerStyle={{ paddingHorizontal: ROW.padding, paddingVertical: ROW.verticalPadding }}
          {...tvFocusScrollProps(ROW.padding)}
          ItemSeparatorComponent={() => <View style={{ width: ROW.gap }} />}
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

// Manga covers are portrait, so more of them fit across
const MANGA_CARDS_PER_SCREEN = isTV ? 6.5 : 3.2;
const COVER_ASPECT = 3 / 2;

const ContinueReadingCard = memo(({ entry, width }: { entry: MangaHistoryEntry; width: number }) => {
  const router = useRouter();
  const hide = useMangaProgressStore((state) => state.hide);
  const { progress } = entry;
  const page = resumePage(progress, progress.lastChapterId);
  const percent = page > 1 && progress.pageCount ? (page / progress.pageCount) * 100 : 0;

  const open = useCallback(() => openMangaProgress(router, entry), [router, entry]);
  const removeFromRow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    hide(entry.key);
  }, [hide, entry.key]);

  const cover = (
    <View className="overflow-hidden rounded-xl bg-default" style={{ width: '100%', aspectRatio: 1 / COVER_ASPECT }}>
      <Image source={progress.image} style={{ width: '100%', height: '100%' }} />
      {percent > 0 && <Progress className="absolute inset-x-2 bottom-2" value={percent} />}
    </View>
  );
  const details = (
    <HUYStack className="pt-1.5">
      <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
        {progress.title}
      </Text>
      <Text className="text-xs text-foreground/60" numberOfLines={1}>
        {mangaPageLabel(progress) ?? progress.lastChapterTitle}
      </Text>
    </HUYStack>
  );
  const pressProps = {
    onPress: open,
    onLongPress: removeFromRow,
    accessibilityHint: 'Long press to remove from Continue reading',
  };

  return isTV ? (
    <View style={{ width }}>
      <TVFocusWrapper {...pressProps} focusBorderRadius={12} accessibilityLabel={progress.title}>
        {cover}
      </TVFocusWrapper>
      {details}
    </View>
  ) : (
    <TVFocusWrapper {...pressProps} style={{ width }}>
      {cover}
      {details}
    </TVFocusWrapper>
  );
});
ContinueReadingCard.displayName = 'ContinueReadingCard';

/** The manga home's row: each manga's last chapter, opening at the page it was left on. Hidden when there are none. */
export const ContinueReadingRow = memo(() => {
  const history = useMangaHistory();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = rowCardWidth(screenWidth, MANGA_CARDS_PER_SCREEN);
  const items = history.slice(0, ROW.maxItems);

  if (items.length === 0) return null;

  return (
    <View className="gap-2" scrollSnapAlign={TV_SNAP_CENTER}>
      <Text className="text-foreground text-lg font-semibold" style={{ paddingLeft: ROW.padding + 4 }}>
        Continue reading
      </Text>
      <TVRow style={{ height: cardWidth * COVER_ASPECT + CAPTION_HEIGHT + ROW.verticalPadding * 2 }}>
        <List<MangaHistoryEntry>
          horizontal
          data={items}
          keyExtractor={(entry) => entry.key}
          showsHorizontalScrollIndicator={false}
          scrollsToTop={false}
          contentContainerStyle={{ paddingHorizontal: ROW.padding, paddingVertical: ROW.verticalPadding }}
          {...tvFocusScrollProps(ROW.padding)}
          ItemSeparatorComponent={() => <View style={{ width: ROW.gap }} />}
          ListFooterComponent={null}
          renderItem={({ item }) => (
            <View scrollSnapAlign={TV_SNAP_CENTER}>
              <ContinueReadingCard entry={item} width={cardWidth} />
            </View>
          )}
        />
      </TVRow>
    </View>
  );
});
ContinueReadingRow.displayName = 'ContinueReadingRow';

export default ContinueWatchingRow;
