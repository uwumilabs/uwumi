import React, { memo, useCallback, useMemo } from 'react';
import { useThemeStore, usePureBlackBackground } from '@/hooks';
import { ThemedView, HUYStack, HUXStack, IoniconsIcon } from '@/components';
import { Pressable, StyleProp, ViewStyle, View, Text, FlatList } from 'react-native';
import { Separator, Switch } from 'heroui-native';
import { themes, ThemeName } from '@/themes/theme';

interface ThemeButtonProps {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}

interface AccentCardProps {
  themeName: ThemeName;
  currentTheme: ThemeName;
  pureBlackBackground: boolean;
  onPress: () => void;
}

const Circle = memo(
  ({ size, children, backgroundColor }: { size: number; children?: React.ReactNode; backgroundColor?: string }) => {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor || 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {children}
      </View>
    );
  },
);
Circle.displayName = 'Circle';

const ThemeButton = memo(({ isSelected, label, onPress }: ThemeButtonProps) => {
  return (
    <Pressable
      style={{
        flex: 1,
        // backgroundColor: isSelected ? currentTheme?.color4 : 'transparent',
      }}
      className={isSelected ? 'bg-default' : 'transparent'}
      onPress={onPress}>
      <Text className="text-foreground font-medium text-lg text-center">{label}</Text>
    </Pressable>
  );
});
ThemeButton.displayName = 'ThemeButton';

const ThemeSelector = memo(() => {
  const isDark = useThemeStore((state) => state.isDark);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const setPureBlackBackground = usePureBlackBackground((state) => state.setPureBlackBackground);

  const handleLightPress = useCallback(() => {
    if (isDark) {
      toggleTheme();
    }
    setPureBlackBackground(false);
  }, [isDark, toggleTheme, setPureBlackBackground]);

  const handleDarkPress = useCallback(() => {
    if (!isDark) {
      toggleTheme();
    }
  }, [isDark, toggleTheme]);

  return (
    <View className="items-center justify-center">
      <HUXStack className="w-1/2 border-2 overflow-hidden rounded-4xl border-muted">
        <ThemeButton isSelected={!isDark} label="Light" onPress={handleLightPress} />
        <Separator orientation="vertical" />
        <ThemeButton isSelected={isDark} label="Dark" onPress={handleDarkPress} />
      </HUXStack>
    </View>
  );
});
ThemeSelector.displayName = 'ThemeSelector';

const AccentCard = memo(({ themeName, currentTheme, pureBlackBackground, onPress }: AccentCardProps) => {
  const theme = themes[themeName];
  const isSelected = currentTheme.startsWith(themeName.replace(/-(light|dark)$/i, ''));
  const cardStyle = useMemo(
    () => ({
      height: 150,
      width: 100,
      borderRadius: 10,
      borderColor: isSelected ? theme?.accent : theme?.separator,
      backgroundColor: pureBlackBackground ? '#000' : theme?.background,
      borderWidth: 2,
      overflow: 'hidden',
    }),
    [isSelected, theme],
  );

  return (
    <HUYStack key={themeName}>
      <Pressable onPress={onPress} style={cardStyle as StyleProp<ViewStyle>}>
        <HUYStack className="flex-1">
          <HUYStack className="flex-1 justify-between">
            <HUYStack className="gap-4 p-2">
              <HUXStack className="h-5 gap-4">
                <View className="w-12 rounded-3xl bg-foreground" />
                {isSelected && (
                  <Circle size={15} backgroundColor={theme?.accent}>
                    <IoniconsIcon name="checkmark" size={14} className="text-accent-foreground" />
                  </Circle>
                )}
              </HUXStack>
              <View className="w-1/2 h-12 rounded-xl bg-muted">
                <HUXStack className="m-2">
                  <View className="h-3 w-full rounded-md" style={{ backgroundColor: theme?.accent }} />
                </HUXStack>
              </View>
            </HUYStack>
            <View className="h-5 items-center justify-center" style={{ backgroundColor: theme?.default }}>
              <HUXStack className="px-2 gap-4">
                <Circle size={15} backgroundColor={theme?.accent} />
                <View
                  className="flex-1 rounded-lg"
                  style={{ backgroundColor: pureBlackBackground ? theme?.muted : theme?.surface }}
                />
              </HUXStack>
            </View>
          </HUYStack>
        </HUYStack>
      </Pressable>
      <Text className="text-accent font-medium text-center capitalize">{themeName.replace(/-(light|dark)$/i, '')}</Text>
    </HUYStack>
  );
});
AccentCard.displayName = 'AccentCard';

const AccentSelector = memo(() => {
  const currentTheme = useThemeStore((state) => state.currentTheme as ThemeName);
  const setTheme = useThemeStore((state) => state.setTheme);
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);

  const themeNames = useMemo(() => Object.keys(themes) as ThemeName[], []);

  const baseNames = useMemo(() => {
    const bases = new Set<string>();
    themeNames.forEach((name) => bases.add(name.replace(/-(light|dark)$/i, '')));
    return Array.from(bases);
  }, [themeNames]);

  const handleAccentChange = useCallback((themeName: ThemeName) => setTheme(themeName), [setTheme]);

  const renderAccentItem = useCallback(
    ({ item: baseName }: { item: string }) => {
      const light = `${baseName}-light` as ThemeName;
      const dark = `${baseName}-dark` as ThemeName;
      const preferred = currentTheme.includes('dark') ? dark : light;
      const fallback = themeNames.find((t) => t.startsWith(baseName)) as ThemeName;
      const target = themeNames.includes(preferred) ? preferred : fallback;

      return (
        <AccentCard
          themeName={target}
          currentTheme={currentTheme}
          pureBlackBackground={pureBlackBackground}
          onPress={() => handleAccentChange(target)}
        />
      );
    },
    [currentTheme, pureBlackBackground, handleAccentChange, themeNames],
  );

  const keyExtractor = useCallback((item: any) => item, []);

  return (
    <View>
      <FlatList
        horizontal
        data={baseNames}
        contentContainerStyle={{ padding: 8, gap: 16 }}
        showsHorizontalScrollIndicator={false}
        renderItem={renderAccentItem}
        keyExtractor={keyExtractor}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={3}
      />
    </View>
  );
});
AccentSelector.displayName = 'AccentSelector';

const PureBlackSwitch = memo(() => {
  const currentTheme = useThemeStore((state) => state.currentTheme as ThemeName);
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const setPureBlackBackground = usePureBlackBackground((state) => state.setPureBlackBackground);

  if (!currentTheme.includes('dark')) return null;

  return (
    <HUXStack className="items-center p-10 justify-between gap-3">
      <Text className="text-accent font-semibold">Pure black dark background</Text>
      <Switch isSelected={pureBlackBackground} onSelectedChange={() => setPureBlackBackground(!pureBlackBackground)} />
    </HUXStack>
  );
});
PureBlackSwitch.displayName = 'PureBlackSwitch';

const Appearance = () => {
  return (
    <ThemedView>
      <ThemeSelector />
      <AccentSelector />
      <PureBlackSwitch />
    </ThemedView>
  );
};

export default memo(Appearance);
