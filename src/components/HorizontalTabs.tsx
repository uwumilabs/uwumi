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
export const HorizontalTabs = ({ items }: { items: TabItem[] }) => {
  const [selectedTab, setSelectedTab] = useState('');
  // Items can arrive after mount, so the first tab stands in while the selection isn't among them
  const activeTab = items.some((item) => item.key === selectedTab) ? selectedTab : (items[0]?.key ?? '');

  return (
    <>
      <Tabs value={activeTab} onValueChange={setSelectedTab} variant="secondary" className="w-full">
        <Tabs.List>
          <Tabs.Indicator />
          {items.map((item, index) => (
            <FocusableTrigger
              key={item.key}
              testID="horizontal-tab"
              value={item.key}
              isFirst={index === 0}
              className="flex-1 py-2">
              <Tabs.Label className="text-center text-base font-semibold">{item.label}</Tabs.Label>
            </FocusableTrigger>
          ))}
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
