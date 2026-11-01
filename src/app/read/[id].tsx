import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type GestureResponderEvent,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { FlashList, type FlashListRef, type ViewToken } from '@shopify/flash-list';
import { useKeepAwake } from 'expo-keep-awake';
import { create } from 'zustand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { IMangaChapter, IMangaChapterPage } from 'react-native-consumet';
import { HUXStack, HUYStack, IoniconsIcon, ListEmptyState, ThemedView } from '@/components';
import { Button } from '@/components/Button';
import { ReaderPage } from '@/components/reader/ReaderPage';
import { TapZonesOverlay, tapActionAt } from '@/components/reader/TapZones';
import { ZoomablePage } from '@/components/reader/ZoomablePage';
import { isTV } from '@/constants/utils';
import { getProviders } from '@/constants/provider';
import { MediaType } from '@/constants/types';
import {
  mangaProgressKey,
  resumePage,
  type ReaderBackground,
  useChapterPages,
  useCurrentTheme,
  useMangaChapters,
  useMangaProgressStore,
  useReaderSettingsStore,
} from '@/hooks';
import { adjacentChapters, chapterNumbers, chapterTitle } from '@/utils/manga';

const BACKGROUNDS: Record<Exclude<ReaderBackground, 'theme'>, string> = {
  black: '#000000',
  gray: '#202125',
  white: '#ffffff',
};

// Long strip with gaps: Mihon's space between pages
const PAGE_GAP = 16;

/** The chapter's pages, between where it starts and ends (the chapter buttons, or Mihon's transition pages) */
type ReaderItem = { kind: 'start' } | { kind: 'page'; page: IMangaChapterPage; number: number } | { kind: 'end' };

// The page on screen, per chapter, so only the pill re-renders as the strip scrolls
const usePageStore = create<{ chapterId: string; page: number }>(() => ({ chapterId: '', page: 0 }));

// An item covering at least half the screen counts as on screen, so the topmost one is the page being read
const VIEWABILITY = { viewAreaCoveragePercentThreshold: 50 };

const KeepAwake = () => {
  useKeepAwake();
  return null;
};

const PagePill = ({ chapterId, total }: { chapterId: string; total: number }) => {
  const insets = useSafeAreaInsets();
  const page = usePageStore((state) => (state.chapterId === chapterId ? state.page : 0));
  if (!page) return null;
  return (
    <View pointerEvents="none" className="absolute inset-x-0 items-center" style={{ bottom: insets.bottom + 12 }}>
      <Text className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">{`${page} / ${total}`}</Text>
    </View>
  );
};

interface ChapterNavProps {
  previous?: IMangaChapter;
  next?: IMangaChapter;
  onOpen: (chapter: IMangaChapter) => void;
}

/** Previous and next chapter, in reading order */
const ChapterNav = ({ previous, next, onOpen }: ChapterNavProps) => {
  const theme = useCurrentTheme();
  if (!previous && !next) return null;
  return (
    <HUXStack className="justify-between gap-3 px-4 py-3">
      <Button variant="secondary" size="sm" isDisabled={!previous} onPress={() => previous && onOpen(previous)}>
        <IoniconsIcon name="chevron-back" size={16} color={theme.foreground} />
        <Button.Label>Previous chapter</Button.Label>
      </Button>
      <Button variant="secondary" size="sm" isDisabled={!next} onPress={() => next && onOpen(next)}>
        <Button.Label>Next chapter</Button.Label>
        <IoniconsIcon name="chevron-forward" size={16} color={theme.foreground} />
      </Button>
    </HUXStack>
  );
};

interface TransitionPageProps {
  kind: 'start' | 'end';
  current?: IMangaChapter;
  target?: IMangaChapter;
  onOpen: (chapter: IMangaChapter) => void;
  width: number;
  height: number;
}

