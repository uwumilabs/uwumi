import { Tabs, YStack, Text, styled, AnimatePresence } from 'tamagui';
import React, { useState } from 'react';
import type { StackProps, TabLayout, TabsTabProps } from 'tamagui';

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface HorizontalTabsProps {
  items: TabItem[];
  initialTab?: string;
}

const AnimatedYStack = styled(YStack, {
  flex: 1,
  x: 0,
  opacity: 1,
  animation: 'quick',
  variants: {
    direction: {
      ':number': (direction) => ({
        enterStyle: {
          x: direction > 0 ? -25 : 25,
          opacity: 0,
        },
        exitStyle: {
          zIndex: 0,
          x: direction < 0 ? -25 : 25,
          opacity: 0,
        },
      }),
    },
  } as const,
});

const TabsRovingIndicator = ({ active, ...props }: { active?: boolean } & StackProps) => (
  <YStack
    position="absolute"
    backgroundColor={active ? '$color' : '$color2'}
    opacity={active ? 0.9 : 0.5}
    animation="quick"
    enterStyle={{ opacity: 0 }}
    exitStyle={{ opacity: 0 }}
    {...(active && {
      backgroundColor: '$color',
      opacity: 0.6,
    })}
    {...props}
  />
);

export const HorizontalTabs: React.FC<HorizontalTabsProps> = ({ items, initialTab }) => {
  const [tabState, setTabState] = useState<{
    currentTab: string;
    intentAt: TabLayout | null;
    activeAt: TabLayout | null;
    prevActiveAt: TabLayout | null;
  }>({
    currentTab: initialTab || items[0]?.key || '',
    intentAt: null,
    activeAt: null,
    prevActiveAt: null,
  });

  const { currentTab, intentAt, activeAt, prevActiveAt } = tabState;

  const direction = (() => {
    if (!activeAt || !prevActiveAt || activeAt.x === prevActiveAt.x) {
      return 0;
    }
    return activeAt.x > prevActiveAt.x ? -1 : 1;
  })();

  const handleOnInteraction: TabsTabProps['onInteraction'] = (type, layout) => {
    if (type === 'select') {
      setTabState((prev) => ({
        ...prev,
        prevActiveAt: prev.activeAt,
        activeAt: layout,
      }));
    } else {
      setTabState((prev) => ({ ...prev, intentAt: layout }));
    }
  };

  return (
    <Tabs
      value={tabState.currentTab}
      onValueChange={(value) => setTabState((prev) => ({ ...prev, currentTab: value }))}
      orientation="horizontal"
      size="$4"
      height="100%"
      width="100%"
      flexDirection="column"
      activationMode="manual"
      borderRadius="$4">
      <YStack>
        <AnimatePresence>
          {intentAt && <TabsRovingIndicator width={intentAt.width} height="$0.5" x={intentAt.x} bottom={0} />}
        </AnimatePresence>
        <AnimatePresence>
          {activeAt && <TabsRovingIndicator active width={activeAt.width} height="$0.5" x={activeAt.x} bottom={0} />}
        </AnimatePresence>

        <Tabs.List
          disablePassBorderRadius
          loop={false}
          borderBottomLeftRadius={0}
          borderBottomRightRadius={0}
          paddingBottom="$1.5"
          borderColor="$color2"
          borderBottomWidth="$0.5"
          backgroundColor="transparent">
          {items.map((item, index) => (
            <Tabs.Tab
              key={item.key}
              flex={1}
              height={50}
              value={item.key}
              style={{ backgroundColor: 'transparent' }}
              onInteraction={handleOnInteraction}>
              <Text
                fontWeight={currentTab === item.key ? '800' : '400'}
                color={currentTab === item.key ? '$color' : '$color1'}>
                {item.label}
              </Text>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </YStack>

      <AnimatePresence exitBeforeEnter custom={{ direction }} initial={false}>
        <AnimatedYStack key={currentTab}>
          <Tabs.Content value={currentTab} forceMount justifyContent="center">
            {items.find((item) => item.key === currentTab)?.content}
          </Tabs.Content>
        </AnimatedYStack>
      </AnimatePresence>
    </Tabs>
  );
};

export default HorizontalTabs;
