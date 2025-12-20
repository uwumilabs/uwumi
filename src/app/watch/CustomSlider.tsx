import React, { useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { Slider } from 'react-native-awesome-slider';
import { useCurrentTheme } from '@/hooks';
import { formatTime } from '@/constants/utils';

interface CustomSliderProps {
  value: number;
  min: number;
  max: number;
  onValueChange?: (value: number) => void;
}

const CustomSlider: React.FC<CustomSliderProps> = ({ value, min, max, onValueChange }) => {
  const progress = useSharedValue(value);
  const minimumValue = useSharedValue(min);
  const maximumValue = useSharedValue(max);
  const currentTheme = useCurrentTheme();
  const [isFocused, setIsFocused] = useState(false);
  const sliderRef = useRef<any>(null);

  // Update shared values when props change
  useEffect(() => {
    progress.value = value;
  }, [value, progress]);

  useEffect(() => {
    minimumValue.value = min;
  }, [min, minimumValue]);

  useEffect(() => {
    maximumValue.value = max;
  }, [max, maximumValue]);

  // Standard slider for non-TV platforms
  return (
    <Slider
      theme={{
        minimumTrackTintColor: currentTheme?.accent,
        maximumTrackTintColor: '#000',
        bubbleBackgroundColor: currentTheme?.accent,
      }}
      progress={progress}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      onValueChange={onValueChange}
      bubble={() => formatTime(value)}
      containerStyle={{ borderRadius: 2 }}
      bubbleTextStyle={{ color: currentTheme?.foreground }}
    />
  );
};

export default CustomSlider;
