import { Platform, type ColorValue, type ViewStyle } from 'react-native';

export const isTV = Platform.isTV;

// D-pad focus ring via Reanimated pseudo selectors (toggled natively, no JS); needs a Reanimated-rendered view.
export const tvFocusRingStyle = ({
  color,
  scale = 1.05,
  borderWidth = 2,
  borderRadius,
  duration = 180,
}: {
  color: ColorValue | undefined;
  scale?: number;
  borderWidth?: number;
  borderRadius?: number;
  duration?: number;
}): ViewStyle =>
  ({
    borderWidth,
    ...(borderRadius != null && { borderRadius }),
    borderColor: { default: 'transparent', ':focus': color },
    transform: { default: [{ scale: 1 }], ':focus': [{ scale }] },
    transitionProperty: ['borderColor', 'transform'],
    transitionDuration: duration,
    transitionTimingFunction: 'ease-out',
  }) as unknown as ViewStyle;

// TV: moving focus scrolls natively and animated, lining the focused item's `scrollSnapAlign` marker up at
// `padding` from the edge (otherwise Android jumps, and only far enough to get the item on screen)
export const tvFocusScrollProps = (padding: number) =>
  isTV
    ? ({
        snapToAlignment: 'item',
        snapToItemPadding: padding,
        scrollAnimationDuration: 220,
        scrollAnimationEasing: 'ease-out',
      } as const)
    : undefined;

export const TV_SNAP_CENTER = isTV ? ('center' as const) : undefined;
