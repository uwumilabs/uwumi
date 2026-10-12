import React from 'react';
import { View } from 'react-native';
import { cn } from 'heroui-native';
import { Host, LinearProgressIndicator } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { useCurrentTheme } from '@/hooks';
import type { ProgressProps } from './Progress';

export const Progress: React.FC<ProgressProps> = ({ value = 0, className, minTrackColor, maxTrackColor }) => {
  const currentTheme = useCurrentTheme();
  const progress = Math.max(0, Math.min(100, value)) / 100;

  return (
    <View className={cn('self-stretch', className)}>
      <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
        <LinearProgressIndicator
          progress={progress}
          color={maxTrackColor || currentTheme.accent}
          trackColor={minTrackColor || currentTheme.default}
          modifiers={[fillMaxWidth()]}
        />
      </Host>
    </View>
  );
};

export default Progress;
