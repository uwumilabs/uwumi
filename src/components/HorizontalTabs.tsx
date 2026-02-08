import React, { useEffect, useMemo, useState } from 'react';
import { Tabs } from 'heroui-native';
import { View } from 'react-native';

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface HorizontalTabsProps {
  items: TabItem[];
  initialTab?: string;
}

export const HorizontalTabs: React.FC<HorizontalTabsProps> = ({ items, initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || items[0]?.key || '');

  // Keep active tab in sync when items change (e.g., async data)
  useEffect(() => {
    const firstKey = items[0]?.key;
    if (!firstKey) return;
    if (!activeTab || !items.find((item) => item.key === activeTab)) {
      setActiveTab(initialTab && items.find((i) => i.key === initialTab) ? initialTab : firstKey);
    }
  }, [items, activeTab, initialTab]);

  const orderedItems = useMemo(() => items, [items]);
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} variant="secondary" className="w-full">
      <Tabs.List>
        <Tabs.Indicator />
        {orderedItems.map((item) => (
          <Tabs.Trigger key={item.key} value={item.key} className="flex-1 py-2">
            <Tabs.Label className="text-center text-base font-semibold">{item.label}</Tabs.Label>
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {orderedItems.map((item) => (
        <Tabs.Content key={item.key} value={item.key} className="h-full w-full">
          <View className="flex-1">{item.content}</View>
        </Tabs.Content>
      ))}
    </Tabs>
  );
};

export default HorizontalTabs;
