import React from 'react';
import { View } from 'react-native';
import { cn } from '../../heroui';
import { Host, LinearProgressIndicator } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import type { ProgressLineProps, ProgressProps } from './Progress';

export const ProgressLine = ({ value = 0, indeterminate }: ProgressLineProps) => {
  const currentTheme = useCurrentTheme();
  return (
    <LinearProgressIndicator
      progress={indeterminate ? null : Math.max(0, Math.min(100, value)) / 100}
      color={currentTheme.accent}
      trackColor={currentTheme.default}
      modifiers={[fillMaxWidth()]}
    />
  );
};

export const Progress: React.FC<ProgressProps> = ({ className, ...line }) => (
  <View className={cn('self-stretch', className)}>
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <ProgressLine {...line} />
    </Host>
  </View>
);
