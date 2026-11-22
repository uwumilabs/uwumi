import React from 'react';
import { View } from 'react-native';
import { cn } from '../../heroui';
import { Host, ProgressView } from '@expo/ui/swift-ui';
import { background, controlSize, progressViewStyle, shapes, tint } from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { progressFraction } from './shared';
import type { ProgressLineProps, ProgressProps } from './Progress';

// A linear ProgressView without a value stays still, so unknown progress is iOS's spinner
export const ProgressLine = ({ value, indeterminate }: ProgressLineProps) => {
  const currentTheme = useCurrentTheme();
  if (indeterminate) {
    return (
      <ProgressView modifiers={[progressViewStyle('circular'), controlSize('small'), tint(currentTheme.accent)]} />
    );
  }
  return (
    <ProgressView
      value={progressFraction(value)}
      modifiers={[
        progressViewStyle('linear'),
        tint(currentTheme.accent),
        background(currentTheme.default, shapes.capsule()),
      ]}
    />
  );
};

export const Progress: React.FC<ProgressProps> = ({ className, value }) => (
  <View className={cn('self-stretch', className)}>
    <Host matchContents={{ vertical: true }} ignoreSafeArea="container" style={{ width: '100%' }}>
      <ProgressLine value={value} />
    </Host>
  </View>
);
