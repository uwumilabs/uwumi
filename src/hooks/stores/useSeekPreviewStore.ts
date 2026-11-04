import { create } from 'zustand';

/** Where the playing episode's seek-bar sprites come from: a provider's thumbnails.vtt, or a download's own copy */
export interface SeekPreviewSource {
  /** http(s) for a provider's list, file:// for a download's */
  url: string;
  headers?: Record<string, string>;
}

interface SeekPreviewState {
  source: SeekPreviewSource | null;
  setSource: (source: SeekPreviewSource | null) => void;
}

/** Set by the watch screen, read by the progress slider the toolkit renders */
export const useSeekPreviewStore = create<SeekPreviewState>((set) => ({
  source: null,
  setSource: (source) => set({ source }),
}));
