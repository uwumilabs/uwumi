import { useLayoutEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useNavigation } from 'expo-router';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useCurrentTheme } from './useCurrentTheme';
import { usePureBlackBackground } from './stores/useThemeStore';

// The header fades in as the artwork's title nears it, and is solid by a third of the artwork (h-75 in InfoHeader)
const FADE_FROM = 40;
const SOLID_AT = 100;

const SolidHeaderBackground = ({ scrollY, color }: { scrollY: SharedValue<number>; color: string }) => {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [FADE_FROM, SOLID_AT], [0, 1], 'clamp'),
  }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: color }, style]} />;
};

/**
 * Android: the see-through header over the info screen's artwork fades to solid as the page scrolls, as
 * Material toolbars do, so the back and favorite buttons don't sit on the text. iOS keeps its own glass header.
 * The fade runs on the UI thread with the scroll; returns the scroll handler, for an Animated scroll view or list.
 */
export const useSolidHeaderOnScroll = () => {
  const navigation = useNavigation();
  const theme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const background = pureBlackBackground ? '#000' : theme.background;
  const scrollY = useSharedValue(0);

  useLayoutEffect(() => {
    if (Platform.OS !== 'android') return;
    navigation.setOptions({ headerBackground: () => <SolidHeaderBackground scrollY={scrollY} color={background} /> });
  }, [navigation, scrollY, background]);

  return useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });
};
