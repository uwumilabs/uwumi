import React, { useCallback, useMemo, useEffect, memo } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Canvas, Circle, Path, SkFont, Text, useFont } from '@shopify/react-native-skia'; // Import Text and useFont
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, useDerivedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
// Type definitions

type Orientation = 'horizontal' | 'vertical';

interface Mark {
  value: number;
  label?: string;
}

interface SkiaSliderProps {
  width?: number;
  height?: number;
  initialValue?: number;
  orientation?: Orientation;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  onSlidingStart?: (value: number) => void;
  trackColor?: string;
  activeTrackColor?: string;
  thumbColor?: string;
  step?: number;
  style?: StyleProp<ViewStyle>;
  minValue?: number;
  maxValue?: number;
  disabled?: boolean;
  disabledTrackColor?: string;
  disabledThumbColor?: string;
  marks?: Mark[];
  showMarks?: boolean;
  markColor?: string;
  showMarkLabels?: boolean;
  markLabelColor?: string;
  markLabelFontSize?: number;
  markLabelFont?: SkFont | null;
  trackThickness?: number;
  thumbSize?: number;
}

// Define a worklet clamp function
// This is necessary because standard Math.min/Math.max might not be
// guaranteed to be worklets depending on the Reanimated version/setup,
// and the error specifically mentioned 'clamp'.
const clamp = (value: number, lower: number, upper: number): number => {
  'worklet'; // Mark this function as a worklet
  return Math.max(Math.min(value, upper), lower);
};

// Define a worklet function to convert normalized value to actual value
const fromNormWorklet = (normalized: number, min: number, max: number): number => {
  'worklet'; // Mark this function as a worklet
  return min + normalized * (max - min);
};

