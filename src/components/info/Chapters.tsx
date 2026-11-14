import { RippleButton, HUXStack, HUYStack } from '@/components/ui-primitives';
import { readerHref, useShowParams } from '@/utils/routes';
import { Select } from '@/components/Select';
import { List } from '@/components/List';
import { IoniconsIcon } from '@/components/Icons';
import { ListJumpBar } from '@/components/ListJumpBar';
import { ProviderEmptyState } from '@/components/ListEmptyState';
import { Button } from '@/components/Button';
import { LinearGradient } from '@/components/LinearGradient';
import { useProviders, useProviderStore, useActiveProvider } from '@/hooks/stores/useProviderStore';
import { isTV } from '@/utils/tv';
import { LIST_SHADOW_SIZE, useListJump } from '@/hooks/useListJump';
import { mangaProgressKey, useMangaProgressStore, resumePage } from '@/hooks/stores/useMangaProgressStore';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { useMangaChapters } from '@/hooks/queries/mangaQueries';
import { useShownTitle } from '@/hooks/queries/infoQueries';
import { chapterDetails, chapterNumbers, chapterTitle } from '@/utils/manga';
import type { FlashListRef } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { cn, ScrollShadow } from '@/components/heroui';
import React, { memo, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import type { IMangaChapter } from 'react-native-consumet';

interface ChaptersProps {
  header?: ReactNode;
}

const ChapterRow = memo(
  ({
    chapter,
    read,
    page,
    onOpen,
  }: {
    chapter: IMangaChapter;
    read: boolean;
    /** Where reading stopped in it, as Mihon shows */
    page?: number;
    onOpen: (chapter: IMangaChapter) => void;
  }) => {
    const pureBlackBackground = useCurrentTheme().isPureBlack;
    const numbers = chapterNumbers(chapter);
    const details = [chapterDetails(chapter), page && `Page ${page}`].filter(Boolean).join(' · ');
    const title = chapterTitle(chapter);
    return (
      <RippleButton testID="chapter-row" onPress={() => onOpen(chapter)} focusScale={1}>
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

const chapterRangeLabel = (chapters: IMangaChapter[], start: number, end: number) => {
  const label = (index: number) => String(chapters[index].chapterNumber ?? index + 1);
  return `CH ${label(start)}–${label(end)}`;
};
const Chapters = ({ header }: ChaptersProps) => {
  const { mediaType, id } = useShowParams();
  const setProvider = useProviderStore((state) => state.setProvider);
  const currentProvider = useActiveProvider(mediaType);
  const providers = useProviders();
  const { data, isLoading, error, refetch } = useMangaChapters({ id, provider: currentProvider });
  const progress = useMangaProgressStore((state) => state.progress[mangaProgressKey(id, currentProvider)]);
  const currentTheme = useCurrentTheme();
  const router = useRouter();
  const listRef = useRef<FlashListRef<IMangaChapter>>(null);
  // Providers give reading order (first chapter first); newest first only flips what's shown
  const [newestFirst, setNewestFirst] = useState(false);
  const chapters = useMemo(() => {
    const list = data ?? [];
    return newestFirst ? [...list].reverse() : list;
  }, [data, newestFirst]);
  const read = useMemo(() => new Set(progress?.read), [progress?.read]);

  const { listProps, ranges, rangeValue, jumpToRange, jumpBar } = useListJump({
    items: chapters,
    listRef,
    rangeLabel: chapterRangeLabel,
  });

  const handleProviderChange = useCallback((value: string) => setProvider(mediaType, value), [mediaType, setProvider]);
  // The manga's title and cover go along, for Continue reading and History
  const { title: mangaTitle, image: mangaImage } = useShownTitle();
  const openChapter = useCallback(
    (chapter: Pick<IMangaChapter, 'id'>) =>
      router.push(
        readerHref({ id, chapter: chapter.id, provider: currentProvider, title: mangaTitle, image: mangaImage }),
      ),
    [router, id, currentProvider, mangaTitle, mangaImage],
  );
  const lastPage = progress ? resumePage(progress, progress.lastChapterId) : 1;
  // The last chapter opened, if this provider still lists it
  const continueChapter = progress && data?.some(({ id: chapterId }) => chapterId === progress.lastChapterId);

  return (
    <HUYStack className="flex-1">
      <ScrollShadow
        className="flex-1"
        size={LIST_SHADOW_SIZE}
        color={currentTheme.screenBackground}
        LinearGradientComponent={LinearGradient}>
        <List
          testID="chapter-list"
          ref={listRef}
          {...listProps}
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
                  testID="chapter-provider-select"
                  SelectItem={providers.manga}
                  SelectLabel="Provider"
                  value={currentProvider}
                  onValueChange={handleProviderChange}
                />
                {ranges.length > 0 && (
                  <Select
                    testID="chapter-range-select"
                    SelectItem={ranges}
                    SelectLabel="Chapters"
                    value={rangeValue}
                    onValueChange={jumpToRange}
                  />
                )}
                {chapters.length > 1 && (
                  <RippleButton
                    testID="chapter-order-toggle"
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
                    testID="chapter-continue"
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
          renderItem={({ item }) => (
            <ChapterRow
              chapter={item}
              read={read.has(item.id)}
              page={item.id === progress?.lastChapterId && lastPage > 1 ? lastPage : undefined}
              onOpen={openChapter}
            />
          )}
        />
      </ScrollShadow>
      <ListJumpBar {...jumpBar} />
    </HUYStack>
  );
};

export default Chapters;
