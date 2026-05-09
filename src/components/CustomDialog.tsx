import React, { useState, useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import { Host, BasicAlertDialog, Column, RNHostView, Surface } from '@expo/ui/jetpack-compose';
import { wrapContentWidth, wrapContentHeight, clip, Shapes } from '@expo/ui/jetpack-compose/modifiers';

export type CustomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  contentContainerProps?: ViewProps;
};

export const CustomDialog: React.FC<CustomDialogProps> = ({ open, onOpenChange, children, contentContainerProps }) => {
  const [visible, setVisible] = useState(open);

  // Sync visibility when `open` prop changes
  useEffect(() => {
    setVisible(open);
  }, [open]);

  const handleDismiss = () => {
    setVisible(false);
    onOpenChange(false);
  };

  if (!visible) return null;

  return (
    <Host matchContents style={{ position: 'absolute', zIndex: 9999 }}>
      <BasicAlertDialog onDismissRequest={handleDismiss}>
        <Surface
          tonalElevation={0}
          color="transparent"
          modifiers={[wrapContentWidth(), wrapContentHeight(), clip(Shapes.RoundedCorner(24))]}>
          <Column>
            <RNHostView matchContents>
              <View {...contentContainerProps}>{children}</View>
            </RNHostView>
          </Column>
        </Surface>
      </BasicAlertDialog>
    </Host>
  );
};

export default CustomDialog;
