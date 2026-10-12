import type React from 'react';

export interface ProgressProps {
  value?: number;
  className?: string;
  minTrackColor?: string;
  maxTrackColor?: string;
}

export const Progress: React.FC<ProgressProps> = () => null;

export default Progress;
