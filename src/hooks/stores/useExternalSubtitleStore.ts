import { create } from 'zustand';
import { storage } from './MMKV';

const LANGUAGE_KEY = 'externalSubtitleLanguage';

interface ExternalSubtitleState {
  /** An OpenSubtitles language id (`SUB_LANGUAGE` value), or null for no external subtitles. */
  language: string | null;
  setLanguage: (language: string | null) => void;
}

export const useExternalSubtitleStore = create<ExternalSubtitleState>()((set) => ({
  language: storage.getString(LANGUAGE_KEY) ?? null,
  setLanguage: (language) => {
    if (language) storage.set(LANGUAGE_KEY, language);
    else storage.remove(LANGUAGE_KEY);
    set({ language });
  },
}));
