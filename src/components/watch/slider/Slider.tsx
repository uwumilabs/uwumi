import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import type { SliderProps } from 'react-native-video-toolkit';
import { NativeSlider } from './NativeSlider';
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
    <NativeSlider
      value={value}
      min={minimumValue}
      max={max}
      width={isProgress ? '100%' : (width ?? '100%')}
      colors={colors}
      testID={isProgress ? 'watch-seek-bar' : 'watch-volume'}
      onValueChange={(v) => {
        lastValue.current = v;
        if (isProgress) setScrubTime(v);
        onValueChange(v);
      }}
      onSlidingStart={onSlidingStart}
      onSlidingEnd={() => {
        setScrubTime(null);
        onSlidingComplete?.(lastValue.current);
      }}
    />
  );

  if (!isProgress) return slider;
  return (
    <View style={{ width: width ?? '100%' }}>
      <SeekPreview time={scrubTime} duration={max} />
      {slider}
    </View>
  );
};
