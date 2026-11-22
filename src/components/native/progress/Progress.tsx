import type React from 'react';

export interface ProgressLineProps {
  value?: number;
  /** Animates without a value, for work whose length isn't known yet; a spinner on iOS */
  indeterminate?: boolean;
}

export interface ProgressProps extends ProgressLineProps {
  className?: string;
}

// Platforms other than Android and iOS have no native progress bar
/** The bare native bar, for use inside native trees such as `DownloadList` */
export const ProgressLine: React.FC<ProgressLineProps> = () => null;
/** The bar in its own native host, for React Native layouts */
export const Progress: React.FC<ProgressProps> = () => null;
