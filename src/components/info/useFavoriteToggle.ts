import { useCallback, useMemo } from 'react';
import { useInfoParams } from '@/utils/routes';
import { isSameTitle, useFavoriteStore } from '@/hooks/stores/useFavoriteStore';
import { useShownTitle } from '@/hooks/queries/infoQueries';
import { haptics } from '@/utils/haptics';

/** Whether the info screen's title is a favorite, a toggle for it, and the toggle's label (tests select on it) */
export const useFavoriteToggle = () => {
  const { mediaType, type, id } = useInfoParams();
  const { title, image } = useShownTitle();
  const addFavorite = useFavoriteStore((state) => state.addFavorite);
  const removeFavorite = useFavoriteStore((state) => state.removeFavorite);
  const titleRef = useMemo(() => ({ id, type }), [id, type]);
  const isFavorited = useFavoriteStore(
    useCallback((state) => state.favorites.some((item) => isSameTitle(item, titleRef)), [titleRef]),
  );

  const toggleFavorite = useCallback(() => {
    haptics.light();

    if (isFavorited) {
      removeFavorite(titleRef);
    } else {
      addFavorite({
        id,
        image: image ?? '',
        type,
        mediaType,
        title: title ?? '',
      });
    }
  }, [addFavorite, id, titleRef, isFavorited, removeFavorite, image, type, mediaType, title]);

  return { isFavorited, toggleFavorite, label: isFavorited ? 'Remove from favorites' : 'Add to favorites' };
};
