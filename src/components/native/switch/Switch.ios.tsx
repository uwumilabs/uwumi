import React from 'react';
import { View } from 'react-native';
import { Host, Toggle } from '@expo/ui/swift-ui';
import { disabled as disabledModifier, labelsHidden, tint } from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks';
import type { SwitchProps } from './Switch';

// SwiftUI only lets the on colour change, so it takes heroui's accent
export const Switch: React.FC<SwitchProps> = ({ value, onValueChange, disabled }) => {
  const theme = useCurrentTheme();
  return (
    <View pointerEvents={onValueChange ? 'auto' : 'none'}>
      <Host matchContents ignoreSafeArea="container">
        <Toggle
          isOn={value}
          onIsOnChange={onValueChange}
          modifiers={[labelsHidden(), tint(theme.accent), disabledModifier(!!disabled)]}
        />
      </Host>
    </View>
  );
};

export default Switch;
