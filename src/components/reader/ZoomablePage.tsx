import React from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';

const DOUBLE_TAP_SCALE = 2.5;
const MAX_SCALE = 4;
const ZOOM = { duration: 220 };
// A finger that moves further is swiping or panning, not tapping
const TAP_SLOP = 10;

interface ZoomablePageProps {
  width: number;
  height: number;
  /** A single tap, where it landed on screen. It waits out a possible double tap, as Mihon's does */
  onTap: (x: number, y: number) => void;
  /** Zoomed in or back out; the list stops paging while zoomed, so a drag pans the page instead */
  onZoomChange: (zoomed: boolean) => void;
  children: React.ReactNode;
}

/**
 * A paged-mode page that zooms like Mihon's: a double tap zooms in on the spot tapped (and back out), a pinch zooms
 * freely, and a drag pans around the zoomed page without letting its edges inside the screen.
 */
export const ZoomablePage = ({ width, height, onTap, onZoomChange, children }: ZoomablePageProps) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const start = useSharedValue({ scale: 1, x: 0, y: 0 });
  const zoomed = useSharedValue(false);

  const clamp = (value: number, zoom: number, size: number) => {
    'worklet';
    const limit = (size * (zoom - 1)) / 2;
    return Math.min(limit, Math.max(-limit, value));
  };
  const setZoomed = (next: boolean) => {
    'worklet';
    if (zoomed.get() === next) return;
    zoomed.set(next);
    scheduleOnRN(onZoomChange, next);
  };
  const zoomTo = (zoom: number, x: number, y: number) => {
    'worklet';
    scale.set(withTiming(zoom, ZOOM));
    translateX.set(withTiming(x, ZOOM));
    translateY.set(withTiming(y, ZOOM));
    start.set({ scale: zoom, x, y });
    setZoomed(zoom > 1);
  };

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    maxDistance: TAP_SLOP,
    onDeactivate: (event) => {
      'worklet';
      if (event.canceled) return;
      if (scale.get() > 1) return zoomTo(1, 0, 0);
      // The spot tapped stays under the finger
      const x = clamp((width / 2 - event.x) * (DOUBLE_TAP_SCALE - 1), DOUBLE_TAP_SCALE, width);
      const y = clamp((height / 2 - event.y) * (DOUBLE_TAP_SCALE - 1), DOUBLE_TAP_SCALE, height);
      zoomTo(DOUBLE_TAP_SCALE, x, y);
    },
  });
  const singleTap = useTapGesture({
    maxDistance: TAP_SLOP,
    onDeactivate: (event) => {
      'worklet';
      if (!event.canceled) scheduleOnRN(onTap, event.absoluteX, event.absoluteY);
    },
  });
  const pinch = usePinchGesture({
    onUpdate: (event) => {
      'worklet';
      const from = start.get();
      const zoom = Math.min(MAX_SCALE, Math.max(1, from.scale * event.scale));
      // The point between the fingers stays where it is
      const focusX = event.focalX - width / 2;
      const focusY = event.focalY - height / 2;
      scale.set(zoom);
      translateX.set(clamp(focusX - ((focusX - from.x) / from.scale) * zoom, zoom, width));
      translateY.set(clamp(focusY - ((focusY - from.y) / from.scale) * zoom, zoom, height));
    },
    onDeactivate: () => {
      'worklet';
      if (scale.get() < 1.05) return zoomTo(1, 0, 0);
      start.set({ scale: scale.get(), x: translateX.get(), y: translateY.get() });
      setZoomed(true);
    },
  });
  const pan = usePanGesture({
    enabled: zoomed,
    onUpdate: (event) => {
      'worklet';
      const from = start.get();
      translateX.set(clamp(from.x + event.translationX, from.scale, width));
      translateY.set(clamp(from.y + event.translationY, from.scale, height));
    },
    onDeactivate: () => {
      'worklet';
      start.set({ scale: scale.get(), x: translateX.get(), y: translateY.get() });
    },
  });
  const taps = useExclusiveGestures(doubleTap, singleTap);
  const gesture = useSimultaneousGestures(pinch, pan, taps);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }, { translateY: translateY.get() }, { scale: scale.get() }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height, overflow: 'hidden' }]}>
        <Animated.View style={[{ width, height }, style]}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

export default ZoomablePage;
