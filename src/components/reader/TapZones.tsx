import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { css } from 'react-native-reanimated';
import type { InvertTapZones, TapZonesLayout } from '@/hooks';

export type TapAction = 'next' | 'previous' | 'menu';

// left, top, right, bottom, as fractions of the screen
type Rect = [number, number, number, number];
type Region = { rect: Rect; action: Exclude<TapAction, 'menu'> };

// Mihon's navigation layouts. A tap outside every region opens the menu
const LAYOUTS: Record<TapZonesLayout, Region[]> = {
  'l-shaped': [
    { rect: [0, 0.33, 0.33, 0.66], action: 'previous' },
    { rect: [0, 0, 1, 0.33], action: 'previous' },
    { rect: [0.66, 0.33, 1, 0.66], action: 'next' },
    { rect: [0, 0.66, 1, 1], action: 'next' },
  ],
  kindlish: [
    { rect: [0.33, 0.33, 1, 1], action: 'next' },
    { rect: [0, 0.33, 0.33, 1], action: 'previous' },
  ],
  edge: [
    { rect: [0, 0, 0.33, 1], action: 'next' },
    { rect: [0.33, 0.66, 0.66, 1], action: 'previous' },
    { rect: [0.66, 0, 1, 1], action: 'next' },
  ],
  'right-left': [
    { rect: [0, 0, 0.33, 1], action: 'previous' },
    { rect: [0.66, 0, 1, 1], action: 'next' },
  ],
  disabled: [],
};

// Right to left reads leftwards, so the right-and-left zones swap, as Mihon's left and right do
const regionsFor = (layout: TapZonesLayout, invert: InvertTapZones, rtl = false): Region[] => {
  const flipX = invert === 'horizontal' || invert === 'both';
  const flipY = invert === 'vertical' || invert === 'both';
  const swap = rtl && layout === 'right-left';
  return LAYOUTS[layout].map(({ rect: [left, top, right, bottom], action }) => ({
    action: swap ? (action === 'next' ? 'previous' : 'next') : action,
    rect: [flipX ? 1 - right : left, flipY ? 1 - bottom : top, flipX ? 1 - left : right, flipY ? 1 - top : bottom],
  }));
};

/** What a tap does, at `x` and `y` as fractions of the screen */
export const tapActionAt = (
  x: number,
  y: number,
  layout: TapZonesLayout,
  invert: InvertTapZones,
  rtl = false,
): TapAction =>
  regionsFor(layout, invert, rtl).find(
    ({ rect: [left, top, right, bottom] }) => x >= left && x < right && y >= top && y < bottom,
  )?.action ?? 'menu';

const ZONES: Record<Region['action'], { label: string; color: string }> = {
  next: { label: 'Next', color: 'rgba(132, 226, 150, 0.8)' },
  previous: { label: 'Previous', color: 'rgba(255, 119, 51, 0.8)' },
};

/** The zones in Mihon's colours, fading out after a moment. Mounted as the reader opens. */
export const TapZonesOverlay = ({
  layout,
  invert,
  rtl,
}: {
  layout: TapZonesLayout;
  invert: InvertTapZones;
  rtl?: boolean;
}) => (
  <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, overlayStyles.fade]}>
    {regionsFor(layout, invert, rtl).map(({ rect: [left, top, right, bottom], action }, index) => (
      <View
        key={index}
        style={[
          styles.zone,
          {
            left: `${left * 100}%`,
            top: `${top * 100}%`,
            width: `${(right - left) * 100}%`,
            height: `${(bottom - top) * 100}%`,
            backgroundColor: ZONES[action].color,
          },
        ]}>
        <Text style={styles.label}>{ZONES[action].label}</Text>
      </View>
    ))}
    {tapActionAt(0.5, 0.5, layout, invert) === 'menu' && (
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.label}>Menu</Text>
      </View>
    )}
  </Animated.View>
);

const styles = StyleSheet.create({
  zone: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowRadius: 4,
  },
});

const overlayStyles = css.create({
  fade: {
    opacity: 0,
    animationName: css.keyframes({ from: { opacity: 1 }, '70%': { opacity: 1 }, to: { opacity: 0 } }),
    animationDuration: 3000,
    animationTimingFunction: 'ease-in',
  },
});
