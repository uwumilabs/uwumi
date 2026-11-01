import React from 'react';
import { View } from 'react-native';
import { Host, Toggle } from '@expo/ui/swift-ui';
import { background, disabled as disabledModifier, labelsHidden, shapes, tint } from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks';
import type { SwitchProps } from './Switch';

export const toggleModifiers = (theme: ReturnType<typeof useCurrentTheme>) => [
  labelsHidden(),
  tint(theme.accent),
  background(theme.default, shapes.capsule()),
];

export const Switch: React.FC<SwitchProps> = ({ value, onValueChange, disabled }) => {
  const theme = useCurrentTheme();
  return (
    <View pointerEvents={onValueChange ? 'auto' : 'none'}>
      <Host matchContents ignoreSafeArea="container">
        <Toggle
          isOn={value}
          onIsOnChange={onValueChange}
          modifiers={[...toggleModifiers(theme), disabledModifier(!!disabled)]}
        />
      </Host>
    </View>
  );
};

export default Switch;
