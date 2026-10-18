import { RefObject, useCallback, useMemo, useState } from 'react';
import type { FlashListRef, ViewToken } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useAnimatedReaction, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { isTV } from '@/constants/utils';

const RANGE_SIZE = 100;
const JUMP_BAR_SCREENS = 1.5;
export const LIST_SHADOW_SIZE = 48;
// Half an item must show to count, so the sliver a jump leaves above its target (the shadow offset) doesn't pull the
// range label back to the previous range
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

export interface ListRange {
  name: string;
  value: string;
}

interface UseListJumpOptions<T> {
  items: T[];
  listRef: RefObject<FlashListRef<T> | null>;
  /** Label for the range spanning these indices, e.g. "EP 1–100" */
  rangeLabel: (startIndex: number, endIndex: number) => string;
}

/**
 * Back to top and "EP 1–100"-style range jumps for long FlashLists. Spread `listProps` on a Reanimated-animated
 * list (such as one inside heroui's ScrollShadow) and pass `jumpBar` to ListJumpBar.
 */
export function useListJump<T>({ items, listRef, rangeLabel }: UseListJumpOptions<T>) {
  const scrollY = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const [jumpBarVisible, setJumpBarVisible] = useState(false);
  const [visibleRangeStart, setVisibleRangeStart] = useState(0);

  const ranges = useMemo(() => {
    if (items.length <= RANGE_SIZE) return [];
    const result: ListRange[] = [];
    for (let start = 0; start < items.length; start += RANGE_SIZE) {
      const end = Math.min(start + RANGE_SIZE, items.length) - 1;
      result.push({ name: rangeLabel(start, end), value: String(start) });
    }
    return result;
  }, [items, rangeLabel]);
  const rangeValue = String(
    Math.min(visibleRangeStart, Math.floor(Math.max(items.length - 1, 0) / RANGE_SIZE) * RANGE_SIZE),
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<T>[] }) => {
    const first = Math.min(...viewableItems.map((token) => token.index ?? Infinity));
    if (Number.isFinite(first)) setVisibleRangeStart(Math.floor(first / RANGE_SIZE) * RANGE_SIZE);
  }, []);

  const jumpToRange = useCallback(
    (value: string) => {
      const index = Number(value);
      setVisibleRangeStart(index);
      listRef.current?.scrollToIndex({ index, animated: true, viewOffset: -LIST_SHADOW_SIZE });
    },
    [listRef],
  );

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
    viewportHeight.set(event.layoutMeasurement.height);
  });
  useAnimatedReaction(
    () => scrollY.get() > viewportHeight.get() * JUMP_BAR_SCREENS,
    (isFar, wasFar) => {
      if (isFar !== wasFar) scheduleOnRN(setJumpBarVisible, isFar);
    },
  );

  const scrollToTop = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    if (!isTV) Haptics.selectionAsync();
    // Jump to two screens from the top first, as FlashList's scrollToIndex does, so the animation doesn't fly
    // past thousands of rows it can't render in time
    const glideDistance = viewportHeight.get() * 2;
    if (scrollY.get() > glideDistance) list.scrollToOffset({ offset: glideDistance, animated: false });
    requestAnimationFrame(() => list.scrollToOffset({ offset: 0, animated: true }));
  }, [listRef, scrollY, viewportHeight]);

  // A remounted list starts at the top, but the last offset lingers until it scrolls
  const resetScroll = useCallback(() => scrollY.set(0), [scrollY]);

  return {
    listProps: { onScroll, onViewableItemsChanged, viewabilityConfig: VIEWABILITY_CONFIG },
    ranges,
    rangeValue,
    jumpToRange,
    resetScroll,
    jumpBar: { visible: jumpBarVisible, onTop: scrollToTop, ranges, rangeValue, onRangeChange: jumpToRange },
  };
}
