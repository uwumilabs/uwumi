import React, { memo, useCallback, useState } from 'react';
import { type ViewStyle } from 'react-native';
import { Tabs } from './heroui';
import { isTV } from '@/utils/tv';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';

interface FocusableTriggerProps {
  value: string;
  /** Whether this trigger should receive initial TV focus */
  isFirst?: boolean;
  className?: string;
  testID?: string;
  children: React.ReactNode;
}

/** TV-aware Tabs.Trigger with D-pad focus ring */
const FocusableTrigger: React.FC<FocusableTriggerProps> = memo(
  ({ value, isFirst = false, className, testID, children }) => {
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
        testID={testID}
        value={value}
        className={className}
        hasTVPreferredFocus={isTV && isFirst ? true : undefined}
        onFocus={isTV ? handleFocus : undefined}
        onBlur={isTV ? handleBlur : undefined}
        style={focusStyle}>
        {children}
      </Tabs.Trigger>
    );
  },
);

FocusableTrigger.displayName = 'FocusableTrigger';

export default FocusableTrigger;
