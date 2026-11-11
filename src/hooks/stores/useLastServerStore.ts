import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/hooks/stores/MMKV';

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
      storage: persistStorage,
    },
  ),
);
