import { createMMKV } from 'react-native-mmkv';
import { createJSONStorage } from 'zustand/middleware';

export const storage = createMMKV();

const lastWritten = new Map<string, string>();

/** zustand `persist` storage on MMKV. A store that changed only unpersisted fields serializes the same: that write is skipped */
export const persistStorage = createJSONStorage(() => ({
  setItem: (name, value) => {
    if (lastWritten.get(name) === value) return;
    lastWritten.set(name, value);
    storage.set(name, value);
  },
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => {
    lastWritten.delete(name);
    storage.remove(name);
  },
}));
