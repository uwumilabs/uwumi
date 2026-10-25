import React from 'react';
import { TVFocusGuideView, View, type StyleProp, type ViewStyle } from 'react-native';
import { isTV } from '@/constants/utils';

/**
 * Container for a horizontal row of cards. On TV, focus can't slip out of the row sideways at either end,
 * and coming back to the row lands on the card that was focused last
 */
export const TVRow = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) =>
  isTV ? (
    <TVFocusGuideView autoFocus trapFocusLeft trapFocusRight style={style}>
      {children}
    </TVFocusGuideView>
  ) : (
    <View style={style}>{children}</View>
  );