/** Mihon's chapter transition, a page of its own in the paged modes: the chapter before this one, or after it */
const TransitionPage = ({ kind, current, target, onOpen, width, height }: TransitionPageProps) => {
  const start = kind === 'start';
  return (
    <View style={{ width, height }} className="items-center justify-center px-8">
      <HUYStack className="w-full max-w-md gap-4 rounded-3xl bg-surface p-6">
        <HUYStack className="gap-1">
          <Text className="text-sm text-foreground/60">{start ? 'Current' : 'Finished'}</Text>
          <Text className="text-lg font-semibold text-foreground">{current ? chapterTitle(current) : 'Chapter'}</Text>
        </HUYStack>
        <HUYStack className="gap-1">
          <Text className="text-sm text-foreground/60">
            {target ? (start ? 'Previous' : 'Next') : start ? "There's no previous chapter" : "There's no next chapter"}
          </Text>
          {target && <Text className="text-lg font-semibold text-foreground">{chapterTitle(target)}</Text>}
        </HUYStack>
        {target && (
          <Button size="sm" onPress={() => onOpen(target)}>
            <Button.Label>{start ? 'Previous chapter' : 'Next chapter'}</Button.Label>
          </Button>
        )}
      </HUYStack>
    </View>
  );
};

/**
 * A chapter's pages, in the reading mode from the reader settings. `id` is the AniList manga; `chapter` and
 * `provider` say which chapter on which provider, so the chapter list (for previous and next) comes from the same
 * cached query as the info screen's.
 */
