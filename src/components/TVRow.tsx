import React, { createContext, useContext } from 'react';
import { Text, TVFocusGuideView, View, type StyleProp, type ViewStyle } from 'react-native';
import { isTV, tvFocusScrollProps, TV_SNAP_CENTER } from '@/utils/tv';
import { HUXStack } from './ui-primitives';
import { List } from './List';

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
const TVRow = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => {
  const besideRail = useContext(TVRailContext);
  return isTV ? (
    <TVFocusGuideView autoFocus trapFocusLeft={!besideRail} trapFocusRight style={style}>
      {children}
    </TVFocusGuideView>
  ) : (
    <View style={style}>{children}</View>
  );
};

interface CardRowProps<T> {
  testID: string;
  title: string;
  /** Beside the title, e.g. "See more" */
  action?: React.ReactNode;
  /** A card's height with its caption; the row adds its padding */
  cardHeight: number;
  items: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactElement;
  itemStyle?: StyleProp<ViewStyle>;
  footer?: React.ReactElement | null;
  /** In place of the cards, while they load or when they fail */
  placeholder?: React.ReactNode;
}

/** A home row: its title, then the cards, scrolling sideways */
export const CardRow = <T,>({
  testID,
  title,
  action,
  cardHeight,
  items,
  keyExtractor,
  renderItem,
  itemStyle,
  footer = null,
  placeholder,
}: CardRowProps<T>) => (
  <View testID={testID} className="gap-2" scrollSnapAlign={TV_SNAP_CENTER}>
    <HUXStack className="items-center justify-between" style={{ paddingLeft: ROW.padding + 4 }}>
      <Text className="text-foreground text-lg font-semibold">{title}</Text>
      {action}
    </HUXStack>
    {placeholder ?? (
      <TVRow style={{ height: cardHeight + ROW.verticalPadding * 2 }}>
        <List<T>
          horizontal
          data={items}
          keyExtractor={keyExtractor}
          showsHorizontalScrollIndicator={false}
          scrollsToTop={false}
          contentContainerStyle={{ paddingHorizontal: ROW.padding, paddingVertical: ROW.verticalPadding }}
          {...tvFocusScrollProps(ROW.padding)}
          // FlashList ignores `gap` in contentContainerStyle
          ItemSeparatorComponent={() => <View style={{ width: ROW.gap }} />}
          renderItem={({ item, index }) => (
            <View style={itemStyle} scrollSnapAlign={TV_SNAP_CENTER}>
              {renderItem(item, index)}
            </View>
          )}
          ListFooterComponent={footer}
        />
      </TVRow>
    )}
  </View>
);
