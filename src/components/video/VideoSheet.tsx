import React from 'react';
import { View } from 'react-native';
import type { SheetProps } from 'react-native-video-toolkit';
import { CustomSheet } from '../CustomSheet';

export const VideoSheet = ({ open, onOpenChange, children, style }: SheetProps) => (
  <CustomSheet open={open} onOpenChange={onOpenChange}>
    <View style={[{ width: '100%' }, style]}>{children}</View>
  </CustomSheet>
);
