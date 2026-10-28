import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import { useAnimatedReaction, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useCurrentTheme } from './useCurrentTheme';
import { usePureBlackBackground } from './stores/useThemeStore';

// A third of the info screen's artwork (h-75 in InfoHeader): its title and details start sliding under the header
const SOLID_AFTER = 100;

/**
 * Android: the see-through header over the info screen's artwork turns solid once the page scrolls, as
 * Material toolbars do, so the back and favorite buttons don't sit on the text. iOS keeps its own glass header.
 * Returns the scroll handler, for an Animated scroll view or list; JS only hears of it when the header flips.
 */
export const useSolidHeaderOnScroll = () => {
  const navigation = useNavigation();
  const theme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const background = pureBlackBackground ? '#000' : theme.background;
  const scrollY = useSharedValue(0);

  const setSolid = useCallback(
    (solid: boolean) => navigation.setOptions({ headerStyle: { backgroundColor: solid ? background : 'transparent' } }),
    [navigation, background],
  );
  useAnimatedReaction(
    () => scrollY.get() > SOLID_AFTER,
    (solid, wasSolid) => {
      if (Platform.OS === 'android' && wasSolid !== null && solid !== wasSolid) scheduleOnRN(setSolid, solid);
    },
  );
  return useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });
};
