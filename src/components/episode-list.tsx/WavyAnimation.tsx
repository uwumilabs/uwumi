import { memo } from 'react';
import { cubicBezier, createAnimatedComponent, CSSAnimationKeyframes } from 'react-native-reanimated';
import { View, XStack } from 'tamagui';
const keyframes: CSSAnimationKeyframes = {
  '0%': { transform: [{ scaleY: 1.0 }] },
  '50%': { transform: [{ scaleY: 0.4 }] },
  '100%': { transform: [{ scaleY: 1.0 }] },
};

const AnimatedView = createAnimatedComponent(View);

export const WavyAnimation = () => {
  return (
    <XStack height={12} gap={2}>
      {[1, 2, 3, 4, 5].map((i, idx) => (
        <AnimatedView
          key={idx}
          backgroundColor="$color4"
          height="100%"
          width={2}
          borderRadius={4}
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
    </XStack>
  );
};

export default memo(WavyAnimation);
