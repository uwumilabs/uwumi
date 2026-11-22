import React from 'react';
import type { SharedValue } from 'react-native-reanimated';

export interface InfoTopBarProps {
  scrollY: SharedValue<number>;
  /** How far the page can scroll, from the same scroll events */
  scrollMax: SharedValue<number>;
  children: React.ReactNode;
}

export const InfoTopBar = ({ children }: InfoTopBarProps) => <>{children}</>;
