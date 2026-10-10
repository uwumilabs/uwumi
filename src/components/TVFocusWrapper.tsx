/**
 * TVFocusWrapper - A wrapper component that adds D-pad focus support for Android TV.
 *
 * On TV: adds focusable behavior, visual focus ring (animated scale + border),
 * and optional nextFocus directional refs.
 *
 * On phone: renders children as-is with zero overhead.
 */

import React, { memo } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { isTV, tvFocusRingStyle } from '@/constants/utils';
import { useCurrentTheme } from '@/hooks';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface TVFocusWrapperProps extends PressableProps {
  /** Visual border color on focus. Defaults to the current theme accent. */
  focusBorderColor?: string;
  /** Border width when focused. Default: 2 */
  focusBorderWidth?: number;
  /** Scale multiplier when focused. Default: 1.05 */
  focusScale?: number;
  /** Border radius of the focus ring. Default: 12 */
  focusBorderRadius?: number;
  /** Whether this element should receive initial focus when the screen mounts (TV only). */
  hasTVPreferredFocus?: boolean;
  /** Custom container style applied to outer wrapper */
  containerStyle?: StyleProp<ViewStyle>;
  /** Directional focus targets (TV only) */
  nextFocusUp?: PressableProps['nextFocusUp'];
  nextFocusDown?: PressableProps['nextFocusDown'];
  nextFocusLeft?: PressableProps['nextFocusLeft'];
  nextFocusRight?: PressableProps['nextFocusRight'];
  children?: React.ReactNode;
}

const TVFocusWrapper: React.FC<TVFocusWrapperProps> = memo(
  ({
    focusBorderColor,
    focusBorderWidth = 2,
    focusScale = 1.05,
    focusBorderRadius = 12,
    hasTVPreferredFocus,
    containerStyle,
    nextFocusUp,
    nextFocusDown,
    nextFocusLeft,
    nextFocusRight,
    onFocus: onFocusProp,
    onBlur: onBlurProp,
    style,
    children,
    ...pressableProps
  }) => {
    const currentTheme = useCurrentTheme();
    const borderColor = focusBorderColor ?? currentTheme?.accent;

    // On phone, render a plain View wrapper with no overhead
    if (!isTV) {
      return (
        <Pressable style={style} {...pressableProps}>
          {children}
        </Pressable>
      );
    }

    // TV path: the focus ring is driven natively by the `:focus` pseudo selector
    const focusRing = tvFocusRingStyle({
      color: borderColor,
      scale: focusScale,
      borderWidth: focusBorderWidth,
      borderRadius: focusBorderRadius,
      duration: 15,
    });

    return (
      <AnimatedPressable
        {...pressableProps}
        focusable={true}
        hasTVPreferredFocus={hasTVPreferredFocus}
        nextFocusUp={nextFocusUp}
        nextFocusDown={nextFocusDown}
        nextFocusLeft={nextFocusLeft}
        nextFocusRight={nextFocusRight}
        onFocus={onFocusProp}
        onBlur={onBlurProp}
        style={[style, focusRing, containerStyle]}>
        {children}
      </AnimatedPressable>
    );
  },
);

TVFocusWrapper.displayName = 'TVFocusWrapper';

export default TVFocusWrapper;
