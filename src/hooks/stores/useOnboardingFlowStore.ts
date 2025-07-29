import { create } from 'zustand';
import { storage } from '@/hooks/stores/MMKV';

interface OnboardingFlowState {
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
}

export const useOnboardingFlowStore = create<OnboardingFlowState>()((set, get) => ({
  hasCompletedOnboarding: storage.getBoolean('hasCompletedOnboarding') ?? false,
  setHasCompletedOnboarding: (value) => {
    storage.set('hasCompletedOnboarding', value);
    set({ hasCompletedOnboarding: value });
  },
}));
