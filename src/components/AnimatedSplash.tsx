import React, { useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  type ExitAnimationsValues,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import LottieView from 'lottie-react-native';
import * as SplashScreen from 'expo-splash-screen';

const animation = require('../../assets/animations/uwumi-splash.json');
const DURATION_MS = ((animation.op - animation.ip) / animation.fr) * 1000;
// After the animation, how long it may wait for the app; offline or slow, the app shows anyway
const MAX_WAIT_MS = 1500;

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

const EXIT_MS = 550;
// The overlay zooms toward the viewer as it fades, so the app shows through it instead of cutting in
const zoomThrough = (_: ExitAnimationsValues) => {
  'worklet';
  const timing = { duration: EXIT_MS, easing: Easing.inOut(Easing.cubic) };
  return {
    initialValues: { opacity: 1, transform: [{ scale: 1 }] },
    animations: { opacity: withTiming(0, timing), transform: [{ scale: withTiming(1.6, timing) }] },
  };
};

/**
 * The launch animation, over the app while it loads underneath. The native splash is plain black, so it hands over
 * as soon as the animation is on screen. It fades out once the animation has played and the app is `ready`.
 */
export const AnimatedSplash = ({ ready }: { ready: boolean }) => {
  const { width, height } = useWindowDimensions();
  const size = Math.min(Math.min(width, height) * 0.8, 420);
  const [played, setPlayed] = useState(false);
  const [waitedEnough, setWaitedEnough] = useState(false);
  const started = useRef(false);
  const progress = useSharedValue(0);
  const animatedProps = useAnimatedProps(() => ({ progress: progress.get() }));

  const onPlayed = () => {
    setPlayed(true);
    setTimeout(() => setWaitedEnough(true), MAX_WAIT_MS);
  };

  // Starts once it's on screen, which is also when the native splash can go
  const start = () => {
    if (started.current) return;
    started.current = true;
    SplashScreen.hideAsync();
    progress.set(
      withTiming(1, { duration: DURATION_MS, easing: Easing.linear }, (finished) => {
        if (finished) scheduleOnRN(onPlayed);
      }),
    );
  };

  if (played && (ready || waitedEnough)) return null;
  return (
    <Animated.View testID="splash-overlay" exiting={zoomThrough} style={[StyleSheet.absoluteFill, styles.screen]}>
      <AnimatedLottieView
        source={animation}
        animatedProps={animatedProps}
        onLayout={start}
        style={{ width: size, height: size }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
});
