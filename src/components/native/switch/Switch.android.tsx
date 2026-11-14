import React from 'react';
import { View } from 'react-native';
import { Host, Switch as ComposeSwitch } from '@expo/ui/jetpack-compose';
import { testID as testTag } from '@expo/ui/jetpack-compose/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import type { SwitchProps } from './Switch';

/**
 * heroui's switch colours for a Compose switch: an accent track and accent-foreground thumb when on, the default
 * track and a white thumb when off, and no border. Also used by the native list's toggle rows.
 */
export const switchColors = (theme: ReturnType<typeof useCurrentTheme>) => ({
  checkedTrackColor: theme.accent,
  checkedThumbColor: theme.accentForeground,
  checkedBorderColor: theme.accent,
  uncheckedTrackColor: theme.default,
  uncheckedThumbColor: '#ffffff',
  uncheckedBorderColor: theme.default,
});

export const Switch: React.FC<SwitchProps> = ({ value, onValueChange, disabled, testID }) => {
  const theme = useCurrentTheme();
  // Without a handler Compose leaves it unclickable, so it takes no focus either, and taps reach the row
  return (
    <View pointerEvents={onValueChange ? 'auto' : 'none'}>
      <Host matchContents>
        <ComposeSwitch
          value={value}
          enabled={!disabled}
          onCheckedChange={onValueChange}
          colors={switchColors(theme)}
          modifiers={testID ? [testTag(testID)] : undefined}
        />
      </Host>
    </View>
  );
};
