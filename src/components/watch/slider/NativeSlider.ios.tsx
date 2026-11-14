import React from 'react';
import { Host, Slider as SwiftUISlider } from '@expo/ui/swift-ui';
import { accessibilityIdentifier, tint } from '@expo/ui/swift-ui/modifiers';
import type { NativeSliderProps } from './NativeSlider';

export const NativeSlider = ({
  value,
  min,
  max,
  width,
  colors,
  testID,
  onValueChange,
  onSlidingStart,
  onSlidingEnd,
}: NativeSliderProps) => (
  <Host matchContents={{ vertical: true }} style={{ width }}>
    <SwiftUISlider
      value={value}
      min={min}
      max={max}
      onValueChange={onValueChange}
      onEditingChanged={(isEditing) => (isEditing ? onSlidingStart?.() : onSlidingEnd())}
      modifiers={[tint(colors.active), accessibilityIdentifier(testID)]}
    />
  </Host>
);
