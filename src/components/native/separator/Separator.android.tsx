import React from 'react';
import { HorizontalDivider, Host, VerticalDivider } from '@expo/ui/jetpack-compose';
import { fillMaxHeight, padding } from '@expo/ui/jetpack-compose/modifiers';
import { useCurrentTheme } from '@/hooks';
import type { SeparatorLineProps, SeparatorProps } from './Separator';

export const SeparatorLine = ({ orientation = 'horizontal', inset = 0 }: SeparatorLineProps) => {
  const theme = useCurrentTheme();
  return orientation === 'vertical' ? (
    <VerticalDivider color={theme.separator} modifiers={[fillMaxHeight(), padding(0, inset, 0, inset)]} />
  ) : (
    <HorizontalDivider color={theme.separator} modifiers={[padding(inset, 0, inset, 0)]} />
  );
};

export const Separator = ({ orientation = 'horizontal', inset }: SeparatorProps) => (
  <Host
    matchContents={orientation === 'vertical' ? { horizontal: true } : { vertical: true }}
    style={orientation === 'vertical' ? { alignSelf: 'stretch' } : { width: '100%' }}>
    <SeparatorLine orientation={orientation} inset={inset} />
  </Host>
);

export default Separator;
