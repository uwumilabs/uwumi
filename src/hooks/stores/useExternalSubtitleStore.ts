import { create } from 'zustand';
import { storage } from './MMKV';

interface PreferedExternalSubtitleLanguageState {
  preferedLanguages: string[] | null;
  setPreferedLanguages: (subtitle: string[] | null) => void;
}

export const useExternalSubtitleStore = create<PreferedExternalSubtitleLanguageState>()((set, get) => ({
  preferedLanguages: storage.getString('preferedLanguages')
    ? JSON.parse(storage.getString('preferedLanguages')!)
    : null,
  setPreferedLanguages: (subtitle) => {
    storage.set('preferedLanguages', JSON.stringify(subtitle));
    set({ preferedLanguages: subtitle });
  },
}));
