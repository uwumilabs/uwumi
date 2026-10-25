import React, { forwardRef } from 'react';
import type { PressableStateCallbackType } from 'react-native';
import { Button as HeroButton } from 'heroui-native';
import { isTV, tvFocusRingStyle } from '@/constants/utils';
import { useCurrentTheme } from '@/hooks';

type ButtonProps = React.ComponentProps<typeof HeroButton>;

// heroui's Button shows no D-pad focus, so on TV this adds the app's focus ring
const TVButton = forwardRef<React.ComponentRef<typeof HeroButton>, ButtonProps>(({ style, ...props }, ref) => {
  const currentTheme = useCurrentTheme();
  // An accent ring would disappear against a primary button's accent background
  const isPrimary = (props.variant ?? 'primary') === 'primary';
  // No scale: full-width buttons would grow past their container; the ring alone shows focus
  const ring = tvFocusRingStyle({ color: isPrimary ? currentTheme?.foreground : currentTheme?.accent, scale: 1 });
  return (
    <HeroButton
      ref={ref}
      // The press-scale animated style sits on the same view and stops the ring's :focus styles from applying
      isAnimatedStyleActive={false}
      style={typeof style === 'function' ? (state: PressableStateCallbackType) => [ring, style(state)] : [ring, style]}
      {...props}
    />
  );
});
TVButton.displayName = 'Button';

// Phones use heroui's Button as is
export const Button: typeof HeroButton = isTV
  ? (Object.assign(TVButton, { Label: HeroButton.Label, Background: HeroButton.Background }) as typeof HeroButton)
  : HeroButton;
