import React, { memo } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { isTV, tvFocusRingStyle } from '@/utils/tv';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface TVFocusWrapperProps extends PressableProps {
  focusBorderColor?: string;
  focusBorderWidth?: number;
  focusScale?: number;
  /** Corner radius of the content inside the ring; the ring adds its border width so the corners stay concentric. */
  focusBorderRadius?: number;
  /** Whether this element should receive initial focus when the screen mounts (TV only). */
  hasTVPreferredFocus?: boolean;
  /** TV only: style around the focus ring, such as room for it to scale into */
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** A pressable that D-pad focus can land on, with a focus ring on TV; a plain Pressable on phones */

const TVFocusWrapper: React.FC<TVFocusWrapperProps> = memo(
  ({
    focusBorderColor,
    focusBorderWidth = 2,
    focusScale = 1.05,
    focusBorderRadius = 10,
    hasTVPreferredFocus,
    containerStyle,
    style,
    children,
    ...pressableProps
  }) => {
    const currentTheme = useCurrentTheme();
    const borderColor = focusBorderColor ?? currentTheme?.accent;

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
      borderRadius: focusBorderRadius + focusBorderWidth,
    });

    return (
      <AnimatedPressable
        {...pressableProps}
        focusable={true}
        hasTVPreferredFocus={hasTVPreferredFocus}
        style={[style, focusRing, containerStyle]}>
        {children}
      </AnimatedPressable>
    );
  },
);

TVFocusWrapper.displayName = 'TVFocusWrapper';

export default TVFocusWrapper;
