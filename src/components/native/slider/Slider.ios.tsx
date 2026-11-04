import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Host, Slider as NativeSlider } from '@expo/ui/swift-ui';
import { tint } from '@expo/ui/swift-ui/modifiers';
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
  const lastValue = useRef(value);
  // Where the thumb is while it's dragged, for the seek preview
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  // Duration is 0 until the video loads; keep the native `min...max` range non-empty.
  const max = maximumValue > minimumValue ? maximumValue : minimumValue + 1;
  const isProgress = variant === 'progress';

  const slider = (
    <Host matchContents={{ vertical: true }} style={{ width: isProgress ? '100%' : (width ?? '100%') }}>
      <NativeSlider
        value={value}
        min={minimumValue}
        max={max}
        onValueChange={(v) => {
          lastValue.current = v;
          if (isProgress) setScrubTime(v);
          onValueChange(v);
        }}
        onEditingChanged={(isEditing) => {
          if (isEditing) return onSlidingStart?.();
          setScrubTime(null);
          onSlidingComplete?.(lastValue.current);
        }}
        modifiers={[tint(colors.active)]}
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
