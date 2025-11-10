import React, { useCallback } from 'react';
import { Heart } from '@tamagui/lucide-icons';
import { MediaType, MetaProvider } from '@/constants/types';
import { ITitle, MediaFormat, TvType } from 'react-native-consumet';
import { RippleButton } from '../../../components/ui-primitives';
import { useCurrentTheme, useFavoriteStore } from '@/hooks';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

interface AnimatedFavoriteButtonProps {
  id: string;
  title: string | ITitle;
  image: string;
  type?: MediaFormat | TvType;
  mediaType: MediaType;
  provider: string;
  metaProvider: MetaProvider;
}

export const AnimatedFavoriteButton: React.FC<AnimatedFavoriteButtonProps> = (props) => {
  const { id, ...itemData } = props;
  const { isFavorite, addFavorite, removeFavorite } = useFavoriteStore();
  const isFavorited = isFavorite(id);
  const currentTheme = useCurrentTheme();

  const handleFavorite = useCallback(async () => {
    try {
      await impactAsync(ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }

    if (isFavorite(id)) {
      removeFavorite(id);
    } else {
      addFavorite({ id, ...itemData });
    }
  }, [id, isFavorite, removeFavorite, addFavorite, itemData]);

  return (
    <RippleButton onPress={handleFavorite}>
      <Heart
        size={24}
        color={isFavorited ? '$color4' : '$color'}
        fill={isFavorited ? currentTheme?.color4 : 'transparent'}
      />
    </RippleButton>
  );
};

export default AnimatedFavoriteButton;
