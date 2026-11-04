import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Host, Slider as NativeSlider } from '@expo/ui/jetpack-compose';
import type { SliderProps } from 'react-native-video-toolkit';
import { SeekPreview } from './SeekPreview';

export const Slider = ({
  variant,
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
  // Where the thumb is while it's dragged, for the seek preview
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  // Duration is 0 until the video loads; keep the native range non-empty.
  const max = maximumValue > minimumValue ? maximumValue : minimumValue + 1;
  const isProgress = variant === 'progress';

  const slider = (
    <Host matchContents={{ vertical: true }} style={{ width: isProgress ? '100%' : (width ?? '100%') }}>
      <NativeSlider
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
          if (isProgress) setScrubTime(v);
          onValueChange(v);
        }}
        onValueChangeFinished={() => {
          isSliding.current = false;
          setScrubTime(null);
          onSlidingComplete?.(lastValue.current);
        }}
      />
    </Host>
  );

  if (!isProgress) return slider;
  return (
    <View style={{ width: width ?? '100%' }}>
      <SeekPreview time={scrubTime} duration={max} />
      {slider}
    </View>
  );
};
