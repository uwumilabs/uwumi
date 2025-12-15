import { memo } from 'react';
import Animated, { cubicBezier, CSSAnimationKeyframes } from 'react-native-reanimated';
import { HUXStack } from '../ui-primitives';
const keyframes: CSSAnimationKeyframes = {
  '0%': { transform: [{ scaleY: 1.0 }] },
  '50%': { transform: [{ scaleY: 0.4 }] },
  '100%': { transform: [{ scaleY: 1.0 }] },
};

export const WavyAnimation = () => {
  return (
    <HUXStack className="h-3 gap-0.5">
      {[1, 2, 3, 4, 5].map((i, idx) => (
        <Animated.View
          key={idx}
          className="h-full w-0.5 rounded-full bg-default"
          // @ts-ignore
          style={{
            animationName: keyframes,
            animationDuration: '0.9s',
            animationTimingFunction: cubicBezier(0.85, 0.25, 0.37, 0.85),
            animationIterationCount: 'infinite',
            animationDelay: (() => {
              if (idx === 2 || idx === 4) return '0.2s';
              if (idx === 1 || idx === 5) return '0.4s';
              return '0s';
            })(),
          }}
        />
      ))}
    </HUXStack>
  );
};

export default memo(WavyAnimation);
