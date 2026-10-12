import React from 'react';
import { BottomSheet } from '../BottomSheet';
import type { DialogProps } from './Dialog';

// No universal dialog exists and SwiftUI's Alert can't host custom content, so iOS presents a sheet.
export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, contentContainerProps }) => (
  <BottomSheet
    open={open}
    onOpenChange={onOpenChange}
    scrollable={false}
    contentContainerProps={{
      ...contentContainerProps,
      style: [{ alignItems: 'center' }, contentContainerProps?.style],
    }}>
    {children}
  </BottomSheet>
);

export default Dialog;
