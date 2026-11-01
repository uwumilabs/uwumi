import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { isTV } from '@/constants/utils';
import { IoniconsIcon } from './Icons';

interface ListJumpBarProps {
  visible: boolean;
  onTop: () => void;
  /** From the container's bottom edge; clear of the navigation bar by default, for full-screen lists */
  bottom?: number;
}

/**
 * Floating back-to-top button for long lists, once they're scrolled far. Render it over the list's container; the
 * range picker sits with the list's other controls.
 */
export const ListJumpBar = ({ visible, onTop, bottom }: ListJumpBarProps) => {
  const insets = useSafeAreaInsets();
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 200 }),
    transform: [{ translateY: withTiming(visible ? 0 : 24, { duration: 200 }) }],
  }));

  // D-pad users move through the list itself
  if (isTV) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[styles.bar, { bottom: bottom ?? insets.bottom + 16 }, animatedStyle]}>
      <Button isIconOnly size="sm" onPress={onTop} accessibilityLabel="Back to top">
        <IoniconsIcon name="arrow-up" size={18} className="text-accent-foreground" />
      </Button>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});

export default ListJumpBar;
