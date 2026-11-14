import {
  continueWatchingEpisodeLabel,
  mangaPageLabel,
  openContinueWatchingEntry,
  openMangaProgress,
  useMangaHistory,
  useEntryProgress,
  useWatchHistory,
  type MangaHistoryEntry,
} from '@/hooks/useHistory';
import React, { memo, useCallback, useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { CardRow, ROW, rowCardWidth } from './TVRow';
import { haptics } from '@/utils/haptics';
import { isMovieType } from '@/utils/media';
import { MediaType } from '@/constants/types';
import { isTV } from '@/utils/tv';
import { ContinueWatchingEntry, useContinueWatchingStore } from '@/hooks/stores/useContinueWatchingStore';
import { resumePage, useMangaProgressStore } from '@/hooks/stores/useMangaProgressStore';
import { useWatchProgressStore } from '@/hooks/stores/useWatchProgressStore';
import { Image } from './Image';
import { Progress } from './native/progress/Progress';
import TVFocusWrapper from './TVFocusWrapper';
import { HUYStack } from './ui-primitives';

const CARDS_PER_SCREEN = isTV ? 3.5 : 1.6;
const THUMBNAIL_ASPECT = 9 / 16;
const CAPTION_HEIGHT = 44;

interface HistoryCardProps {
  testID: string;
  width: number;
  /** Width over height */
  aspectRatio: number;
  image?: string;
  badge?: string;
  /** Shows a progress bar when set */
  percent?: number;
  title: string;
  caption?: string;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityHint: string;
}

const HistoryCard = ({
  width,
  aspectRatio,
  image,
  badge,
  percent,
  title,
  caption,
  ...pressProps
}: HistoryCardProps) => {
  // Fills the wrapper rather than `width`, so on TV it sits inside the focus ring's border instead of covering it
  const picture = (
    <View className="overflow-hidden rounded-xl bg-default" style={{ width: '100%', aspectRatio }}>
      <Image source={image} style={{ width: '100%', height: '100%' }} />
      {!!badge && (
        <Text className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-black text-accent">
          {badge}
        </Text>
      )}
      {percent !== undefined && <Progress className="absolute inset-x-2 bottom-2" value={percent} />}
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

  // TV: only the picture takes focus, so the ring and scale wrap it and the text stays below
  return isTV ? (
    <View style={{ width }}>
      <TVFocusWrapper {...pressProps} focusBorderRadius={12} accessibilityLabel={title}>
        {picture}
      </TVFocusWrapper>
      {details}
    </View>
  ) : (
    <TVFocusWrapper {...pressProps} style={{ width }}>
      {picture}
      {details}
    </TVFocusWrapper>
  );
};

const ContinueWatchingCard = memo(({ entry, width }: { entry: ContinueWatchingEntry; width: number }) => {
  const { isCompleted, percent, minutesLeft } = useEntryProgress(entry.uniqueId);
  const remove = useContinueWatchingStore((state) => state.remove);
  const { title: episodeTitle, poster } = entry.watchParams;

  const open = useCallback(() => openContinueWatchingEntry(entry, isCompleted), [isCompleted, entry]);

  const removeFromRow = useCallback(() => {
    haptics.medium();
    remove(entry.key);
  }, [remove, entry.key]);

  const episodeLabel = continueWatchingEpisodeLabel(entry);
  const caption = isCompleted ? 'Watched · next episode' : minutesLeft ? `${minutesLeft}m left` : episodeTitle;

  return (
    <HistoryCard
      testID="continue-watching-card"
      width={width}
      aspectRatio={1 / THUMBNAIL_ASPECT}
      image={poster || entry.showImage}
      badge={episodeLabel}
      percent={percent}
      title={entry.showTitle || episodeTitle || ''}
      caption={caption}
      onPress={open}
      onLongPress={removeFromRow}
      accessibilityHint="Long press to remove from Continue watching"
    />
  );
});
ContinueWatchingCard.displayName = 'ContinueWatchingCard';

/** The latest episode of each show watched on this media type, most recent first. Hidden when there are none. */
export const ContinueWatchingRow = memo(({ mediaType }: { mediaType: MediaType }) => {
  const history = useWatchHistory(mediaType);
  // Only which entries are finished, so the progress saves while watching don't re-render the row
  const finishedKey = useWatchProgressStore((state) =>
    history
      .filter((entry) => state.progresses[entry.uniqueId]?.isCompleted)
      .map((entry) => entry.uniqueId)
      .join('|'),
  );
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = rowCardWidth(screenWidth, CARDS_PER_SCREEN);

  // Nothing left to continue after a finished movie or an anime's last episode
  const items = useMemo(() => {
    const finished = new Set(finishedKey.split('|'));
    return history
      .filter(
        (entry) =>
          !(finished.has(entry.uniqueId) && (isMovieType(entry.watchParams.type) || entry.hasNextEpisode === false)),
      )
      .slice(0, ROW.maxItems);
  }, [history, finishedKey]);
  if (items.length === 0) return null;

  return (
    <CardRow<ContinueWatchingEntry>
      testID="continue-watching-row"
      title="Continue watching"
      cardHeight={cardWidth * THUMBNAIL_ASPECT + CAPTION_HEIGHT}
      items={items}
      keyExtractor={(entry) => entry.key}
      renderItem={(entry) => <ContinueWatchingCard entry={entry} width={cardWidth} />}
    />
  );
});
ContinueWatchingRow.displayName = 'ContinueWatchingRow';

// Manga covers are portrait, so more of them fit across
const MANGA_CARDS_PER_SCREEN = isTV ? 6.5 : 3.2;
const COVER_ASPECT = 3 / 2;

const ContinueReadingCard = memo(({ entry, width }: { entry: MangaHistoryEntry; width: number }) => {
  const hide = useMangaProgressStore((state) => state.hide);
  const { progress } = entry;
  const page = resumePage(progress, progress.lastChapterId);
  const percent = page > 1 && progress.pageCount ? (page / progress.pageCount) * 100 : 0;

  const open = useCallback(() => openMangaProgress(entry), [entry]);
  const removeFromRow = useCallback(() => {
    haptics.medium();
    hide(entry.key);
  }, [hide, entry.key]);

  return (
    <HistoryCard
      testID="continue-reading-card"
      width={width}
      aspectRatio={1 / COVER_ASPECT}
      image={progress.image}
      percent={percent > 0 ? percent : undefined}
      title={progress.title ?? ''}
      caption={mangaPageLabel(progress) ?? progress.lastChapterTitle}
      onPress={open}
      onLongPress={removeFromRow}
      accessibilityHint="Long press to remove from Continue reading"
    />
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
    <CardRow<MangaHistoryEntry>
      testID="continue-reading-row"
      title="Continue reading"
      cardHeight={cardWidth * COVER_ASPECT + CAPTION_HEIGHT}
      items={items}
      keyExtractor={(entry) => entry.key}
      renderItem={(entry) => <ContinueReadingCard entry={entry} width={cardWidth} />}
    />
  );
});
ContinueReadingRow.displayName = 'ContinueReadingRow';
