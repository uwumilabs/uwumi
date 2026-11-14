import React from 'react';
import { View } from 'react-native';
import { cn } from '../../heroui';
import { Host, ProgressView } from '@expo/ui/swift-ui';
import { background, progressViewStyle, shapes, tint } from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import type { ProgressProps } from './Progress';

export const Progress: React.FC<ProgressProps> = ({ value = 0, indeterminate, className }) => {
  const currentTheme = useCurrentTheme();
  const progress = Math.max(0, Math.min(100, value)) / 100;

  return (
    <View className={cn('self-stretch', className)}>
      <Host matchContents={{ vertical: true }} ignoreSafeArea="container" style={{ width: '100%' }}>
        <ProgressView
          value={indeterminate ? undefined : progress}
          modifiers={[
            progressViewStyle('linear'),
            tint(currentTheme.accent),
            background(currentTheme.default, shapes.capsule()),
          ]}
        />
      </Host>
    </View>
  );
};
