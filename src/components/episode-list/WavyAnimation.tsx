import { memo } from 'react';
import Animated, { css, cubicBezier } from 'react-native-reanimated';
import { HUXStack } from '../ui-primitives';

const bar = {
  animationName: css.keyframes({
    '0%': { transform: [{ scaleY: 1.0 }] },
    '50%': { transform: [{ scaleY: 0.4 }] },
    '100%': { transform: [{ scaleY: 1.0 }] },
  }),
  animationDuration: '0.9s',
  animationTimingFunction: cubicBezier(0.85, 0.25, 0.37, 0.85),
  animationIterationCount: 'infinite',
} as const;

// The middle bar leads and the outer ones follow, so the wave runs out from the centre
const styles = css.create({
  middle: { ...bar, animationDelay: '0s' },
  inner: { ...bar, animationDelay: '0.2s' },
  outer: { ...bar, animationDelay: '0.4s' },
});
const BARS = [styles.outer, styles.inner, styles.middle, styles.inner, styles.outer];

const WavyAnimationView = () => (
  <HUXStack className="h-3 gap-0.5">
    {BARS.map((style, index) => (
      <Animated.View key={index} className="h-full w-0.5 rounded-full bg-default" style={style} />
    ))}
  </HUXStack>
);

export const WavyAnimation = memo(WavyAnimationView);
WavyAnimation.displayName = 'WavyAnimation';
