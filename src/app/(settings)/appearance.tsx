import { Circle, Separator, Switch, Text, View, XStack, YStack } from 'tamagui';
import React, { memo, useCallback, useMemo } from 'react';
import { useThemeStore, useAccentStore, usePureBlackBackground, useCurrentTheme, AccentName } from '@/hooks';
import { ThemedView } from '@/components';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { themes } from '@/constants/Theme';
import { FlatList } from 'react-native';
import { Check } from '@tamagui/lucide-icons';

interface ThemeButtonProps {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}

interface AccentCardProps {
  accent: string;
  themeName: string;
  accentName: string;
  pureBlackBackground: boolean;
  onPress: () => void;
}

const ThemeButton = memo(({ isSelected, label, onPress }: ThemeButtonProps) => {
  const currentTheme = useCurrentTheme();

  return (
    <Pressable
      style={{
        flex: 1,
        backgroundColor: isSelected ? currentTheme?.color4 : 'transparent',
      }}
      onPress={onPress}>
      <Text color={currentTheme?.color1} fontWeight="500" fontSize={18} textAlign="center">
        {label}
      </Text>
    </Pressable>
  );
});
ThemeButton.displayName = 'ThemeButton';

const ThemeSelector = memo(() => {
  const setThemeName = useThemeStore((state) => state.setThemeName);
  const themeName = useThemeStore((state) => state.themeName);
  const setPureBlackBackground = usePureBlackBackground((state) => state.setPureBlackBackground);

  const handleLightPress = useCallback(() => {
    setThemeName('light');
    setPureBlackBackground(false);
  }, [setThemeName, setPureBlackBackground]);

  const handleDarkPress = useCallback(() => {
    setThemeName('dark');
  }, [setThemeName]);

  return (
    <View alignItems="center" justifyContent="center">
      <XStack width="50%" borderWidth={2} borderColor="$color2" overflow="hidden" borderRadius={10}>
        <ThemeButton isSelected={themeName === 'light'} label="Light" onPress={handleLightPress} />
        <Separator vertical />
        <ThemeButton isSelected={themeName === 'dark'} label="Dark" onPress={handleDarkPress} />
      </XStack>
    </View>
  );
});
ThemeSelector.displayName = 'ThemeSelector';

const AccentCard = memo(({ accent, themeName, accentName, pureBlackBackground, onPress }: AccentCardProps) => {
  const themeKey = `${themeName}_${accent}`;
  const theme = themes[themeKey];
  const isSelected = accentName === accent;

  const cardStyle = useMemo(
    () => ({
      height: 150,
      width: 100,
      backgroundColor: pureBlackBackground ? '#000' : theme?.background,
      borderRadius: 10,
      borderColor: isSelected ? theme?.color : theme?.color2,
      borderWidth: 2,
      overflow: 'hidden',
    }),
    [pureBlackBackground, isSelected, theme],
  );

  return (
    <YStack key={accent}>
      <Pressable onPress={onPress} style={cardStyle as StyleProp<ViewStyle>}>
        <YStack flex={1}>
          <YStack flex={1} justifyContent="space-between">
            <YStack gap={4} margin="$2">
              <XStack height={15} gap={8}>
                <View width={50} borderRadius={10} backgroundColor={theme?.color1} />
                {isSelected && (
                  <Circle size={15} backgroundColor={theme?.color}>
                    <Check size={12} strokeWidth={3.5} color={theme?.color4} />
                  </Circle>
                )}
              </XStack>
              <View width="50%" height={60} borderRadius={10} backgroundColor={theme?.color2}>
                <XStack margin={4}>
                  <View borderRadius={6} width="100%" height={13} backgroundColor={theme?.color4} />
                </XStack>
              </View>
            </YStack>
            <View backgroundColor={theme?.color2} height={20} alignItems="center" justifyContent="center">
              <XStack marginHorizontal="$2" height={15} gap={8}>
                <Circle size={15} backgroundColor={theme?.color} />
                <View
                  flex={1}
                  width="70%"
                  borderRadius={10}
                  backgroundColor={pureBlackBackground ? theme?.color5 : theme?.color3}
                />
              </XStack>
            </View>
          </YStack>
        </YStack>
      </Pressable>
      <Text textAlign="center" textTransform="capitalize">
        {accent}
      </Text>
    </YStack>
  );
});
AccentCard.displayName = 'AccentCard';

const AccentSelector = memo(() => {
  const themeName = useThemeStore((state) => state.themeName);
  const setAccentName = useAccentStore((state) => state.setAccentName);
  const accentName = useAccentStore((state) => state.accentName);
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);

  // Get unique accent names
  const accentThemes = useMemo(() => {
    const allThemes = Object.entries(themes).filter(([key]) => key.startsWith(themeName));
    return [
      ...new Set(
        allThemes
          .map(([key]) => {
            const [_, accent] = key.split('_');
            return accent;
          })
          .filter(Boolean),
      ),
    ];
  }, [themeName]);

  const handleAccentChange = useCallback((accent: AccentName) => setAccentName(accent), [setAccentName]);

  const renderAccentItem = useCallback(
    ({ item: accent }: { item: AccentName }) => (
      <AccentCard
        accent={accent!}
        themeName={themeName}
        accentName={accentName!}
        pureBlackBackground={pureBlackBackground}
        onPress={() => handleAccentChange(accent)}
      />
    ),
    [themeName, accentName, pureBlackBackground, handleAccentChange],
  );

  const keyExtractor = useCallback((item: any) => item, []);

  return (
    <View>
      <FlatList
        horizontal
        data={accentThemes}
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
  const themeName = useThemeStore((state) => state.themeName);
  const accentName = useAccentStore((state) => state.accentName);
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const setPureBlackBackground = usePureBlackBackground((state) => state.setPureBlackBackground);

  if (themeName !== 'dark') return null;

  const themeKey = `${themeName}_${accentName}`;
  const theme = themes[themeKey];

  return (
    <XStack alignItems="center" padding={10} justifyContent="space-between" gap="$3">
      <Text fontWeight={500}>Pure black dark background</Text>
      <Switch
        borderWidth={2}
        borderColor={pureBlackBackground ? '$color' : '$color2'}
        size="$4"
        backgroundColor={pureBlackBackground ? '$color' : 'transparent'}
        checked={pureBlackBackground}
        onCheckedChange={setPureBlackBackground}>
        <Switch.Thumb
          borderWidth={0}
          scale={0.7}
          backgroundColor={pureBlackBackground ? theme?.color4 : theme?.color2}
          animation="quick"
        />
      </Switch>
    </XStack>
  );
});
PureBlackSwitch.displayName = 'PureBlackSwitch';

const Appearance = () => {
  return (
    <ThemedView padding={10}>
      <ThemeSelector />
      <AccentSelector />
      <PureBlackSwitch />
    </ThemedView>
  );
};

export default memo(Appearance);
