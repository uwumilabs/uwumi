import { useMemo } from 'react';
import { useSharedValue, type ScrollEvent, type SharedValue } from 'react-native-reanimated';

/** The info page's scroll, which its header follows: where the page is, and how far it can go */
export interface PageScroll {
  y: SharedValue<number>;
  max: SharedValue<number>;
}

export const usePageScroll = (): PageScroll => {
  const y = useSharedValue(0);
  const max = useSharedValue(0);
  return useMemo(() => ({ y, max }), [y, max]);
};

/** Call from the page's scroll handler */
export const trackPageScroll = (scroll: PageScroll, event: ScrollEvent) => {
  'worklet';
  scroll.y.set(event.contentOffset.y);
  scroll.max.set(event.contentSize.height - event.layoutMeasurement.height);
};
