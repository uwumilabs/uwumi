import React from 'react';
import { View } from 'react-native';
import { cn } from 'heroui-native';
import { HUXStack } from './ui-primitives';
import { useCurrentTheme } from '@/hooks';

interface ProgressProps {
  value?: number;
  className?: string;
  minTrackColor?: string;
  maxTrackColor?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value = 0, className, minTrackColor, maxTrackColor }) => {
  const clamped = Math.max(0, Math.min(100, value));
  const currentTheme = useCurrentTheme();
  return (
    <HUXStack className={cn('items-center gap-2', className)}>
      <View
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: minTrackColor || currentTheme.default }}>
        <View
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, backgroundColor: maxTrackColor || currentTheme.accent }}
        />
      </View>
    </HUXStack>
  );
};

export default Progress;
