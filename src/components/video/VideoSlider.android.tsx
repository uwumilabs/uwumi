import React, { useRef } from 'react';
import { Host, Slider } from '@expo/ui/jetpack-compose';
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
  const isSliding = useRef(false);
  const lastValue = useRef(value);
  // Duration is 0 until the video loads; keep the native range non-empty.
  const max = maximumValue > minimumValue ? maximumValue : minimumValue + 1;

  return (
    <Host matchContents={{ vertical: true }} style={{ width: width ?? '100%' }}>
      <Slider
        value={value}
        min={minimumValue}
        max={max}
        colors={{ thumbColor: colors.thumb, activeTrackColor: colors.active, inactiveTrackColor: colors.inactive }}
        onValueChange={(v) => {
          // Compose only reports when a drag ends, so the first change of a drag marks its start.
          if (!isSliding.current) {
            isSliding.current = true;
            onSlidingStart?.();
          }
          lastValue.current = v;
          onValueChange(v);
        }}
        onValueChangeFinished={() => {
          isSliding.current = false;
          onSlidingComplete?.(lastValue.current);
        }}
      />
    </Host>
  );
};
