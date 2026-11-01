import type React from 'react';

export interface SwitchProps {
  value: boolean;
  /** Left out, the switch only shows the value, for a row that toggles it (on TV the D-pad then lands on the row) */
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = () => null;

export default Switch;
