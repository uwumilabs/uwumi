import React, { memo, useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import {
  ConfirmDialog,
  HorizontalTabs,
  HUXStack,
  HUYStack,
  Image,
  IoniconsIcon,
  List,
  NoResults,
  Progress,
  RippleButton,
  ThemedView,
  TVFocusWrapper,
} from '@/components';
import { continueWatchingEpisodeLabel, openContinueWatchingEntry } from '@/components/ContinueWatchingRow';
import {
  type ContinueWatchingEntry,
  useContinueWatchingStore,
  useCurrentTheme,
  useDownloadedOnlyFilter,
  useWatchProgressStore,
} from '@/hooks';
import { MediaType } from '@/constants/types';

const THUMB_WIDTH = 112;

type Row = { type: 'day'; key: string; label: string } | { type: 'entry'; key: string; entry: ContinueWatchingEntry };

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const dayLabel = (time: number) => {
  const today = new Date().setHours(0, 0, 0, 0);
  const day = new Date(time).setHours(0, 0, 0, 0);
  const daysAgo = Math.round((today - day) / 86_400_000);
  return daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : dateFormat.format(day);
};

const HistoryRow = memo(({ entry }: { entry: ContinueWatchingEntry }) => {
  const router = useRouter();
  const theme = useCurrentTheme();
  const remove = useContinueWatchingStore((state) => state.remove);
  const { isCompleted, percent } = useWatchProgressStore(
    useShallow((state) => {
      const progress = state.progresses[entry.uniqueId];
      return { isCompleted: !!progress?.isCompleted, percent: Math.round(progress?.progress ?? 0) };
    }),
  );

  const open = useCallback(() => openContinueWatchingEntry(router, entry, isCompleted), [router, entry, isCompleted]);
  const removeEntry = useCallback(() => remove(entry.key), [remove, entry.key]);

  const title = entry.showTitle || entry.watchParams.title;
  const caption = [continueWatchingEpisodeLabel(entry), timeFormat.format(entry.updatedAt)].filter(Boolean).join(' · ');

  return (
    <HUXStack className="items-center gap-2 px-4 py-2">
      <TVFocusWrapper
        onPress={open}
        style={{ flex: 1 }}
        focusScale={1}
        focusBorderRadius={12}
        accessibilityLabel={title}>
        <HUXStack className="items-center gap-3">
          <View className="overflow-hidden rounded-lg bg-default" style={{ width: THUMB_WIDTH, aspectRatio: 16 / 9 }}>
            <Image source={entry.watchParams.poster || entry.showImage} style={{ width: '100%', height: '100%' }} />
            {percent > 0 && !isCompleted && <Progress className="absolute inset-x-1.5 bottom-1.5" value={percent} />}
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
      <RippleButton onPress={removeEntry} accessibilityLabel="Remove from history">
        <IoniconsIcon name="trash-outline" size={22} color={theme.foreground} />
      </RippleButton>
    </HUXStack>
  );
});
HistoryRow.displayName = 'HistoryRow';

const HistoryList = ({ mediaType }: { mediaType: MediaType }) => {
  const entries = useContinueWatchingStore((state) => state.entries);
  const downloadedOnly = useDownloadedOnlyFilter();

  // Most recent first, as the store keeps them, with a header where the day changes
  const rows = useMemo(() => {
    const result: Row[] = [];
    let lastDay = '';
    for (const entry of entries) {
      if (entry.mediaType !== mediaType) continue;
      if (downloadedOnly && !downloadedOnly(entry.showId, entry.showTitle)) continue;
      const day = dayLabel(entry.updatedAt);
      if (day !== lastDay) {
        result.push({ type: 'day', key: `day-${day}`, label: day });
        lastDay = day;
      }
      result.push({ type: 'entry', key: entry.key, entry });
    }
    return result;
  }, [entries, mediaType, downloadedOnly]);

  return (
    <View className="h-full">
      <List<Row>
        data={rows}
        keyExtractor={(row) => row.key}
        getItemType={(row) => row.type}
        ListEmptyComponent={<NoResults title="Nothing watched recently" hint="Episodes you watch show up here" />}
        renderItem={({ item }) =>
          item.type === 'day' ? (
            <Text className="px-4 pb-1 pt-4 text-sm font-semibold text-foreground/60">{item.label}</Text>
          ) : (
            <HistoryRow entry={item.entry} />
          )
        }
      />
    </View>
  );
};

const TABS = [
  { key: 'anime', label: 'Anime', content: <HistoryList mediaType={MediaType.ANIME} /> },
  { key: 'movies', label: 'Movies', content: <HistoryList mediaType={MediaType.MOVIE} /> },
];

const History = () => {
  const theme = useCurrentTheme();
  const clearAll = useContinueWatchingStore((state) => state.clearAll);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <ThemedView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <RippleButton onPress={() => setConfirmOpen(true)} accessibilityLabel="Clear history">
              <IoniconsIcon name="trash-bin-outline" size={22} color={theme.foreground} />
            </RippleButton>
          ),
        }}
      />
      <HorizontalTabs items={TABS} initialTab="anime" />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Clear history?"
        description="Removes every show from History and Continue watching. Episode progress stays."
        confirmText="Clear"
        onConfirm={() => {
          clearAll();
          setConfirmOpen(false);
        }}
      />
    </ThemedView>
  );
};

export default History;
