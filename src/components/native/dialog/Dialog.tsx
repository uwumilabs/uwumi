import type React from 'react';
import type { ViewProps } from 'react-native';

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  contentContainerProps?: ViewProps;
  testID?: string;
};

// Platforms other than Android and iOS have no native dialog
export const Dialog: React.FC<DialogProps> = () => null;
