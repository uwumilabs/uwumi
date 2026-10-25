import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { isTV } from '@/constants/utils';
import type { ListRange } from '@/hooks/useListJump';
import { IoniconsIcon } from './Icons';
import Select from './Select';
import { HUXStack } from './ui-primitives';

interface ListJumpBarProps {
  visible: boolean;
  onTop: () => void;
  ranges: ListRange[];
  rangeValue: string;
  onRangeChange: (value: string) => void;
  rangesLabel: string;
}

/** Floating back-to-top button, plus the range picker for long lists. Render it over the list's container. */
export const ListJumpBar = ({ visible, onTop, ranges, rangeValue, onRangeChange, rangesLabel }: ListJumpBarProps) => {
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
      style={[styles.bar, { bottom: insets.bottom + 16 }, animatedStyle]}>
      <HUXStack className="items-center gap-2">
        <Button isIconOnly size="sm" onPress={onTop} accessibilityLabel="Back to top">
          <IoniconsIcon name="arrow-up" size={18} className="text-accent-foreground" />
        </Button>
        {ranges.length > 0 && (
          <Select
            size="sm"
            SelectItem={ranges}
            SelectLabel={rangesLabel}
            value={rangeValue}
            onValueChange={onRangeChange}
          />
        )}
      </HUXStack>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});

export default ListJumpBar;
