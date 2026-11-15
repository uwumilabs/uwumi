import { useCallback, useMemo } from 'react';
import { useInfoParams } from '@/utils/routes';
import { isSameTitle, useFavoriteStore } from '@/hooks/stores/useFavoriteStore';
import { useShownTitle } from '@/hooks/queries/infoQueries';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { haptics } from '@/utils/haptics';
import { shareMedia } from '@/utils/share';
import { isTV } from '@/utils/tv';

/** The info screen's header actions, which each platform's bar renders (tests select on the labels) */
export const useInfoActions = () => {
  const { mediaType, type, id } = useInfoParams();
  const { title, image } = useShownTitle();
  const activeColor = useCurrentTheme().default;
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

  return {
    // Android TV has no share targets
    share: isTV ? undefined : { label: 'Share', onPress: () => shareMedia({ mediaType, id, type, title }) },
    favorite: {
      active: isFavorited,
      label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
      tint: isFavorited ? activeColor : undefined,
      onPress: toggleFavorite,
    },
  };
};
