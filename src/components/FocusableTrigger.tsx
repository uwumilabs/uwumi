import React, { memo, useCallback, useState } from 'react';
import { type ViewStyle, type FocusDestination } from 'react-native';
import { Tabs } from 'heroui-native';
import { isTV } from '@/constants/utils';
import { useCurrentTheme } from '@/hooks';

interface FocusableTriggerProps {
  /** Tab value identifier */
  value: string;
  /** Whether this trigger should receive initial TV focus */
  isFirst?: boolean;
  /** Optional className for the trigger */
  className?: string;
  /** TV: explicit next focus up target */
  nextFocusUp?: FocusDestination;
  children: React.ReactNode;
}

/** TV-aware Tabs.Trigger with D-pad focus ring */
const FocusableTrigger: React.FC<FocusableTriggerProps> = memo(
  ({ value, isFirst = false, className, nextFocusUp, children }) => {
    const currentTheme = useCurrentTheme();
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = useCallback(() => setIsFocused(true), []);
    const handleBlur = useCallback(() => setIsFocused(false), []);

    const focusStyle: ViewStyle | undefined =
      isTV && isFocused
        ? { borderWidth: 2, borderColor: currentTheme?.defaultForeground, borderRadius: 24 }
        : isTV
          ? { borderWidth: 2, borderColor: 'transparent' }
          : undefined;

    return (
      <Tabs.Trigger
        value={value}
        className={className}
        hasTVPreferredFocus={isTV && isFirst ? true : undefined}
        nextFocusUp={isTV ? nextFocusUp : undefined}
        onFocus={isTV ? handleFocus : undefined}
        onBlur={isTV ? handleBlur : undefined}
        style={focusStyle}>
        {children}
      </Tabs.Trigger>
    );
  },
);

export default FocusableTrigger;
