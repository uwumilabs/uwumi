import type React from 'react';

export interface ProgressProps {
  value?: number;
  /** Animates without a value, for work whose length isn't known yet */
  indeterminate?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = () => null;

export default Progress;
