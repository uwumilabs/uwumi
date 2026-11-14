import React, { useRef } from 'react';
import { Host, Slider as ComposeSlider } from '@expo/ui/jetpack-compose';
import { testID as testTag } from '@expo/ui/jetpack-compose/modifiers';
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
}: NativeSliderProps) => {
  const isSliding = useRef(false);

  return (
    <Host matchContents={{ vertical: true }} style={{ width }}>
      <ComposeSlider
        value={value}
        min={min}
        max={max}
        colors={{ thumbColor: colors.thumb, activeTrackColor: colors.active, inactiveTrackColor: colors.inactive }}
        modifiers={[testTag(testID)]}
        onValueChange={(v) => {
          // Compose only reports when a drag ends, so the first change of a drag marks its start.
          if (!isSliding.current) {
            isSliding.current = true;
            onSlidingStart?.();
          }
          onValueChange(v);
        }}
        onValueChangeFinished={() => {
          isSliding.current = false;
          onSlidingEnd();
        }}
      />
    </Host>
  );
};
