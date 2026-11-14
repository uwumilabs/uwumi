import React, { memo, useMemo, useState } from 'react';
import { MEDIA_TABS } from '@/utils/media';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import TVFocusWrapper from '@/components/TVFocusWrapper';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { HorizontalTabs } from '@/components/HorizontalTabs';
import { HUXStack, HUYStack, NoResults, RippleButton, ThemedView } from '@/components/ui-primitives';
import { Image } from '@/components/Image';
import { IoniconsIcon } from '@/components/Icons';
import { List } from '@/components/List';
import { Progress } from '@/components/native/progress/Progress';
import {
  clearWatchHistory,
  continueWatchingEpisodeLabel,
  mangaPageLabel,
  openContinueWatchingEntry,
  openMangaProgress,
  type MangaHistoryEntry,
  useEntryProgress,
  useMangaHistory,
  useWatchHistory,
} from '@/hooks/useHistory';
import { type ContinueWatchingEntry, useContinueWatchingStore } from '@/hooks/stores/useContinueWatchingStore';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { useMangaProgressStore } from '@/hooks/stores/useMangaProgressStore';
import { MediaType } from '@/constants/types';

type Row<T> = { type: 'day'; key: string; label: string } | { type: 'entry'; key: string; entry: T };

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const dayLabel = (time: number) => {
  const today = new Date().setHours(0, 0, 0, 0);
  const day = new Date(time).setHours(0, 0, 0, 0);
  const daysAgo = Math.round((today - day) / 86_400_000);
  return daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : dateFormat.format(day);
};

/** Most recent first, as the stores keep them, with a header where the day changes */
const groupByDay = <T extends { key: string }>(entries: T[], timeOf: (entry: T) => number) => {
  const rows: Row<T>[] = [];
  let lastDay = '';
  for (const entry of entries) {
    const day = dayLabel(timeOf(entry));
    if (day !== lastDay) {
      rows.push({ type: 'day', key: `day-${day}`, label: day });
      lastDay = day;
    }
    rows.push({ type: 'entry', key: entry.key, entry });
  }
  return rows;
};

const DayList = <T,>({
  rows,
  empty,
  renderEntry,
}: {
  rows: Row<T>[];
  empty: React.ReactElement;
  renderEntry: (entry: T) => React.ReactElement;
}) => (
  <View className="h-full">
    <List<Row<T>>
      testID="history-list"
      data={rows}
      keyExtractor={(row) => row.key}
      getItemType={(row) => row.type}
      ListEmptyComponent={empty}
      renderItem={({ item }) =>
        item.type === 'day' ? (
          <Text className="px-4 pb-1 pt-4 text-sm font-semibold text-foreground/60">{item.label}</Text>
        ) : (
          renderEntry(item.entry)
        )
      }
    />
  </View>
);

const HistoryRow = ({
  title,
  caption,
  image,
  imageStyle,
  percent,
  onPress,
  onRemove,
}: {
  title?: string;
  caption: string;
  image?: string;
  imageStyle: { width: number; aspectRatio: number };
  /** Shows a progress bar when set */
  percent?: number;
  onPress: () => void;
  onRemove: () => void;
}) => {
  const theme = useCurrentTheme();
  return (
    <HUXStack className="items-center gap-2 px-4 py-2">
      <TVFocusWrapper
        testID="history-row"
        onPress={onPress}
        style={{ flex: 1 }}
        focusScale={1}
        focusBorderRadius={12}
        accessibilityLabel={title}>
        <HUXStack className="items-center gap-3">
          <View className="overflow-hidden rounded-lg bg-default" style={imageStyle}>
            <Image source={image} style={{ width: '100%', height: '100%' }} />
            {percent !== undefined && <Progress className="absolute inset-x-1.5 bottom-1.5" value={percent} />}
          </View>
          <HUYStack className="flex-1 gap-0.5">
            <Text className="text-base font-medium text-foreground" numberOfLines={2}>
              {title}
            </Text>
            <Text className="text-sm text-foreground/60" numberOfLines={1}>
              {caption}
            </Text>
          </HUYStack>
        </HUXStack>
      </TVFocusWrapper>
      <RippleButton testID="history-row-remove" onPress={onRemove} accessibilityLabel="Remove from history">
        <IoniconsIcon name="trash-outline" size={22} color={theme.foreground} />
      </RippleButton>
    </HUXStack>
  );
};

