import React, { forwardRef, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { MediaType, MetaProvider } from '@/constants/types';
import { MediaFormat, TvType } from 'react-native-consumet';
import { IoniconsIcon, RippleButton } from '@/components';
import { useCurrentTheme, useFavoriteStore } from '@/hooks';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { isTV } from '@/constants/utils';

export const AnimatedFavoriteButton = forwardRef<View, Record<string, any>>((props, ref) => {
  // const { id, ...itemData } = props;
  const { mediaType, metaProvider, type, provider, id, image, title } = useLocalSearchParams<{
    mediaType: MediaType;
    metaProvider: MetaProvider;
    type: MediaFormat | TvType;
    provider: string;
    id: string;
    image: string;
    title: string;
  }>();
  const addFavorite = useFavoriteStore((state) => state.addFavorite);
  const removeFavorite = useFavoriteStore((state) => state.removeFavorite);
  const idKey = useMemo(() => String(id), [id]);
  const isFavorited = useFavoriteStore(
    useCallback((state) => state.favorites.some((item) => String(item.id) === idKey), [idKey]),
  );
  const currentTheme = useCurrentTheme();

  const handleFavorite = useCallback(async () => {
    if (!isTV) {
      try {
        await impactAsync(ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }

    if (isFavorited) {
      removeFavorite(idKey);
    } else {
      addFavorite({ id, image, type, mediaType, provider, metaProvider, title });
    }
  }, [addFavorite, id, idKey, isFavorited, removeFavorite, image, type, mediaType, provider, metaProvider, title]);

  return (
    <RippleButton ref={ref} onPress={handleFavorite} {...props}>
      {isFavorited ? (
        <IoniconsIcon name="heart-sharp" color={currentTheme.default} />
      ) : (
        <IoniconsIcon name="heart-outline" />
      )}
    </RippleButton>
  );
});

export default AnimatedFavoriteButton;
