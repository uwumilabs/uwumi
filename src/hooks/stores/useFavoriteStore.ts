import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IAnimeResult, IMovieResult } from 'react-native-consumet';
import { persistStorage } from './MMKV';

type Favorite = IAnimeResult | IMovieResult;
type TitleRef = { id: string | number; type?: unknown };

/** The same title: TMDB movie and TV ids share a numeric space, so the type tells them apart where both have one */
export const isSameTitle = (a: TitleRef, b: TitleRef) =>
  String(a.id) === String(b.id) && (!a.type || !b.type || a.type === b.type);

interface FavoriteState {
  favorites: Favorite[];
  addFavorite: (item: Favorite) => void;
  removeFavorite: (title: TitleRef) => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set) => ({
      favorites: [],
      addFavorite: (item) => set((state) => ({ favorites: [...state.favorites, item] })),
      removeFavorite: (title) =>
        set((state) => ({ favorites: state.favorites.filter((item) => !isSameTitle(item, title)) })),
    }),
    {
      name: 'favorites',
      storage: persistStorage,
    },
  ),
);
