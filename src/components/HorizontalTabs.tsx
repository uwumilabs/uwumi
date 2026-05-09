import React, { Activity, useEffect, useMemo, useState } from 'react';
import { Tabs } from 'heroui-native';
import { View, type FocusDestination } from 'react-native';
import FocusableTrigger from './FocusableTrigger';

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface HorizontalTabsProps {
  items: TabItem[];
  initialTab?: string;
  /** TV: explicit next focus up target for tab triggers */
  nextFocusUp?: FocusDestination;
}

export const HorizontalTabs = React.forwardRef<View, HorizontalTabsProps>(({ items, initialTab, nextFocusUp }, ref) => {
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
    <>
      <Tabs ref={ref} value={activeTab} onValueChange={setActiveTab} variant="secondary" className="w-full">
        <Tabs.List>
          <Tabs.Indicator />
          {orderedItems.map((item, index) => (
            <FocusableTrigger
              key={item.key}
              value={item.key}
              isFirst={index === 0}
              nextFocusUp={nextFocusUp}
              className="flex-1 py-2">
              <Tabs.Label className="text-center text-base font-semibold">{item.label}</Tabs.Label>
            </FocusableTrigger>
          ))}
        </Tabs.List>
      </Tabs>

      {orderedItems.map((item) => (
        <Activity key={item.key} mode={activeTab === item.key ? 'visible' : 'hidden'}>
          <View className="flex-1 h-full w-full">{item.content}</View>
        </Activity>
      ))}
    </>
  );
});

export default HorizontalTabs;
