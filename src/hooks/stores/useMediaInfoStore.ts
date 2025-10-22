import { create } from 'zustand';
import { IAnimeInfo, IMovieInfo } from 'react-native-consumet';

interface MediaInfoState {
  // Current media info data
  mediaInfo: IAnimeInfo | IMovieInfo | null;

  mediaId: string | null;

  // Actions
  setMediaInfo: (info: IAnimeInfo | IMovieInfo, mediaId: string) => void;
  clearMediaInfo: () => void;

  // Getters
  getMediaInfo: () => IAnimeInfo | IMovieInfo | null;
}

export const useMediaInfoStore = create<MediaInfoState>((set, get) => ({
  // Initial state
  mediaInfo: null,
  mediaType: null,
  mediaId: null,
  metaProvider: null,

  // Set media info with metadata
  setMediaInfo: (info, mediaId) => {
    set({
      mediaInfo: info,
      mediaId,
    });
  },

  // Clear media info
  clearMediaInfo: () => {
    set({
      mediaInfo: null,
      mediaId: null,
    });
  },

  // Get current media info
  getMediaInfo: () => get().mediaInfo,
}));
