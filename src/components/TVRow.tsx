import React, { createContext, useContext } from 'react';
import { TVFocusGuideView, View, type StyleProp, type ViewStyle } from 'react-native';
import { isTV } from '@/utils/tv';

/** The home rows' layout, shared so they line up */
export const ROW = {
  padding: 12,
  gap: 8,
  maxItems: 10,
  // TV: room for the focus ring's 1.05 scale, which the list would otherwise clip
  verticalPadding: isTV ? 10 : 0,
};

/** A row card's width, `perScreen` of them across: a fraction leaves part of the next one showing, so it scrolls */
export const rowCardWidth = (screenWidth: number, perScreen: number) =>
  (screenWidth - ROW.padding - ROW.gap * Math.floor(perScreen)) / perScreen;

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
