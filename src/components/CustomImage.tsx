import { Image, ImageStyle } from 'expo-image';
import React, { forwardRef } from 'react';
import { StyleProp } from 'react-native';
import Animated from 'react-native-reanimated';

type CustomImageProps = {
  source: string | { uri: string; width?: number; height?: number };
  style?: StyleProp<ImageStyle>;
  [key: string]: any;
};

export const CustomImage = forwardRef<Image, CustomImageProps>((props, ref) => {
  const { source, style, cachePolicy = 'memory-disk', ...rest } = props;
  const imageSource = typeof source === 'string' ? { uri: source } : source;

  return (
    <Image
      ref={ref}
      source={imageSource}
      cachePolicy="memory-disk"
      transition={200}
      recyclingKey={typeof source === 'string' ? source : source?.uri}
      style={[{ overflow: 'hidden' }, style]}
      {...rest}
    />
  );
});

CustomImage.displayName = 'CustomImage';

// Create animated version of the forwarded ref component
export const AnimatedCustomImage = Animated.createAnimatedComponent(CustomImage);

export default CustomImage;
