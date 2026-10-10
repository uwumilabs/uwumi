import React, { useCallback, useMemo } from 'react';
import { HUXStack, HUYStack, IoniconsIcon, ThemedView, TVFocusWrapper, IoniconProps } from '@/components';
import { type Href, useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Separator } from 'heroui-native';
import { useCurrentTheme } from '@/hooks';

const MenuItem = ({
  href,
  icon,
  label,
  isFirst,
}: {
  href: Href;
  icon: IoniconProps['name'];
  label: string;
  isFirst?: boolean;
}) => {
  const router = useRouter();
  const currentTheme = useCurrentTheme();

  const handlePress = useCallback(() => {
    router.push(href);
  }, [router, href]);

  return (
    <TVFocusWrapper onPress={handlePress} style={{ width: '100%' }} focusScale={1} hasTVPreferredFocus={isFirst}>
      <HUXStack className="p-4 items-center gap-2">
        <IoniconsIcon name={icon} color={currentTheme.accent} />
        <Text className="text-lg font-medium text-foreground">{label}</Text>
      </HUXStack>
    </TVFocusWrapper>
  );
};

const More = () => {
  // Create menu items array with conditional development item inside useMemo
  const menuItems = useMemo(() => {
    const baseItems: { href: Href; icon: IoniconProps['name']; label: string }[] = [
      { href: '/(settings)/appearance' as Href, icon: 'color-palette', label: 'Appearance' },
      { href: '/(settings)/extensions' as Href, icon: 'extension-puzzle', label: 'Extensions' },
      // { href: '/(settings)' as Href, icon: Settings, label: 'Settings' },
      { href: '/(settings)/favorites' as Href, icon: 'heart', label: 'Favorites' },
      { href: '/(settings)/downloads' as Href, icon: 'download', label: 'Downloads' },
      { href: '/(settings)/about' as Href, icon: 'information-circle-outline', label: 'About' },
    ];

    // Add development-only menu item for testing purposes
    if (process.env.NODE_ENV === 'development') {
      return [
        ...baseItems,
        { href: '/(settings)/example' as Href, icon: 'information' as IoniconProps['name'], label: 'Example' },
      ];
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
              <MenuItem href={item.href} icon={item.icon} label={item.label} isFirst={index === 0} />
              {index < totalItems - 1 && <Separator />}
            </View>
          ))}
        </HUYStack>
      </HUYStack>
    </ThemedView>
  );
};

export default More;
