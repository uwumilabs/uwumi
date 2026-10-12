import { Image as ExpoImage, ImageStyle } from 'expo-image';
import React, { forwardRef } from 'react';
import { StyleProp } from 'react-native';
import Animated from 'react-native-reanimated';

type ImageProps = {
  source: string | { uri: string; width?: number; height?: number };
  style?: StyleProp<ImageStyle>;
  [key: string]: any;
};

export const Image = forwardRef<ExpoImage, ImageProps>((props, ref) => {
  const { source, style, cachePolicy = 'memory-disk', ...rest } = props;
  const imageSource = typeof source === 'string' ? { uri: source } : source;

  return (
    <ExpoImage
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

Image.displayName = 'Image';

// Create animated version of the forwarded ref component
export const AnimatedImage = Animated.createAnimatedComponent(Image);

export default Image;
