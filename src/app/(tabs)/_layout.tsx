import { NativeTabs } from 'expo-router/native-tabs';
import React from 'react';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { hexToRGB } from '@/utils/format';
import { isTV } from '@/utils/tv';
import { TVTabs } from '@/components/TVTabs';
import { TABS } from '@/components/homeTabs';

export const unstable_settings = {
  anchor: 'index',
};

export default function TabLayout() {
  const currentTheme = useCurrentTheme();

  if (isTV) return <TVTabs />;

  return (
    <NativeTabs
      backBehavior="initialRoute"
      backgroundColor={currentTheme.railBackground}
      indicatorColor={currentTheme?.default}
      rippleColor={hexToRGB(currentTheme?.accent, 0.5)}
      labelStyle={{ fontSize: 13, fontWeight: '700', color: currentTheme?.foreground }}
      iconColor={currentTheme?.foreground}
      labelVisibilityMode="labeled">
      {TABS.map(({ name, label, icon, testID }) => (
        <NativeTabs.Trigger key={name} name={name} testID={testID}>
          <NativeTabs.Trigger.Label>{label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon src={icon} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
