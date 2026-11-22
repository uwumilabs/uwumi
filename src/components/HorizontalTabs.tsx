import React, { Activity, useState } from 'react';
import { Tabs } from './heroui';
import { View } from 'react-native';
import FocusableTrigger from './FocusableTrigger';

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

/** Tabs over their contents; the first is open to start with */
export const HorizontalTabs = ({
  items,
  scrollable,
}: {
  items: TabItem[];
  /** Each tab keeps its own width and the row scrolls, for more tabs than fit side by side */
  scrollable?: boolean;
}) => {
  const [selectedTab, setSelectedTab] = useState('');
  const selectionShown = items.some((item) => item.key === selectedTab);
  // Items can arrive after mount, or a tab can leave: the first tab stands in, and a selection whose tab left is
  // forgotten, so the view doesn't jump back to it when the tab returns
  if (selectedTab && !selectionShown) setSelectedTab('');
  const activeTab = selectionShown ? selectedTab : (items[0]?.key ?? '');

  const triggers = items.map((item, index) => (
    <FocusableTrigger
      key={item.key}
      testID="horizontal-tab"
      value={item.key}
      isFirst={index === 0}
      className={scrollable ? 'px-4 py-2' : 'flex-1 py-2'}>
      <Tabs.Label className="text-center text-base font-semibold">{item.label}</Tabs.Label>
    </FocusableTrigger>
  ));
  const tabsRow = (
    <>
      <Tabs.Indicator />
      {triggers}
    </>
  );

  return (
    <>
      <Tabs value={activeTab} onValueChange={setSelectedTab} variant="secondary" className="w-full">
        <Tabs.List>
          {scrollable ? <Tabs.ScrollView scrollAlign="center">{tabsRow}</Tabs.ScrollView> : tabsRow}
        </Tabs.List>
      </Tabs>

      {items.map((item) => (
        <Activity key={item.key} mode={activeTab === item.key ? 'visible' : 'hidden'}>
          <View className="flex-1 h-full w-full">{item.content}</View>
        </Activity>
      ))}
    </>
  );
};
