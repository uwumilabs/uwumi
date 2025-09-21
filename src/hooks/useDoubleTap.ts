/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import Animated, {
  measure,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface UseDoubleTapGestureProps {
  videoRef: React.RefObject<any>;
  isLocked?: boolean;
  seekInterval?: number;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
}

export const useDoubleTapGesture = ({
  videoRef,
  isLocked = false,
  seekInterval = 10,
  onSeekStart,
  onSeekEnd,
}: UseDoubleTapGestureProps) => {
  const [isDoubleTap, setIsDoubleTap] = useState(false);
  const tapCount = useSharedValue(0);
  const lastTap = useRef(0);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation values
  const forwardOpacity = useSharedValue(0);
  const backwardOpacity = useSharedValue(0);
  const scaleValue = useSharedValue(1);

  // Separate counters for consecutive taps
  const consecutiveTapCount = useRef({
    forward: 0,
    backward: 0,
    lastDirection: null as 'forward' | 'backward' | null,
    lastTapTime: 0,
  });

  const [doubleTapValue, setDoubleTapValue] = useState({
    forward: 0,
    backward: 0,
  });

  // Ripple effect states
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0.3);
  const boxWidth = useSharedValue(0);
  const boxHeight = useSharedValue(0);

  const backwardRippleRef = useAnimatedRef();
  const forwardRippleRef = useAnimatedRef();
  const activeDirection = useSharedValue<'forward' | 'backward' | null>(null);

  const resetConsecutiveCount = useCallback(
    (direction: 'forward' | 'backward') => {
      consecutiveTapCount.current = {
        forward: 0,
        backward: 0,
        lastDirection: null,
        lastTapTime: 0,
      };
      setDoubleTapValue((prev) => ({
        ...prev,
        [direction]: seekInterval,
      }));
    },
    [seekInterval],
  );

  const showTapAnimation = useCallback(
    (direction: 'forward' | 'backward') => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      const animationValue = direction === 'forward' ? forwardOpacity : backwardOpacity;

      animationValue.value = withSequence(withSpring(1), withTiming(0, { duration: 250 }));

      scaleValue.value = withSequence(withSpring(1.2), withSpring(1));

      animationTimeoutRef.current = setTimeout(() => {
        runOnJS(resetConsecutiveCount)(direction);
      }, 1000);
    },
    [forwardOpacity, backwardOpacity, scaleValue, resetConsecutiveCount],
  );

  const handleSeek = useCallback(
    async (direction: 'forward' | 'backward') => {
      if (!videoRef.current) return;

      const now = Date.now();
      const timeSinceLastTap = now - consecutiveTapCount.current.lastTapTime;
      const isConsecutive = timeSinceLastTap < 500 && direction === consecutiveTapCount.current.lastDirection;

      try {
        const currentTime = await videoRef.current.getCurrentPosition();
        const seekAmount = direction === 'forward' ? seekInterval : -seekInterval;
        const newPosition = Math.max(currentTime + seekAmount, 0);

        videoRef.current.seek(newPosition);

        if (isConsecutive) {
          consecutiveTapCount.current[direction]++;
          setDoubleTapValue((prev) => ({
            ...prev,
            [direction]: seekInterval * (consecutiveTapCount.current[direction] + 1),
          }));
        } else {
          consecutiveTapCount.current = {
            forward: 0,
            backward: 0,
            lastDirection: direction,
            lastTapTime: now,
          };
          setDoubleTapValue((prev) => ({
            ...prev,
            [direction]: seekInterval,
          }));
        }

        consecutiveTapCount.current.lastDirection = direction;
        consecutiveTapCount.current.lastTapTime = now;

        runOnJS(showTapAnimation)(direction);
      } catch (error) {
        console.error('Seek failed:', error);
      }
    },
    [videoRef, seekInterval, showTapAnimation],
  );

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .onStart((event) => {
          if (isLocked) return;

          const now = Date.now();
          const timeSinceLastTap = now - lastTap.current;
          lastTap.current = now;

          if (timeSinceLastTap > 500) {
            tapCount.value = 0;
          }

          runOnJS(setIsDoubleTap)(true);
          if (onSeekStart) {
            runOnJS(onSeekStart)();
          }

          const touchX = event.absoluteX;
          const screenMidPoint = Dimensions.get('window').width / 2;
          const direction = touchX < screenMidPoint ? 'backward' : 'forward';
          activeDirection.value = direction;

          // Store the actual touch coordinates
          translateX.value = event.x;
          translateY.value = event.y;
          rippleScale.value = 0;
          rippleScale.value = withTiming(1, { duration: 500 });
          rippleOpacity.value = 0.4;

          runOnJS(handleSeek)(direction);
        })
        .onEnd(() => {
          runOnJS(setIsDoubleTap)(false);
          if (onSeekEnd) {
            runOnJS(onSeekEnd)();
          }
          rippleOpacity.value = withTiming(0, { duration: 500 });
          //console.log('double tap');
        })
        .runOnJS(true),
    [
      isLocked,
      onSeekStart,
      activeDirection,
      translateX,
      translateY,
      rippleScale,
      rippleOpacity,
      handleSeek,
      tapCount,
      onSeekEnd,
    ],
  );

  const backwardAnimatedRipple = useAnimatedStyle(() => {
    if (activeDirection.value !== 'backward') {
      return { opacity: 0 };
    }
    const boxLayout = measure(backwardRippleRef);
    if (!boxLayout) return { opacity: 0 };

    if (boxLayout) {
      boxWidth.value = boxLayout.width;
      boxHeight.value = boxLayout.height;
    }

    const radius = Math.sqrt(boxWidth.value ** 2 + boxHeight.value ** 2);
    const width = radius * 2;
    const height = radius * 2;

    return {
      width,
      height,
      borderRadius: radius,
      backgroundColor: 'white',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 1,
      opacity: rippleOpacity.value,
      transform: [
        { translateX: translateX.value - radius },
        { translateY: translateY.value - radius },
        { scale: rippleScale.value },
      ],
    };
  });

  const forwardAnimatedRipple = useAnimatedStyle(() => {
    if (activeDirection.value !== 'forward') {
      return { opacity: 0 };
    }
    const boxLayout = measure(forwardRippleRef);
    if (!boxLayout) return { opacity: 0 };

    if (boxLayout) {
      boxWidth.value = boxLayout.width;
      boxHeight.value = boxLayout.height;
    }

    const radius = Math.sqrt(boxWidth.value ** 2 + boxHeight.value ** 2);
    const width = radius * 2;
    const height = radius * 2;

    // Use the actual touch coordinates for forward ripple too
    return {
      width,
      height,
      borderRadius: radius,
      backgroundColor: 'white',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 1,
      opacity: rippleOpacity.value,
      transform: [
        { translateX: translateX.value - radius },
        { translateY: translateY.value - radius },
        { scale: rippleScale.value },
      ],
    };
  });

  const createDirectionalStyle = (opacityValue: Animated.SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: opacityValue.value,
      transform: [{ scale: scaleValue.value }],
    }));

  const forwardAnimatedStyle = createDirectionalStyle(forwardOpacity);
  const backwardAnimatedStyle = createDirectionalStyle(backwardOpacity);

  return {
    doubleTapGesture,
    isDoubleTap,
    doubleTapValue,
    backwardRippleRef,
    forwardRippleRef,
    backwardAnimatedRipple,
    forwardAnimatedRipple,
    forwardAnimatedStyle,
    backwardAnimatedStyle,
  };
};

export default useDoubleTapGesture;