const SkiaSlider: React.FC<SkiaSliderProps> = ({
  width: propWidth,
  height: propHeight,
  orientation = 'horizontal',
  initialValue = 0,
  onValueChange,
  onSlidingComplete,
  onSlidingStart,
  trackColor = '#000',
  activeTrackColor = '#2089DC',
  thumbColor = '#2089DC',
  step = 0,
  style,
  minValue = 0,
  maxValue = 1,
  disabled = false,
  disabledTrackColor = '#BDBDBD',
  disabledThumbColor = '#BDBDBD',
  marks,
  showMarks = false,
  markColor = '#BDBDBD',
  showMarkLabels = false,
  markLabelColor = '#757575',
  markLabelFontSize = 10,
  markLabelFont: propMarkLabelFont, // Use propMarkLabelFont
  trackThickness = 4,
  thumbSize: propThumbSize,
}) => {
  const defaultWidth = orientation === 'horizontal' ? 300 : 40;
  const defaultHeight = orientation === 'horizontal' ? 40 : 300;

  const sliderWidth = propWidth ?? defaultWidth;
  const sliderHeight = propHeight ?? defaultHeight;

  const trackLength = orientation === 'horizontal' ? sliderWidth : sliderHeight;
  // Calculate thumb size based on height/thickness if not provided
  const thumbSize =
    propThumbSize ??
    Math.max(orientation === 'horizontal' ? sliderHeight / 1.5 : sliderWidth / 1.5, trackThickness * 3, 16);

  // Helper for value conversion (JS only - used for initial value and callbacks)
  const toNorm = useCallback(
    (v: number) => clamp((v - minValue) / (maxValue - minValue), 0, 1), // Use JS clamp here
    [minValue, maxValue],
  );

  // Load a default font if propMarkLabelFont is not provided, or use the provided one
  const defaultMarkFont = useFont(require('../../../assets/fonts/SpaceMono-Regular.ttf'), markLabelFontSize); // Replace with a valid font path if needed
  const markLabelFont = propMarkLabelFont ?? defaultMarkFont;

  // Shared value for normalized position (0 to 1)
  const normalized = useSharedValue(toNorm(initialValue));

  // Derived static track path (Memoized as it doesn't change)
  const trackPath = useMemo(() => {
    const halfThumb = thumbSize / 2;
    // Adjust track start/end to account for thumb radius
    const trackStart = halfThumb;
    const trackEnd = trackLength - halfThumb;

    return orientation === 'horizontal'
      ? `M ${trackStart} ${sliderHeight / 2} L ${trackEnd} ${sliderHeight / 2}`
      : `M ${sliderWidth / 2} ${trackStart} L ${sliderWidth / 2} ${trackEnd}`;
  }, [orientation, sliderWidth, sliderHeight, thumbSize, trackLength]);

  // Animated active track path (Derived value runs on UI thread)
  const activePath = useDerivedValue(() => {
    'worklet'; // This entire function is a worklet
    const half = thumbSize / 2;
    const travel = trackLength - thumbSize;
    // Calculate the current position of the thumb center
    const pos = half + normalized.value * travel;

    // Adjust active track path based on orientation and current thumb position
    return orientation === 'horizontal'
      ? `M ${half} ${sliderHeight / 2} L ${pos} ${sliderHeight / 2}`
      : `M ${sliderWidth / 2} ${half} L ${sliderWidth / 2} ${pos}`;
  }, [thumbSize, trackLength, sliderWidth, sliderHeight, orientation]);

  // Animated thumb coordinate (Derived value runs on UI thread)
  const thumbCX = useDerivedValue(() => {
    'worklet'; // This entire function is a worklet
    const half = thumbSize / 2;
    const travel = trackLength - thumbSize;
    // Calculate the center X or Y coordinate for the thumb
    return half + normalized.value * travel;
  }, [thumbSize, trackLength]);

  // Safe JS callbacks (wrapped in useCallback for stability)
  const onChangeJS = useCallback((v: number) => onValueChange?.(v), [onValueChange]);
  const onStartJS = useCallback((v: number) => onSlidingStart?.(v), [onSlidingStart]);
  const onCompleteJS = useCallback((v: number) => onSlidingComplete?.(v), [onSlidingComplete]);

  // Gesture handlers (Pan and Tap)
  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onBegin(() => {
      'worklet'; // This is the worklet context
      // Calculate the actual value at the start of the gesture using the worklet helper
      const actualValue = fromNormWorklet(normalized.value, minValue, maxValue);
      // Run the JS callback on the JS thread
      scheduleOnRN(onStartJS, actualValue);
    })
    .onUpdate((e) => {
      'worklet'; // This is the worklet context
      const coord = orientation === 'horizontal' ? e.x : e.y;
      const travel = trackLength - thumbSize;

      // Calculate the raw normalized position based on gesture coordinate
      // The coordinate is relative to the canvas, so we subtract half thumb size
      // to align the gesture point with the thumb's edge for calculation.
      const rawNorm = (coord - thumbSize / 2) / travel;

      // Clamp the raw normalized position between 0 and 1 using the worklet clamp
      const clampedNorm = clamp(rawNorm, 0, 1);

      let finalNorm = clampedNorm;

      // Apply stepping logic if step is defined and greater than 0
      if (step && step > 0) {
        // Convert normalized value to actual value using the worklet helper
        const actualValue = fromNormWorklet(clampedNorm, minValue, maxValue);
        // Calculate the nearest step value
        const steps = Math.round((actualValue - minValue) / step);
        const snappedValue = minValue + steps * step;
        // Convert the snapped actual value back to normalized using the worklet helper
        // Clamp again to ensure it stays within [0, 1] due to potential floating point inaccuracies after snapping
        finalNorm = clamp((snappedValue - minValue) / (maxValue - minValue), 0, 1);
      }

      // Only update the shared value and trigger the JS callback if the normalized value has changed
      if (normalized.value !== finalNorm) {
        normalized.value = finalNorm;
        // Calculate the actual value to pass to the JS callback using the worklet helper
        const actualValue = fromNormWorklet(finalNorm, minValue, maxValue);
        // Run the JS callback on the JS thread with the actual value
        scheduleOnRN(onChangeJS, actualValue);
      }
    })
    .onEnd(() => {
      'worklet'; // This is the worklet context
      // Calculate the actual value at the end of the gesture using the worklet helper
      const actualValue = fromNormWorklet(normalized.value, minValue, maxValue);
      // Run the JS callback on the JS thread
      scheduleOnRN(onCompleteJS, actualValue);
    });

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .onStart((e) => {
      'worklet'; // This is the worklet context
      const coord = orientation === 'horizontal' ? e.x : e.y;
      const travel = trackLength - thumbSize;

      // Calculate the raw normalized position based on tap coordinate
      const rawNorm = (coord - thumbSize / 2) / travel;

      // Clamp the raw normalized position between 0 and 1 using the worklet clamp
      const clampedNorm = clamp(rawNorm, 0, 1);

      let finalNorm = clampedNorm;

      // Apply stepping logic if step is defined and greater than 0
      if (step && step > 0) {
        // Convert normalized value to actual value using the worklet helper
        const actualValue = fromNormWorklet(clampedNorm, minValue, maxValue);
        // Calculate the nearest step value
        const steps = Math.round((actualValue - minValue) / step);
        const snappedValue = minValue + steps * step;
        // Convert the snapped actual value back to normalized using the worklet helper
        // Clamp again to ensure it stays within [0, 1]
        finalNorm = clamp((snappedValue - minValue) / (maxValue - minValue), 0, 1);
      }

      // Animate the normalized value to the final tapped position
      normalized.value = withTiming(finalNorm, { duration: 150 });

      // Calculate the actual value to pass to the JS callbacks using the worklet helper
      const actualValue = fromNormWorklet(finalNorm, minValue, maxValue);

      // Run the JS callbacks on the JS thread immediately after the animation starts
      // Note: onCompleteJS is called after a timeout to simulate completion after animation.
      // A more robust solution might involve a withTiming callback if available/suitable.
      scheduleOnRN(onChangeJS, actualValue);
      // Use scheduleOnRN  for setTimeout as it's a JS function
      scheduleOnRN(setTimeout, () => scheduleOnRN(onCompleteJS, actualValue), 150);
    });

  // Combine Pan and Tap gestures
  const gesture = Gesture.Exclusive(pan, tap);

  // Keep the shared value in sync if the initialValue prop changes from outside
  useEffect(() => {
    const n = toNorm(initialValue); // Use the JS toNorm here
    // Animate the change if the component is already mounted
    if (normalized.value !== n) {
      normalized.value = withTiming(n, { duration: 150 });
    }
  }, [initialValue, minValue, maxValue, toNorm, normalized]); // Depend on toNorm and normalized

  // Ensure the container View is large enough to accommodate the thumb
  const containerW = orientation === 'vertical' ? Math.max(sliderWidth, thumbSize) : sliderWidth;
  const containerH = orientation === 'horizontal' ? Math.max(sliderHeight, thumbSize) : sliderHeight;

  // Calculate thumb position for rendering (derived value)
  const thumbCY = useDerivedValue(() => {
    'worklet';
    // For horizontal, thumbCY is fixed at sliderHeight/2
    // For vertical, thumbCY is the same as thumbCX (calculated based on normalized value)
    return orientation === 'horizontal' ? sliderHeight / 2 : thumbCX.value;
  }, [orientation, sliderHeight, thumbCX]);

  return (
    // Wrap the slider in a View that controls its size and position
    <View style={[style, { width: containerW, height: containerH, justifyContent: 'center', alignItems: 'center' }]}>
      {/* GestureDetector wraps the interactive element (Canvas) */}
      <GestureDetector gesture={gesture}>
        {/* Canvas draws the slider components */}
        {/* Position the canvas absolutely to fill the container for gesture handling */}
        <Canvas
          style={{
            width: sliderWidth,
            height: sliderHeight,
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          {/* Inactive track */}
          <Path
            path={trackPath}
            strokeWidth={trackThickness}
            color={disabled ? disabledTrackColor : trackColor}
            style="stroke"
            strokeCap="round"
          />

          {/* Active track */}
          <Path
            path={activePath} // This path is animated via useDerivedValue
            strokeWidth={trackThickness}
            color={disabled ? disabledTrackColor : activeTrackColor}
            style="stroke"
            strokeCap="round"
          />

          {/* Marks and Mark Labels */}
          {showMarks &&
            marks &&
            marks.map((mark, index) => {
              // Calculate the normalized position of the mark
              const markNorm = clamp((mark.value - minValue) / (maxValue - minValue), 0, 1);
              // Calculate the canvas coordinate of the mark
              const halfThumb = thumbSize / 2;
              const travel = trackLength - thumbSize;
              const markPos = halfThumb + markNorm * travel;

              // Determine the center coordinates for the mark circle
              const markCX = orientation === 'horizontal' ? markPos : sliderWidth / 2;
              const markCY = orientation === 'vertical' ? markPos : sliderHeight / 2;

              // Determine the position for the mark label
              const labelOffset = 15; // Distance from the track
              const labelX = orientation === 'horizontal' ? markCX : sliderWidth / 2 + labelOffset;
              const labelY = orientation === 'vertical' ? markCY : sliderHeight / 2 + labelOffset;

              // Adjust label position for vertical orientation to be centered vertically
              const adjustedLabelX = orientation === 'vertical' && markLabelFont ? labelX : labelX;
              const adjustedLabelY =
                orientation === 'vertical' && markLabelFont ? labelY + markLabelFont.getSize() / 3 : labelY; // Adjust Y to center vertically

              return (
                <React.Fragment key={index}>
                  {/* Draw the Mark Circle */}
                  <Circle
                    cx={markCX}
                    cy={markCY}
                    r={trackThickness * 1.5} // Mark size relative to track thickness
                    color={markColor}
                  />
                  {/* Draw the Mark Label if applicable */}
                  {showMarkLabels && mark.label && markLabelFont && (
                    <Text
                      x={adjustedLabelX}
                      y={adjustedLabelY}
                      text={mark.label}
                      font={markLabelFont}
                      color={markLabelColor}
                      // @ts-ignore
                      xAlign={orientation === 'horizontal' ? 'center' : 'left'}
                      yAlign={orientation === 'horizontal' ? 'top' : 'middle'}
                    />
                  )}
                </React.Fragment>
              );
            })}

          {/* Thumb */}
          <Circle
            cx={orientation === 'horizontal' ? thumbCX : sliderWidth / 2} // Use thumbCX for horizontal, center for vertical
            cy={thumbCY} // Use thumbCY (derived value)
            r={thumbSize / 2}
            color={disabled ? disabledThumbColor : thumbColor}
          />
        </Canvas>
      </GestureDetector>
    </View>
  );
};

export default memo(SkiaSlider);
