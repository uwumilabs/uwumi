import React from 'react';
import { View } from 'react-native';
import { cn } from '../../heroui';
import { Host, ProgressView } from '@expo/ui/swift-ui';
import { background, controlSize, progressViewStyle, shapes, tint } from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import type { ProgressLineProps, ProgressProps } from './Progress';

// iOS has no moving indeterminate bar (a linear ProgressView without a value stays still), so unknown progress is its spinner
export const ProgressLine = ({ value = 0, indeterminate }: ProgressLineProps) => {
  const currentTheme = useCurrentTheme();
  if (indeterminate) {
    return (
      <ProgressView modifiers={[progressViewStyle('circular'), controlSize('small'), tint(currentTheme.accent)]} />
    );
  }
  return (
    <ProgressView
      value={Math.max(0, Math.min(100, value)) / 100}
      modifiers={[
        progressViewStyle('linear'),
        tint(currentTheme.accent),
        background(currentTheme.default, shapes.capsule()),
      ]}
    />
  );
};

export const Progress: React.FC<ProgressProps> = ({ className, ...line }) => (
  <View className={cn('self-stretch', className)}>
    <Host matchContents={{ vertical: true }} ignoreSafeArea="container" style={{ width: '100%' }}>
      <ProgressLine {...line} />
    </Host>
  </View>
);
