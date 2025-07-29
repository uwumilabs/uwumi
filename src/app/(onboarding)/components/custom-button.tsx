import { FlatList, StyleSheet, TouchableWithoutFeedback, useWindowDimensions } from 'react-native';
import React from 'react';
import Animated, {
  AnimatedRef,
  SharedValue,
  interpolateColor,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { OnboardingData } from '../assets/data';
import { useRouter } from 'expo-router';
import { useOnboardingFlowStore } from '@/hooks';

type Props = {
  dataLength: number;
  flatListIndex: SharedValue<number>;
  flatListRef: AnimatedRef<FlatList<OnboardingData>>;
  x: SharedValue<number>;
};

const CustomButton = ({ flatListRef, flatListIndex, dataLength, x }: Props) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const router = useRouter();
  const { setHasCompletedOnboarding } = useOnboardingFlowStore();

  const buttonAnimationStyle = useAnimatedStyle(() => {
    return {
      width:
        flatListIndex.value === dataLength - 1
          ? withSpring(140) // Get Started
          : flatListIndex.value === dataLength - 2
            ? withSpring(160) // Choose Language
            : withSpring(60), // Arrow
      height: 60,
    };
  });

  const arrowAnimationStyle = useAnimatedStyle(() => {
    return {
      width: 30,
      height: 30,
      opacity: flatListIndex.value === 0 ? withTiming(1) : withTiming(0),
      transform: [
        {
          translateX: flatListIndex.value === 0 ? withTiming(0) : withTiming(100),
        },
      ],
    };
  });

  const textAnimationStyle = useAnimatedStyle(() => {
    return {
      opacity: flatListIndex.value === dataLength - 1 ? withTiming(1) : withTiming(0),
      transform: [
        {
          translateX: flatListIndex.value === dataLength - 1 ? withTiming(0) : withTiming(-100),
        },
      ],
    };
  });

  const chooseLanguageTextStyle = useAnimatedStyle(() => {
    return {
      opacity: flatListIndex.value === dataLength - 2 ? withTiming(1) : withTiming(0),
      transform: [
        {
          translateX: flatListIndex.value === dataLength - 2 ? withTiming(0) : withTiming(-100),
        },
      ],
    };
  });

  const animatedColor = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      x.value,
      [0, SCREEN_WIDTH, 2 * SCREEN_WIDTH],
      ['#005b4f', '#1e2169', '#F15937'],
    );

    return {
      backgroundColor: backgroundColor,
    };
  });

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (flatListIndex.value < dataLength - 1) {
          flatListRef.current?.scrollToIndex({ index: flatListIndex.value + 1 });
        } else {
          setHasCompletedOnboarding(true);
          router.replace('/(tabs)');
        }
      }}>
      <Animated.View style={[styles.container, buttonAnimationStyle, animatedColor]}>
        <Animated.Text style={[styles.textButton, textAnimationStyle]}>Get Started</Animated.Text>
        <Animated.Text style={[styles.textButton, chooseLanguageTextStyle]}>Choose Language</Animated.Text>
        <Animated.Image
          source={{
            uri: 'https://github.com/Rakha112/react-native-animation/blob/main/season1/src/13-React-Native-Onboarding-Screen-2/src/assets/images/ArrowIcon.png?raw=true',
          }}
          style={[styles.arrow, arrowAnimationStyle]}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e2169',
    padding: 10,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  arrow: {
    position: 'absolute',
  },
  textButton: { color: 'white', fontSize: 14, position: 'absolute' },
});
