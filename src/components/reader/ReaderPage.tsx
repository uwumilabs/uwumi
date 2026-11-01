import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRecyclingState } from '@shopify/flash-list';
import type { IMangaChapterPage } from 'react-native-consumet';
import { useCurrentTheme } from '@/hooks';
import { isTV } from '@/constants/utils';
import { IoniconsIcon } from '../Icons';

// A typical manga page (width / height), until the real one is known
const DEFAULT_RATIO = 0.7;
// Pages measured so far, by image URL, so a page keeps its height when the list mounts it again
const pageRatios = new Map<string, number>();

/**
 * One page at the screen's width and its own aspect ratio, so long webtoon strips and double pages aren't squashed;
 * with `height`, fitted inside that box instead, for the paged modes. Sends the page's headerForImage, without which
 * some hosts refuse the image (403).
 */
export const ReaderPage = memo(
  ({ page, width, height: boxHeight }: { page: IMangaChapterPage; width: number; height?: number }) => {
    const theme = useCurrentTheme();
    // Reset when the list reuses this row for another page
    const [ratio, setRatio] = useRecyclingState<number | undefined>(() => pageRatios.get(page.img), [page.img]);
    const [error, setError] = useRecyclingState<string | null>(null, [page.img]);
    const [attempt, setAttempt] = useRecyclingState(0, [page.img]);
    const height = boxHeight ?? width / (ratio ?? DEFAULT_RATIO);

    if (error) {
      return (
        <Pressable
          onPress={() => {
            setError(null);
            setAttempt((count) => count + 1);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Page ${page.page} couldn't load. Retry`}
          style={{
            width,
            height: Math.min(height, width * 1.4),
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
          <IoniconsIcon name="refresh" size={28} color={theme.foreground} />
          <Text className="text-base font-semibold text-foreground">{`Page ${page.page} couldn't load`}</Text>
          <Text className="px-8 text-center text-xs text-foreground/60" numberOfLines={2}>
            {error}
          </Text>
          <Text className="text-sm font-semibold text-accent">Tap to retry</Text>
        </Pressable>
      );
    }

    return (
      // TV: each page takes focus, so the D-pad scrolls through the chapter page by page
      <View style={{ width, height }} focusable={isTV}>
        <Image
          key={attempt}
          source={{ uri: page.img, headers: page.headerForImage }}
          style={{ flex: 1 }}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={page.img}
          accessibilityLabel={`Page ${page.page}`}
          onLoad={({ source }) => {
            if (!(source.width > 0 && source.height > 0)) return;
            const measured = source.width / source.height;
            pageRatios.set(page.img, measured);
            setRatio(measured);
          }}
          onError={({ error: message }) => setError(message || 'The image failed to load')}
        />
      </View>
    );
  },
);
ReaderPage.displayName = 'ReaderPage';

export default ReaderPage;
