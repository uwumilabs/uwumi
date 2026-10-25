import React, { Activity, useMemo, useState } from 'react';
import { Tabs } from 'heroui-native';
import { View, type ViewProps } from 'react-native';
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
  nextFocusUp?: ViewProps['nextFocusUp'];
}

export const HorizontalTabs = React.forwardRef<React.ComponentRef<typeof View>, HorizontalTabsProps>(
  ({ items, initialTab, nextFocusUp }, ref) => {
    const [selectedTab, setSelectedTab] = useState(initialTab || '');
    // Items can arrive after mount, so fall back to the initial (or first) tab while the selection isn't among them
    const fallbackTab = items.some((item) => item.key === initialTab) ? initialTab! : (items[0]?.key ?? '');
    const activeTab = items.some((item) => item.key === selectedTab) ? selectedTab : fallbackTab;

    const orderedItems = useMemo(() => items, [items]);
    return (
      <>
        <Tabs ref={ref} value={activeTab} onValueChange={setSelectedTab} variant="secondary" className="w-full">
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
  },
);

export default HorizontalTabs;
