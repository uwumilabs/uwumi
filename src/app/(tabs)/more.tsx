import React, { RefObject, useMemo } from 'react';
import { ThemedView } from '@/components/ThemedView';
import { Text, YStack, XStack, Separator } from 'tamagui';
import { Route, useRouter } from 'expo-router';
import { Settings, Palette, Info, Heart, Package } from '@tamagui/lucide-icons';
import { Pressable, View } from 'react-native';

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

  return (
    <Pressable onPress={handlePress} style={{ width: '100%' }}>
      <XStack padding="$4" alignItems="center" gap="$4">
        <Icon color="$color" />
        <Text fontSize="$4" fontWeight="500">
          {label}
        </Text>
      </XStack>
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
      <YStack flex={1}>
        <YStack marginTop="$4">
          {menuItems.map((item, index) => (
            <View key={item.label} style={{ width: '100%' }}>
              <MenuItem href={item.href} icon={item.icon} label={item.label} />
              {index < totalItems - 1 && <Separator />}
            </View>
          ))}
        </YStack>
      </YStack>
    </ThemedView>
  );
};

export default More;
