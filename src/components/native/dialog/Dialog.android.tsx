import React from 'react';
import { View } from 'react-native';
import { Host, BasicAlertDialog, Column, RNHostView, Surface } from '@expo/ui/jetpack-compose';
import { wrapContentWidth, wrapContentHeight, clip, Shapes } from '@expo/ui/jetpack-compose/modifiers';
import type { DialogProps } from './Dialog';

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  children,
  contentContainerProps,
  testID = 'native-dialog',
}) => {
  if (!open) return null;

  const handleDismiss = () => onOpenChange(false);

  return (
    <Host matchContents style={{ position: 'absolute', zIndex: 9999 }}>
      <BasicAlertDialog onDismissRequest={handleDismiss} properties={{ usePlatformDefaultWidth: false }}>
        <Surface
          tonalElevation={0}
          color="transparent"
          modifiers={[wrapContentWidth(), wrapContentHeight(), clip(Shapes.RoundedCorner(24))]}>
          <Column>
            <RNHostView matchContents>
              <View testID={testID} {...contentContainerProps}>
                {children}
              </View>
            </RNHostView>
          </Column>
        </Surface>
      </BasicAlertDialog>
    </Host>
  );
};
