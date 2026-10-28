import React, { createContext, useContext } from 'react';
import { TVFocusGuideView, View, type StyleProp, type ViewStyle } from 'react-native';
import { isTV } from '@/constants/utils';

/** Whether the screen sits beside TVTabs' rail, which Left at a row's first card should reach */
export const TVRailContext = createContext(false);

/**
 * Container for a horizontal row of cards. On TV, focus can't slip out of the row sideways at either end (except
 * left into the tab rail), and coming back to the row lands on the card that was focused last
 */
export const TVRow = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => {
  const besideRail = useContext(TVRailContext);
  return isTV ? (
    <TVFocusGuideView autoFocus trapFocusLeft={!besideRail} trapFocusRight style={style}>
      {children}
    </TVFocusGuideView>
  ) : (
    <View style={style}>{children}</View>
  );
};