const EPISODE_THUMB = { width: 112, aspectRatio: 16 / 9 };
const MANGA_COVER = { width: 56, aspectRatio: 2 / 3 };

const EpisodeHistoryRow = memo(({ entry }: { entry: ContinueWatchingEntry }) => {
  const remove = useContinueWatchingStore((state) => state.remove);
  const { isCompleted, percent } = useEntryProgress(entry.uniqueId);
  return (
    <HistoryRow
      title={entry.showTitle || entry.watchParams.title}
      caption={[continueWatchingEpisodeLabel(entry), timeFormat.format(entry.updatedAt)].filter(Boolean).join(' · ')}
      image={entry.watchParams.poster || entry.showImage}
      imageStyle={EPISODE_THUMB}
      percent={percent}
      onPress={() => openContinueWatchingEntry(entry, isCompleted)}
      onRemove={() => remove(entry.key)}
    />
  );
});
EpisodeHistoryRow.displayName = 'EpisodeHistoryRow';

const MangaHistoryRow = memo(({ entry }: { entry: MangaHistoryEntry }) => {
  const hide = useMangaProgressStore((state) => state.hide);
  const { progress } = entry;
  return (
    <HistoryRow
      title={progress.title}
      caption={[progress.lastChapterTitle, mangaPageLabel(progress), timeFormat.format(progress.updatedAt)]
        .filter(Boolean)
        .join(' · ')}
      image={progress.image}
      imageStyle={MANGA_COVER}
      onPress={() => openMangaProgress(entry)}
      onRemove={() => hide(entry.key)}
    />
  );
});
MangaHistoryRow.displayName = 'MangaHistoryRow';

const HistoryList = ({ mediaType }: { mediaType: MediaType }) => {
  const history = useWatchHistory(mediaType);
  const rows = useMemo(() => groupByDay(history, (entry) => entry.updatedAt), [history]);
  return (
    <DayList
      rows={rows}
      empty={<NoResults title="Nothing watched recently" hint="Episodes you watch show up here" />}
      renderEntry={(entry) => <EpisodeHistoryRow entry={entry} />}
    />
  );
};

const MangaHistoryList = () => {
  const history = useMangaHistory();
  const rows = useMemo(() => groupByDay(history, (entry) => entry.progress.updatedAt), [history]);
  return (
    <DayList
      rows={rows}
      empty={<NoResults title="Nothing read recently" hint="Chapters you read show up here" />}
      renderEntry={(entry) => <MangaHistoryRow entry={entry} />}
    />
  );
};

const TABS = MEDIA_TABS.map(({ mediaType, label }) => ({
  key: mediaType,
  label,
  content: mediaType === MediaType.MANGA ? <MangaHistoryList /> : <HistoryList mediaType={mediaType} />,
}));

const History = () => {
  const theme = useCurrentTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <ThemedView testID="history-screen">
      <Stack.Screen
        options={{
          headerRight: () => (
            <RippleButton
              testID="history-clear"
              onPress={() => setConfirmOpen(true)}
              accessibilityLabel="Clear history">
              <IoniconsIcon name="trash-bin-outline" size={22} color={theme.foreground} />
            </RippleButton>
          ),
        }}
      />
      <HorizontalTabs items={TABS} />
      <ConfirmDialog
        testID="history-clear-dialog"
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Clear history?"
        description="Empties History, Continue watching and Continue reading. Episode progress and read chapters stay."
        confirmText="Clear"
        onConfirm={() => {
          clearWatchHistory();
          setConfirmOpen(false);
        }}
      />
    </ThemedView>
  );
};

export default History;
