import type React from 'react';

export interface ProgressLineProps {
  value?: number;
  /** For work whose length isn't known yet: an animated bar, or on iOS (which has no animated indeterminate bar) a spinner */
  indeterminate?: boolean;
}

export interface ProgressProps {
  value?: number;
  className?: string;
}

/** The bare native bar, for use inside a native tree */
export const ProgressLine: React.FC<ProgressLineProps> = () => null;
/** The bar in its own native host, for React Native layouts */
export const Progress: React.FC<ProgressProps> = () => null;
