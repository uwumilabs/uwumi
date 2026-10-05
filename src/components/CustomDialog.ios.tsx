import React from 'react';
import { CustomSheet } from './CustomSheet';
import type { CustomDialogProps } from './CustomDialog';

// No universal dialog exists and SwiftUI's Alert can't host custom content, so iOS presents a sheet.
export const CustomDialog: React.FC<CustomDialogProps> = ({ open, onOpenChange, children, contentContainerProps }) => (
  <CustomSheet
    open={open}
    onOpenChange={onOpenChange}
    scrollable={false}
    contentContainerProps={{
      ...contentContainerProps,
      style: [{ alignItems: 'center' }, contentContainerProps?.style],
    }}>
    {children}
  </CustomSheet>
);

export default CustomDialog;
