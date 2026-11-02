import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useBackHandler } from '@/hooks';
import { shareImage } from '@/constants/utils';
import { Button } from './Button';
import { Portal } from './heroui';
import { IoniconsIcon } from './Icons';
import { ZoomablePage } from './ZoomablePage';
import { HUXStack } from './ui-primitives';

interface ImagePreviewProps {
  uri: string;
  visible: boolean;
  onClose: () => void;
  /** Names the shared file */
  title?: string;
}

/**
 * An image full screen, like Aniyomi's cover dialog: pinch or double tap to zoom, tap or swipe down to close, and
 * share it. In heroui's portal, over the screen and its header.
 */
export const ImagePreview = ({ uri, visible, onClose, title }: ImagePreviewProps) => {
  useBackHandler(visible, () => {
    onClose();
    return true;
  });
  if (!visible) return null;
  return (
    <Portal name="image-preview">
      <PreviewContent uri={uri} onClose={onClose} title={title} />
    </Portal>
  );
};

const PreviewContent = ({ uri, onClose, title }: Omit<ImagePreviewProps, 'visible'>) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Mounted with each opening, so a swipe from the last one doesn't carry over
  const swipeProgress = useSharedValue(0);
  const backdrop = useAnimatedStyle(() => ({ opacity: 1 - swipeProgress.get() }));

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFill}>
      <StatusBar style="light" />
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]} />
      <ZoomablePage width={width} height={height} onTap={onClose} onSwipeDown={onClose} swipeProgress={swipeProgress}>
        <Image source={{ uri }} style={styles.fill} contentFit="contain" cachePolicy="memory-disk" />
      </ZoomablePage>
      <View pointerEvents="box-none" style={[styles.bar, { top: insets.top + 8 }]}>
        <HUXStack className="justify-between px-3">
          <Button isIconOnly variant="ghost" onPress={onClose} accessibilityLabel="Close">
            <IoniconsIcon name="close" size={26} color="white" />
          </Button>
          <Button isIconOnly variant="ghost" onPress={() => shareImage(uri, title)} accessibilityLabel="Share">
            <IoniconsIcon name="share-social-outline" size={24} color="white" />
          </Button>
        </HUXStack>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { backgroundColor: 'black' },
  bar: { position: 'absolute', left: 0, right: 0 },
});

export default ImagePreview;
