import React from 'react';
import { Host, Rectangle } from '@expo/ui/swift-ui';
import { foregroundStyle, frame, padding } from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks';
import type { SeparatorLineProps, SeparatorProps } from './Separator';

// A 1pt line in the theme's separator colour, like Android's divider; SwiftUI's Divider is a fainter hairline
export const SeparatorLine = ({ orientation = 'horizontal', inset = 0 }: SeparatorLineProps) => {
  const theme = useCurrentTheme();
  const vertical = orientation === 'vertical';
  return (
    <Rectangle
      modifiers={[
        foregroundStyle(theme.separator),
        frame(vertical ? { width: 1 } : { height: 1 }),
        padding(vertical ? { vertical: inset } : { horizontal: inset }),
      ]}
    />
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
