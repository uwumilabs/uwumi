import {
  RippleButton,
  Select,
  List,
  HUXStack,
  HUYStack,
  IoniconsIcon,
  ListJumpBar,
  ProviderEmptyState,
} from '@/components';
import { Button } from '@/components/Button';
import LinearGradient from '@/components/LinearGradient';
import { useProviders, useProviderStore, useActiveProvider } from '@/constants/provider';
import { MediaType } from '@/constants/types';
import { isTV } from '@/constants/utils';
import {
  LIST_SHADOW_SIZE,
  mangaProgressKey,
  useCurrentTheme,
  useListJump,
  useMangaChapters,
  useMangaProgressStore,
  usePureBlackBackground,
  useSolidHeaderOnScroll,
} from '@/hooks';
import { chapterDetails, chapterNumbers, chapterTitle } from '@/utils/manga';
import { useComposedEventHandler } from 'react-native-reanimated';
import type { FlashListRef } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { cn, ScrollShadow } from '@/components/heroui';
import React, { memo, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import type { IMangaChapter } from 'react-native-consumet';

interface ChaptersProps {
  header?: ReactNode;
}

const ChapterRow = memo(
  ({ chapter, read, onOpen }: { chapter: IMangaChapter; read: boolean; onOpen: (chapter: IMangaChapter) => void }) => {
    const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
    const numbers = chapterNumbers(chapter);
    const details = chapterDetails(chapter);
    const title = chapterTitle(chapter);
    return (
      <RippleButton onPress={() => onOpen(chapter)}>
        {/* Read chapters fade back, as in Aniyomi */}
        <HUYStack className={cn('gap-1 px-4 py-3', pureBlackBackground && 'bg-black', read && 'opacity-50')}>
          <HUXStack className="items-center justify-between gap-3">
            <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
              {title}
            </Text>
            {/* The title often is the number already ("Chapter 12"); then it isn't repeated */}
            {!!numbers && !title.includes(String(chapter.chapterNumber ?? '\u0000')) && (
              <Text className="text-sm text-foreground/60">{numbers}</Text>
            )}
          </HUXStack>
          {!!details && (
            <Text className="text-xs text-foreground/60" numberOfLines={1}>
              {details}
            </Text>
          )}
        </HUYStack>
      </RippleButton>
    );
  },
);
ChapterRow.displayName = 'ChapterRow';

const Chapters = ({ header }: ChaptersProps) => {
  const { mediaType, id } = useLocalSearchParams<{
    mediaType: MediaType;
    id: string;
  }>();
  const setProvider = useProviderStore((state) => state.setProvider);
  const currentProvider = useActiveProvider(mediaType);
  const providers = useProviders();
  const { data, isLoading, error, refetch } = useMangaChapters({ id, provider: currentProvider });
  const progress = useMangaProgressStore((state) => state.progress[mangaProgressKey(id, currentProvider)]);
  const currentTheme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const router = useRouter();
  const listRef = useRef<FlashListRef<IMangaChapter>>(null);
  // Providers give reading order (first chapter first); newest first only flips what's shown
  const [newestFirst, setNewestFirst] = useState(false);
  const chapters = useMemo(() => {
    const list = data ?? [];
    return newestFirst ? [...list].reverse() : list;
  }, [data, newestFirst]);
  const read = useMemo(() => new Set(progress?.read), [progress?.read]);

  const chapterRangeLabel = useCallback(
    (start: number, end: number) => {
      const label = (index: number) => String(chapters[index].chapterNumber ?? index + 1);
      return `CH ${label(start)}–${label(end)}`;
    },
    [chapters],
  );
  const solidHeaderOnScroll = useSolidHeaderOnScroll();
  const { listProps, ranges, rangeValue, jumpToRange, jumpBar } = useListJump({
    items: chapters,
    listRef,
    rangeLabel: chapterRangeLabel,
  });
  const onScroll = useComposedEventHandler([listProps.onScroll, solidHeaderOnScroll]);

  const handleProviderChange = useCallback((value: string) => setProvider(mediaType, value), [mediaType, setProvider]);
  const openChapter = useCallback(
    (chapter: Pick<IMangaChapter, 'id'>) =>
      router.push({ pathname: '/read/[id]', params: { id, chapter: chapter.id, provider: currentProvider } }),
    [router, id, currentProvider],
  );
  // The last chapter opened, if this provider still lists it
  const continueChapter = progress && data?.some(({ id: chapterId }) => chapterId === progress.lastChapterId);

  return (
    <HUYStack className="flex-1">
      <ScrollShadow
        className="flex-1"
        size={LIST_SHADOW_SIZE}
        color={pureBlackBackground ? '#000000' : currentTheme?.background}
        LinearGradientComponent={LinearGradient}>
        <List
          ref={listRef}
          {...listProps}
          onScroll={onScroll}
          data={isLoading ? [] : chapters}
          // Rendered inside the list so `header` stays visible
          ListEmptyComponent={
            isLoading ? (
              <HUYStack className="justify-center items-center min-h-75">
                <ActivityIndicator size="large" />
              </HUYStack>
            ) : (
              <ProviderEmptyState
                providers={providers.manga}
                provider={currentProvider}
                error={error}
                onRetry={() => refetch()}
                onProviderChange={handleProviderChange}
                itemsLabel="chapters"
              />
            )
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListHeaderComponent={
            <>
              {header}
              <HUXStack className="flex-wrap px-4 p-2 gap-1.5 items-center justify-center">
                <Select
                  SelectItem={providers.manga}
                  SelectLabel="Provider"
                  value={currentProvider}
                  onValueChange={handleProviderChange}
                />
                {ranges.length > 0 && (
                  <Select SelectItem={ranges} SelectLabel="Chapters" value={rangeValue} onValueChange={jumpToRange} />
                )}
                {chapters.length > 1 && (
                  <RippleButton
                    accessibilityLabel={newestFirst ? 'Show first chapter first' : 'Show newest chapter first'}
                    onPress={() => setNewestFirst((value) => !value)}>
                    <IoniconsIcon
                      name={newestFirst ? 'arrow-down' : 'arrow-up'}
                      size={20}
                      color={currentTheme?.foreground}
                    />
                  </RippleButton>
                )}
                {continueChapter && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => openChapter({ id: progress.lastChapterId })}
                    hasTVPreferredFocus={isTV}>
                    <IoniconsIcon name="book" size={14} color={currentTheme?.foreground} />
                    <Button.Label numberOfLines={1}>{`Continue · ${progress.lastChapterTitle}`}</Button.Label>
                  </Button>
                )}
              </HUXStack>
            </>
          }
          renderItem={({ item }) => <ChapterRow chapter={item} read={read.has(item.id)} onOpen={openChapter} />}
        />
      </ScrollShadow>
      <ListJumpBar {...jumpBar} rangesLabel="Chapters" />
    </HUYStack>
  );
};

export default Chapters;
