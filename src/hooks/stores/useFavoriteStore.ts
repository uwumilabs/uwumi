import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { IAnimeResult, IMovieResult } from 'react-native-consumet';
import { storage } from './MMKV';

interface FavoriteState {
  favorites: (IAnimeResult | IMovieResult)[];
  addFavorite: (item: IAnimeResult | IMovieResult) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearAll: () => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (item: IAnimeResult | IMovieResult) => {
        //console.log('Adding favorite:', item);
        set((state) => ({
          favorites: [...state.favorites, item],
        }));
      },

      removeFavorite: (id) => {
        //console.log('Removing favorite:', id);
        set((state) => ({
          favorites: state.favorites.filter((item) => item.id !== id),
        }));
      },

      isFavorite: (id) => get().favorites.some((item) => item.id === id),

      clearAll: () => {
        //console.log('Clearing all favorites');
        set({ favorites: [] });
      },
    }),
    {
      name: 'favorites',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) ?? null,
        removeItem: (name) => storage.delete(name),
      })),
    },
  ),
);
