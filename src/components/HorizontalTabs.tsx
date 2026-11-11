import React, { Activity, useState } from 'react';
import { Tabs } from './heroui';
import { View } from 'react-native';
import FocusableTrigger from './FocusableTrigger';

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface HorizontalTabsProps {
  items: TabItem[];
  initialTab?: string;
}

export const HorizontalTabs = ({ items, initialTab }: HorizontalTabsProps) => {
  const [selectedTab, setSelectedTab] = useState(initialTab || '');
  // Items can arrive after mount, so fall back to the initial (or first) tab while the selection isn't among them
  const fallbackTab = items.some((item) => item.key === initialTab) ? initialTab! : (items[0]?.key ?? '');
  const activeTab = items.some((item) => item.key === selectedTab) ? selectedTab : fallbackTab;

  return (
    <>
      <Tabs value={activeTab} onValueChange={setSelectedTab} variant="secondary" className="w-full">
        <Tabs.List>
          <Tabs.Indicator />
          {items.map((item, index) => (
            <FocusableTrigger key={item.key} value={item.key} isFirst={index === 0} className="flex-1 py-2">
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

export default HorizontalTabs;
