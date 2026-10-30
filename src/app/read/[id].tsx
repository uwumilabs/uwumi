import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, Text, View, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { IMangaChapter, IMangaChapterPage } from 'react-native-consumet';
import { HUXStack, HUYStack, IoniconsIcon, ListEmptyState, ThemedView } from '@/components';
import { Button } from '@/components/Button';
import { ReaderPage } from '@/components/reader/ReaderPage';
import { getProviders } from '@/constants/provider';
import { MediaType } from '@/constants/types';
import { mangaProgressKey, useChapterPages, useCurrentTheme, useMangaChapters, useMangaProgressStore } from '@/hooks';
import { adjacentChapters, chapterNumbers, chapterTitle } from '@/utils/manga';

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

/**
 * A chapter's pages, top to bottom. `id` is the AniList manga; `chapter` and `provider` say which chapter on which
 * provider, so the chapter list (for previous and next) comes from the same cached query as the info screen's.
 */
const Read = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    id,
    chapter: chapterId,
    provider,
  } = useLocalSearchParams<{ id: string; chapter: string; provider: string }>();
  const chapters = useMangaChapters({ id, provider });
  const pages = useChapterPages({ chapterId, provider });
  const markRead = useMangaProgressStore((state) => state.markRead);
  const { current, previous, next } = adjacentChapters(chapters.data ?? [], chapterId);
  const providerName = getProviders()[MediaType.MANGA].find(({ value }) => value === provider)?.name ?? provider;
  const title = current ? chapterTitle(current) : 'Chapter';

  // A chapter counts as read once its pages load
  const loaded = !!pages.data?.length;
  useEffect(() => {
    if (loaded && current) markRead(mangaProgressKey(id, provider), { id: current.id, title: chapterTitle(current) });
  }, [loaded, current, id, provider, markRead]);

  const openChapter = useCallback(
    (chapter: IMangaChapter) =>
      router.replace({ pathname: '/read/[id]', params: { id, chapter: chapter.id, provider } }),
    [router, id, provider],
  );
  const nav = <ChapterNav previous={previous} next={next} onOpen={openChapter} />;

  const renderItem = useCallback(
    ({ item }: { item: IMangaChapterPage }) => <ReaderPage page={item} width={width} />,
    [width],
  );

  let body: React.ReactNode;
  if (pages.isLoading) {
    body = (
      <HUYStack className="flex-1 items-center justify-center gap-3">
        <ActivityIndicator size="large" />
        <Text className="text-sm text-foreground/60">{`Loading pages from ${providerName}…`}</Text>
      </HUYStack>
    );
  } else if (pages.error || !pages.data?.length) {
    body = (
      <View className="flex-1">
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
      <FlashList
        // A new chapter starts at its first page
        key={chapterId}
        data={pages.data}
        keyExtractor={(page) => `${page.page}-${page.img}`}
        renderItem={renderItem}
        ListHeaderComponent={nav}
        ListFooterComponent={nav}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <ThemedView>
      <Stack.Screen options={{ title, headerBackTitle: chapterNumbers(current) || undefined }} />
      {body}
    </ThemedView>
  );
};

export default Read;
