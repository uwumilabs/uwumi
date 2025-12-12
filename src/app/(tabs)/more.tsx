import React, { RefObject, useMemo } from 'react';
import { HUXStack, HUYStack, ThemedView } from '@/components';
import { Route, useRouter } from 'expo-router';
import { Palette, Info, Heart, Package, Download } from '@tamagui/lucide-icons';
import { Pressable, Text, View } from 'react-native';
import { Divider } from 'heroui-native';
import { useCurrentTheme } from '@/hooks';

const MenuItem = ({
  href,
  icon: Icon,
  label,
}: {
  href: Route;
  icon: React.ElementType;
  label: string;
  index?: number;
  totalItems?: number;
  refs?: RefObject<(View | null)[]>;
  nextFocusUp?: number | null;
  nextFocusDown?: number | null;
}) => {
  const router = useRouter();

  const handlePress = () => {
    //console.log(`Navigating to: ${href}`);
    router.push(href);
  };
  const currentTheme = useCurrentTheme();
  return (
    <Pressable onPress={handlePress} style={{ width: '100%' }}>
      <HUXStack className="p-4 items-center gap-2">
        <Icon color={currentTheme.accent} />
        <Text className="text-lg font-medium text-foreground">{label}</Text>
      </HUXStack>
    </Pressable>
  );
};

const More = () => {
  // Create menu items array with conditional development item inside useMemo
  const menuItems = useMemo(() => {
    const baseItems = [
      { href: '/(settings)/appearance' as Route, icon: Palette, label: 'Appearance' },
      { href: '/(settings)/extensions' as Route, icon: Package, label: 'Extensions' },
      // { href: '/(settings)' as Route, icon: Settings, label: 'Settings' },
      { href: '/(settings)/favorites' as Route, icon: Heart, label: 'Favorites' },
      { href: '/(settings)/downloads' as Route, icon: Download, label: 'Downloads' },
      { href: '/(settings)/about' as Route, icon: Info, label: 'About' },
    ];

    // Add development-only menu item for testing purposes
    if (process.env.NODE_ENV === 'development') {
      return [...baseItems, { href: '/(settings)/example' as Route, icon: Info, label: 'Example' }];
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
              {index < totalItems - 1 && <Divider />}
            </View>
          ))}
        </HUYStack>
      </HUYStack>
    </ThemedView>
  );
};

export default More;
