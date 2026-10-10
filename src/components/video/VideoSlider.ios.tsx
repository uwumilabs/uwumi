import React, { useRef } from 'react';
import { Host, Slider } from '@expo/ui/swift-ui';
import { tint } from '@expo/ui/swift-ui/modifiers';
import type { SliderProps } from 'react-native-video-toolkit';

export const VideoSlider = ({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  width,
  colors,
}: SliderProps) => {
  const lastValue = useRef(value);
  // Duration is 0 until the video loads; keep the native `min...max` range non-empty.
  const max = maximumValue > minimumValue ? maximumValue : minimumValue + 1;

  return (
    <Host matchContents={{ vertical: true }} style={{ width: width ?? '100%' }}>
      <Slider
        value={value}
        min={minimumValue}
        max={max}
        onValueChange={(v) => {
          lastValue.current = v;
          onValueChange(v);
        }}
        onEditingChanged={(isEditing) => (isEditing ? onSlidingStart?.() : onSlidingComplete?.(lastValue.current))}
        modifiers={[tint(colors.active)]}
      />
    </Host>
  );
};
