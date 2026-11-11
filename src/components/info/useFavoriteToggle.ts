import { useCallback, useMemo } from 'react';
import { MediaType } from '@/constants/types';
import { MediaFormat, TvType } from 'react-native-consumet';
import { isSameTitle, useFavoriteStore } from '@/hooks/stores/useFavoriteStore';
import { useMediaInfo } from '@/hooks/queries/infoQueries';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { infoTitle, META_PROVIDERS } from '@/utils/media';
import { isTV } from '@/utils/tv';

/** Whether the info screen's title is a favorite, and a toggle for it */
export const useFavoriteToggle = () => {
  const { mediaType, type, provider, id, image, title } = useLocalSearchParams<{
    mediaType: MediaType;
    type: MediaFormat | TvType;
    provider: string;
    id: string;
    image: string;
    title: string;
  }>();
  const addFavorite = useFavoriteStore((state) => state.addFavorite);
  const removeFavorite = useFavoriteStore((state) => state.removeFavorite);
  const titleRef = useMemo(() => ({ id, type }), [id, type]);
  const isFavorited = useFavoriteStore(
    useCallback((state) => state.favorites.some((item) => isSameTitle(item, titleRef)), [titleRef]),
  );
  // A shared link carries no poster (and maybe no title), so those come from the loaded info
  const { data } = useMediaInfo();

  const toggleFavorite = useCallback(() => {
    if (!isTV) impactAsync(ImpactFeedbackStyle.Light);

    if (isFavorited) {
      removeFavorite(titleRef);
    } else {
      addFavorite({
        id,
        image: image || data?.image || '',
        type,
        mediaType,
        provider,
        metaProvider: META_PROVIDERS[mediaType],
        title: title || infoTitle(data) || '',
      });
    }
  }, [addFavorite, id, titleRef, isFavorited, removeFavorite, image, type, mediaType, provider, title, data]);

  return { isFavorited, toggleFavorite };
};
