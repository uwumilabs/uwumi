import { StyleSheet, useWindowDimensions } from 'react-native';
import { View, Text, ScrollView, YStack } from 'tamagui';
import React from 'react';
import Animated, { Extrapolation, SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { OnboardingData } from '../assets/data';
import LottieView from 'lottie-react-native';
import { SUB_LANGUAGE } from '@/constants/config';
import { Heart } from '@tamagui/lucide-icons';
import { RippleButton } from '@/components/ui-primitives';
import { ThemedView } from '@/components/ui-primitives';
import { useExternalSubtitleStore } from '@/hooks';

type Props = {
  index: number;
  x: SharedValue<number>;
  item: OnboardingData;
};

const AnimatedView = Animated.createAnimatedComponent(View);

const RenderItem = ({ index, x, item }: Props) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { preferedLanguages, setPreferedLanguages } = useExternalSubtitleStore();

  const lottieAnimationStyle = useAnimatedStyle(() => {
    const translateYAnimation = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [200, 0, -200],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY: translateYAnimation }],
    };
  });

  const circleAnimation = useAnimatedStyle(() => {
    const scale = interpolate(
      x.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [1, 4, 4],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale: scale }],
    };
  });

  return (
    <ThemedView flex={1} justifyContent="space-around" alignItems="center" marginBottom={120} width={SCREEN_WIDTH}>
      <View style={styles.circleContainer}>
        <AnimatedView
          style={[
            {
              width: SCREEN_WIDTH,
              height: SCREEN_WIDTH,
              borderRadius: SCREEN_WIDTH / 2,
              backgroundColor: item.backgroundColor,
            },
            circleAnimation,
          ]}
        />
      </View>
      {item.animated && (
        <AnimatedView style={lottieAnimationStyle}>
          <LottieView
            source={item.animation}
            style={{
              width: SCREEN_WIDTH * 0.9,
              height: SCREEN_WIDTH * 0.9,
            }}
            autoPlay
            loop
          />
        </AnimatedView>
      )}
      {item.animated ? (
        <Text style={[styles.itemText, { color: item.textColor }]}>{item.text}</Text>
      ) : (
        <YStack padding="$3">
          <ScrollView contentContainerStyle={{ padding: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}>
              {Object.keys(SUB_LANGUAGE).map((lang, index) => (
                <RippleButton
                  onPress={() => {
                    //console.log(`Selected language: ${preferedLanguages} type of ${typeof preferedLanguages}`);
                    setPreferedLanguages([...(preferedLanguages || []), lang]);
                  }}
                  key={index}
                  style={{
                    width: '48%',
                    marginBottom: 16,
                    backgroundColor: '#1f1f1f',
                    borderRadius: 12,
                    padding: 10,
                    position: 'relative',
                  }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                    }}>
                    <Heart size={16} color="white" />
                  </View>

                  {/* <CustomImage
                    source={{ uri: 'https://flagsapi.com/BE/flat/64.png' }}
                    style={{
                      width: '100%',
                      height: 120,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                    resizeMode="cover"
                  /> */}

                  {/* Language name */}
                  <Text color="white" fontWeight="600" textAlign="center">
                    {lang}
                  </Text>
                </RippleButton>
              ))}
            </View>
          </ScrollView>
        </YStack>
      )}
    </ThemedView>
  );
};

export default RenderItem;

const styles = StyleSheet.create({
  itemText: {
    textAlign: 'center',
    fontSize: 44,
    fontWeight: 'bold',
    marginBottom: 10,
    marginHorizontal: 20,
  },
  circleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
