import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '@/hooks/stores/MMKV';

interface LastServerState {
  /** The last server that played, by `lastServerKey`. Server rotation tries it first. */
  servers: Record<string, string>;
  remember: (providerKey: string, serverName: string) => void;
}

export const lastServerKey = (mediaType: string, provider: string) => `${mediaType}:${provider}`;

export const useLastServerStore = create<LastServerState>()(
  persist(
    (set) => ({
      servers: {},
      remember: (providerKey, serverName) =>
        set((state) =>
          state.servers[providerKey] === serverName
            ? state
            : { servers: { ...state.servers, [providerKey]: serverName } },
        ),
    }),
    {
      name: 'lastServers',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) ?? null,
        removeItem: (name) => storage.remove(name),
      })),
    },
  ),
);
