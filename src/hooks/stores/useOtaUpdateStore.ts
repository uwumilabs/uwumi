import { create } from 'zustand';

export type OtaUpdateStatus = 'idle' | 'downloading' | 'ready';

interface OtaUpdateState {
  status: OtaUpdateStatus;
  /** 0–100, or null until the download reports its size */
  percent: number | null;
  setDownloading: () => void;
  setPercent: (percent: number) => void;
  setReady: () => void;
  reset: () => void;
}

export const useOtaUpdateStore = create<OtaUpdateState>((set) => ({
  status: 'idle',
  percent: null,
  setDownloading: () => set({ status: 'downloading', percent: null }),
  setPercent: (percent) => set({ percent }),
  setReady: () => set({ status: 'ready', percent: 100 }),
  reset: () => set({ status: 'idle', percent: null }),
}));
