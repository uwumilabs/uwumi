import React from 'react';
import { Background, Capsule, Host, Slider as SwiftUISlider } from '@expo/ui/swift-ui';
import { accessibilityIdentifier, foregroundStyle, frame, tint } from '@expo/ui/swift-ui/modifiers';
import type { NativeSliderProps } from './NativeSlider';

// The system track's thickness; SwiftUI can't colour its unfilled part, so a capsule behind it does
const TRACK_HEIGHT = 6;

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
    <Background>
      <Background.Content>
        <Capsule modifiers={[foregroundStyle(colors.inactive), frame({ height: TRACK_HEIGHT })]} />
      </Background.Content>
      <SwiftUISlider
        value={value}
        min={min}
        max={max}
        onValueChange={onValueChange}
        onEditingChanged={(isEditing) => (isEditing ? onSlidingStart?.() : onSlidingEnd())}
        modifiers={[tint(colors.active), accessibilityIdentifier(testID)]}
      />
    </Background>
  </Host>
);
