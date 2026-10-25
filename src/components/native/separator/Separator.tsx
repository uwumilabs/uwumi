import type React from 'react';

export interface SeparatorLineProps {
  orientation?: 'horizontal' | 'vertical';
  /** Space kept clear at both ends, e.g. 16 to line up with a list's content */
  inset?: number;
}

export type SeparatorProps = SeparatorLineProps;

// Platforms other than Android and iOS have no native separator
/** The bare native line, for use inside native trees such as `List` */
export const SeparatorLine: React.FC<SeparatorLineProps> = () => null;
/** The line in its own native host, for React Native layouts */
export const Separator: React.FC<SeparatorProps> = () => null;

export default Separator;
