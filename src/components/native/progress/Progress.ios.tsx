import React from 'react';
import { View } from 'react-native';
import { cn } from '../../heroui';
import { Host, ProgressView } from '@expo/ui/swift-ui';
import { background, progressViewStyle, shapes, tint } from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks';
import type { ProgressProps } from './Progress';

export const Progress: React.FC<ProgressProps> = ({ value = 0, className, minTrackColor, maxTrackColor }) => {
  const currentTheme = useCurrentTheme();
  const progress = Math.max(0, Math.min(100, value)) / 100;

  return (
    <View className={cn('self-stretch', className)}>
      <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
        <ProgressView
          value={progress}
          modifiers={[
            progressViewStyle('linear'),
            tint(maxTrackColor || currentTheme.accent),
            background(minTrackColor || currentTheme.default, shapes.capsule()),
          ]}
        />
      </Host>
    </View>
  );
};

export default Progress;
