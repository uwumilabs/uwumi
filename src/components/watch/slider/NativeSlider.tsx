import type React from 'react';
import type { SliderProps } from 'react-native-video-toolkit';

export interface NativeSliderProps {
  value: number;
  min: number;
  max: number;
  width: number | '100%';
  colors: SliderProps['colors'];
  testID: string;
  onValueChange: (value: number) => void;
  onSlidingStart?: () => void;
  onSlidingEnd: () => void;
}

// Platforms other than Android and iOS have no native slider
export const NativeSlider: React.FC<NativeSliderProps> = () => null;
