import React, { forwardRef, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { MediaType, MetaProvider } from '@/constants/types';
import { MediaFormat, TvType } from 'react-native-consumet';
import { IoniconsIcon, RippleButton } from '@/components';
import { useCurrentTheme, useFavoriteStore, useMediaInfo } from '@/hooks';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { infoTitle, isTV } from '@/constants/utils';

export const AnimatedFavoriteButton = forwardRef<React.ComponentRef<typeof View>, Record<string, any>>((props, ref) => {
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
  // A shared link carries no poster (and maybe no title), so those come from the loaded info
  const { data } = useMediaInfo();

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
      addFavorite({
        id,
        image: image || data?.image || '',
        type,
        mediaType,
        provider,
        metaProvider,
        title: title || infoTitle(data) || '',
      });
    }
  }, [
    addFavorite,
    id,
    idKey,
    isFavorited,
    removeFavorite,
    image,
    type,
    mediaType,
    provider,
    metaProvider,
    title,
    data,
  ]);

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
