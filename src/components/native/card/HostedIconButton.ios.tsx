import React from 'react';
import { Button } from '@expo/ui/swift-ui';
import { accessibilityIdentifier, accessibilityLabel, buttonStyle } from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { HostedIcon, type HostedIconButtonProps } from './card';

export const HostedIconButton = ({ icon, label, onPress, testID, size = 20 }: HostedIconButtonProps) => {
  const { foreground } = useCurrentTheme();
  return (
    <Button
      onPress={onPress}
      modifiers={[
        buttonStyle('plain'),
        accessibilityLabel(label),
        ...(testID ? [accessibilityIdentifier(testID)] : []),
      ]}>
      <HostedIcon name={icon} size={size} color={foreground} />
    </Button>
  );
};
