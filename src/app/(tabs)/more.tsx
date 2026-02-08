import React, { useMemo } from 'react';
import { HUXStack, HUYStack, IoniconsIcon, ThemedView, IoniconProps } from '@/components';
import { Route, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Separator } from 'heroui-native';
import { useCurrentTheme } from '@/hooks';

const MenuItem = ({ href, icon, label }: { href: Route; icon: IoniconProps['name']; label: string }) => {
  const router = useRouter();

  const handlePress = () => {
    //console.log(`Navigating to: ${href}`);
    router.push(href);
  };
  const currentTheme = useCurrentTheme();
  return (
    <Pressable onPress={handlePress} style={{ width: '100%' }}>
      <HUXStack className="p-4 items-center gap-2">
        <IoniconsIcon name={icon} color={currentTheme.accent} />
        <Text className="text-lg font-medium text-foreground">{label}</Text>
      </HUXStack>
    </Pressable>
  );
};

const More = () => {
  // Create menu items array with conditional development item inside useMemo
  const menuItems = useMemo(() => {
    const baseItems = [
      { href: '/(settings)/appearance' as Route, icon: 'color-palette', label: 'Appearance' },
      { href: '/(settings)/extensions' as Route, icon: 'extension-puzzle', label: 'Extensions' },
      // { href: '/(settings)' as Route, icon: Settings, label: 'Settings' },
      { href: '/(settings)/favorites' as Route, icon: 'heart', label: 'Favorites' },
      { href: '/(settings)/downloads' as Route, icon: 'download', label: 'Downloads' },
      { href: '/(settings)/about' as Route, icon: 'information-circle-outline', label: 'About' },
    ];

    // Add development-only menu item for testing purposes
    if (process.env.NODE_ENV === 'development') {
      return [...baseItems, { href: '/(settings)/example' as Route, icon: 'information', label: 'Example' }];
    }

    return baseItems;
  }, []); // Empty dependency array since NODE_ENV doesn't change during runtime

  const totalItems = menuItems.length;

  return (
    <ThemedView>
      <HUYStack className="flex-1">
        <HUYStack className="mt-4">
          {menuItems.map((item, index) => (
            <View key={item.label} style={{ width: '100%' }}>
              <MenuItem href={item.href} icon={item.icon} label={item.label} />
              {index < totalItems - 1 && <Separator />}
            </View>
          ))}
        </HUYStack>
      </HUYStack>
    </ThemedView>
  );
};

export default More;