const Read = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // `continued`: opened from the previous or next chapter button, so the reader was already open. `title` and `image`
  // are the manga's, kept with its progress for Continue reading and History
  const {
    id,
    chapter: chapterId,
    provider,
    continued,
    title: mangaTitle,
    image: mangaImage,
  } = useLocalSearchParams<{
    id: string;
    chapter: string;
    provider: string;
    continued?: string;
    title?: string;
    image?: string;
  }>();
  const progressKey = mangaProgressKey(id, provider);
  // Where this chapter was left, read once: the page saves as it's read would move it otherwise
  const [startPage] = useState(() => resumePage(useMangaProgressStore.getState().progress[progressKey], chapterId));
  const chapters = useMangaChapters({ id, provider });
  const pages = useChapterPages({ chapterId, provider });
  const markRead = useMangaProgressStore((state) => state.markRead);
  const { current, previous, next } = adjacentChapters(chapters.data ?? [], chapterId);
  const providerName = getProviders()[MediaType.MANGA].find(({ value }) => value === provider)?.name ?? provider;
  const title = current ? chapterTitle(current) : 'Chapter';
  const readingMode = useReaderSettingsStore((state) => state.readingMode);
  const background = useReaderSettingsStore((state) => state.background);
  const keepScreenOn = useReaderSettingsStore((state) => state.keepScreenOn);
  const showPageNumber = useReaderSettingsStore((state) => state.showPageNumber);
  const sidePadding = useReaderSettingsStore((state) => state.sidePadding);
  const tapZones = useReaderSettingsStore((state) => state.tapZones);
  const invertTapZones = useReaderSettingsStore((state) => state.invertTapZones);
  const showTapZonesOverlay = useReaderSettingsStore((state) => state.showTapZonesOverlay);
  const paged = readingMode.startsWith('paged');
  const rtl = readingMode === 'paged-rtl';
  const horizontal = rtl || readingMode === 'paged-ltr';
  const padding = paged ? 0 : Math.round((width * sidePadding) / 100);
  const pageWidth = width - padding * 2;
  const listRef = useRef<FlashListRef<ReaderItem>>(null);
  // The item on screen in the paged modes, for the tap zones to turn from
  const currentIndex = useRef(0);
  // The paged modes size each page to the list exactly, so its snapping lands on whole pages
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);

  // The menu is the header, laid over the pages; the list keeps its height clear while it's hidden too
  const [menuVisible, setMenuVisible] = useState(true);
  // A zoomed page pans under a drag, so the list stops paging until it's zoomed back out. A new mode starts unzoomed
  const [zoomed, setZoomed] = useState(false);
  const [zoomMode, setZoomMode] = useState(readingMode);
  if (zoomMode !== readingMode) {
    setZoomMode(readingMode);
    setZoomed(false);
  }
  const headerHeight = useHeaderHeight();
  const [topInset, setTopInset] = useState(headerHeight);
  if (headerHeight > topInset) setTopInset(headerHeight);

  // A chapter counts as read once its pages load
  const loaded = !!pages.data?.length;
  useEffect(() => {
    if (loaded && current) {
      markRead(progressKey, { id: current.id, title: chapterTitle(current) }, { title: mangaTitle, image: mangaImage });
    }
  }, [loaded, current, progressKey, mangaTitle, mangaImage, markRead]);

  const openChapter = useCallback(
    (chapter: IMangaChapter) =>
      router.replace({
        pathname: '/read/[id]',
        params: { id, chapter: chapter.id, provider, continued: '1', title: mangaTitle, image: mangaImage },
      }),
    [router, id, provider, mangaTitle, mangaImage],
  );
  const nav = useMemo(
    () => <ChapterNav previous={previous} next={next} onOpen={openChapter} />,
    [previous, next, openChapter],
  );

  // Right to left lays the chapter out reversed, so it starts at the right-hand end
  const items = useMemo(() => {
    const list: ReaderItem[] = [
      { kind: 'start' },
      ...(pages.data ?? []).map((page, index) => ({ kind: 'page' as const, page, number: index + 1 })),
      { kind: 'end' },
    ];
    return rtl ? list.reverse() : list;
  }, [pages.data, rtl]);
  const pageCount = pages.data?.length ?? 0;
  // The page's place in the list: after the start, counted from the other end when right to left
  const pageIndex = (page: number) => (rtl ? items.length - 1 - page : page);
  const startIndex = paged || startPage > 1 ? pageIndex(Math.min(startPage, pageCount)) : undefined;

  // By where the tap lands: the menu, or Mihon's next or previous (a page when paged, three quarters of a screen in
  // the long strip)
  const tapAt = useCallback(
    (x: number, y: number) => {
      const action = tapActionAt(x / width, y / height, tapZones, invertTapZones, rtl);
      if (action === 'menu') return setMenuVisible((visible) => !visible);
      const list = listRef.current;
      if (!list) return;
      const forward = action === 'next' ? 1 : -1;
      if (!paged) {
        const offset = list.getAbsoluteLastScrollOffset() + height * 0.75 * forward;
        return list.scrollToOffset({ offset: Math.max(0, offset), animated: true });
      }
      const index = currentIndex.current + (rtl ? -forward : forward);
      if (index >= 0 && index < items.length) list.scrollToIndex({ index, animated: true });
    },
    [width, height, tapZones, invertTapZones, rtl, paged, items.length],
  );
  const onPageTap = useCallback(
    ({ nativeEvent }: GestureResponderEvent) => tapAt(nativeEvent.pageX, nativeEvent.pageY),
    [tapAt],
  );

  const renderItem = useCallback(
    ({ item }: { item: ReaderItem }) => {
      let content: React.ReactNode;
      if (item.kind !== 'page') {
        if (!paged) return item.kind === 'start' ? <View style={{ paddingTop: topInset }}>{nav}</View> : nav;
        content = (
          <TransitionPage
            kind={item.kind}
            current={current}
            target={item.kind === 'start' ? previous : next}
            onOpen={openChapter}
            width={viewport?.width ?? width}
            height={viewport?.height ?? height}
          />
        );
      } else if (paged) {
        const pageBox = { width: viewport?.width ?? width, height: viewport?.height ?? height };
        const page = <ReaderPage page={item.page} {...pageBox} />;
        // Zooms with a double tap or a pinch; the tap zones come through its single tap. Keyed by page, so a
        // recycled cell starts unzoomed
        return isTV ? (
          page
        ) : (
          <ZoomablePage key={item.page.img} {...pageBox} onTap={tapAt} onZoomChange={setZoomed}>
            {page}
          </ZoomablePage>
        );
      } else {
        content = <ReaderPage page={item.page} width={pageWidth} />;
      }
      // Padded per page, so the chapter buttons keep the full width. TV pages take the D-pad's focus themselves,
      // so they get no tap zones
      return isTV ? (
        <View style={{ paddingHorizontal: padding }}>{content}</View>
      ) : (
        <Pressable onPress={onPageTap} style={{ paddingHorizontal: padding }}>
          {content}
        </Pressable>
      );
    },
    [
      paged,
      topInset,
      nav,
      current,
      previous,
      next,
      openChapter,
      viewport,
      width,
      height,
      pageWidth,
      padding,
      onPageTap,
      tapAt,
    ],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<ReaderItem>[] }) => {
      const visible = viewableItems.filter(({ index }) => index != null);
      if (!visible.length) return;
      if (paged) currentIndex.current = visible[0].index as number;
      const numbers = visible.flatMap(({ item }) => (item.kind === 'page' ? [item.number] : []));
      if (!numbers.length) return;
      // In the long strip the last page can be shorter than the screen and never be the topmost
      const page = !paged && numbers.includes(pageCount) ? pageCount : Math.min(...numbers);
      usePageStore.setState({ chapterId, page });
      useMangaProgressStore.getState().setPage(progressKey, chapterId, page, pageCount);
    },
    [paged, pageCount, chapterId, progressKey],
  );

  let body: React.ReactNode;
  if (pages.isLoading) {
    body = (
      <HUYStack className="flex-1 items-center justify-center gap-3" style={{ paddingTop: topInset }}>
        <ActivityIndicator size="large" />
        <Text className="text-sm text-foreground/60">{`Loading pages from ${providerName}…`}</Text>
      </HUYStack>
    );
  } else if (pages.error || !pages.data?.length) {
    body = (
      <View className="flex-1" style={{ paddingTop: topInset }}>
        <ListEmptyState
          icon={pages.error ? 'cloud-offline-outline' : 'document-outline'}
          title={pages.error ? "Couldn't load this chapter" : 'This chapter has no pages'}
          description={
            pages.error ? `${providerName} didn't return its pages.` : `${providerName} lists no pages for it.`
          }
          detail={pages.error?.message}>
          {!!pages.error && (
            <Button size="sm" onPress={() => pages.refetch()}>
              <Button.Label>Retry</Button.Label>
            </Button>
          )}
        </ListEmptyState>
        {nav}
      </View>
    );
  } else {
    body = (
      <View
        className="flex-1"
        style={background === 'theme' ? undefined : { backgroundColor: BACKGROUNDS[background] }}
        onLayout={({ nativeEvent: { layout } }) =>
          setViewport((size) =>
            size?.width === layout.width && size.height === layout.height
              ? size
              : { width: layout.width, height: layout.height },
          )
        }>
        {(!paged || viewport) && (
          <FlashList
            ref={listRef}
            // A new chapter, or mode, starts at its first page
            key={`${chapterId}-${readingMode}`}
            data={items}
            keyExtractor={(item) => (item.kind === 'page' ? `${item.page.page}-${item.page.img}` : item.kind)}
            // Paged, every item is one screen; as one type, the chapter's start (unmeasured when opening further in)
            // is estimated at the pages' measured size rather than a guess, which put every page after it off the
            // paging snap
            getItemType={paged ? undefined : (item) => item.kind}
            renderItem={renderItem}
            horizontal={horizontal}
            pagingEnabled={paged}
            scrollEnabled={!zoomed}
            // Paged modes open on a page rather than the chapter's start; the strip opens at its top unless resuming
            initialScrollIndex={startIndex}
            ItemSeparatorComponent={
              readingMode === 'long-strip-gaps' ? () => <View style={{ height: PAGE_GAP }} /> : undefined
            }
            contentContainerStyle={paged ? undefined : { paddingBottom: insets.bottom + 16 }}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            viewabilityConfig={VIEWABILITY}
            onViewableItemsChanged={onViewableItemsChanged}
          />
        )}
        {showPageNumber && <PagePill chapterId={chapterId} total={pageCount} />}
        {showTapZonesOverlay && !isTV && !continued && tapZones !== 'disabled' && (
          <TapZonesOverlay layout={tapZones} invert={invertTapZones} rtl={rtl} />
        )}
      </View>
    );
  }

  return (
    // The list keeps the header's room itself, so hiding the menu (and the system bars, as Mihon does) moves nothing
    <ThemedView style={{ paddingTop: 0 }} useStatusBar={menuVisible}>
      <Stack.Screen
        options={{ title, headerBackTitle: chapterNumbers(current) || undefined, headerShown: menuVisible }}
      />
      {keepScreenOn && <KeepAwake />}
      {body}
    </ThemedView>
  );
};

export default Read;
