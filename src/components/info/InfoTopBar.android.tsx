import React from 'react';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import { HeaderHeightContext } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Host, Icon, IconButton, RNHostView, TopAppBar } from '@expo/ui/jetpack-compose';
import { testID as testTag } from '@expo/ui/jetpack-compose/modifiers';
import { Button } from '@/components/Button';
import { MaterialIconsIcon } from '@/components/Icons';
import { LinearGradient } from '@/components/LinearGradient';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { useShownTitle } from '@/hooks/queries/infoQueries';
import { hexToRGB } from '@/utils/format';
import { isTV } from '@/utils/tv';
import { INFO_HERO_HEIGHT } from './InfoHeader';
import { useInfoActions } from './useInfoActions';
import type { InfoTopBarProps } from './InfoTopBar';

// Material 3's small top app bar, below the status bar
const BAR_HEIGHT = 64;
const FILL_AT = 4;
const FADE = { duration: 300, easing: Easing.out(Easing.cubic) };

const BAR_ICONS = ['arrow-back', 'share', 'favorite', 'favorite-border'] as const;
type BarIcon = (typeof BAR_ICONS)[number];

// Compose takes no font icons, so the bar's Material icons as images, loaded together so a toggle never waits on one
const useBarIcons = () =>
  useQuery({
    queryKey: ['infoBarIcons'],
    queryFn: async () =>
      Object.fromEntries(
        await Promise.all(BAR_ICONS.map(async (name) => [name, await MaterialIcons.getImageSource(name, 24, 'white')])),
      ) as Record<BarIcon, ImageSourcePropType | null>,
    enabled: !isTV,
    staleTime: Infinity,
    gcTime: Infinity,
  }).data;

interface BarButtonProps {
  icon: BarIcon;
  label: string;
  testID: string;
  onPress: () => void;
  tint?: string;
}

// TV: the app's button, hosted in the bar, since Compose shows D-pad focus only as a faint circle
const BarButton = ({ icon, label, testID, onPress, tint }: BarButtonProps) => {
  const image = useBarIcons()?.[icon];
  const foreground = useCurrentTheme().foreground;
  const color = tint ?? foreground;
  if (isTV) {
    return (
      <RNHostView matchContents>
        <Button
          testID={testID}
          isIconOnly
          variant="ghost"
          className="size-12 rounded-full"
          accessibilityLabel={label}
          onPress={onPress}>
          <MaterialIconsIcon name={icon} size={24} color={color} />
        </Button>
      </RNHostView>
    );
  }
  return (
    <IconButton onClick={onPress} modifiers={[testTag(testID)]}>
      {image && <Icon source={image} size={24} tint={color} contentDescription={label} />}
    </IconButton>
  );
};

const useFadeWhen = (isPast: () => boolean) => {
  const shown = useSharedValue(0);
  useAnimatedReaction(isPast, (past, wasPast) => {
    if (past !== wasPast) shown.set(withTiming(past ? 1 : 0, FADE));
  });
  return shown;
};

/**
 * Android's info header, in place of the native one: a Material 3 top app bar that works as Aniyomi's, see-through
 * over the artwork until the page scrolls
 */
export const InfoTopBar = ({ scroll, children }: InfoTopBarProps) => {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const height = top + BAR_HEIGHT;
  const theme = useCurrentTheme();
  const { title } = useShownTitle();
  const { share, favorite } = useInfoActions();

  const filled = useFadeWhen(() => {
    'worklet';
    return scroll.y.get() > FILL_AT;
  });
  // Once the hero has scrolled under the bar, or halfway down a page too short to scroll that far (a movie with few
  // episodes). Never before the fill, so the title never shows on a see-through bar.
  const titleAt = INFO_HERO_HEIGHT - height;
  const titled = useFadeWhen(() => {
    'worklet';
    return scroll.y.get() > Math.max(FILL_AT, Math.min(titleAt, scroll.max.get() / 2));
  });
  const fillStyle = useAnimatedStyle(() => ({ opacity: filled.get() }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: 1 - filled.get() }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titled.get(),
    transform: [{ translateY: (1 - titled.get()) * 8 }],
  }));

  return (
    // The page lays out below the bar as it would below a native header
    <HeaderHeightContext.Provider value={height}>
      <Stack.Screen options={{ headerShown: false }} />
      {children}
      {/* Runs on past the bar and fades out gradually, even where the bar is short (TV has no status bar above it) */}
      <Animated.View pointerEvents="none" style={[styles.top, { height: height * 1.7 }, scrimStyle]}>
        <LinearGradient
          colors={[
            hexToRGB(theme.screenBackground, 0.95),
            hexToRGB(theme.screenBackground, 0.75),
            hexToRGB(theme.screenBackground, 0),
          ]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={[styles.top, { height }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.barBackground }, fillStyle]} />
        <Host style={StyleSheet.absoluteFill}>
          <TopAppBar windowInsets={{ top }} colors={{ containerColor: 'transparent' }}>
            <TopAppBar.NavigationIcon>
              <BarButton icon="arrow-back" label="Back" testID="info-back" onPress={() => router.back()} />
            </TopAppBar.NavigationIcon>
            <TopAppBar.Title>
              {/* React Native text, so it can follow the same animated values as the fill */}
              <RNHostView matchContents={{ vertical: true }}>
                <Animated.Text className="text-foreground text-xl font-medium" numberOfLines={1} style={titleStyle}>
                  {title}
                </Animated.Text>
              </RNHostView>
            </TopAppBar.Title>
            <TopAppBar.Actions>
              {share && <BarButton icon="share" label={share.label} testID="info-share" onPress={share.onPress} />}
              <BarButton
                icon={favorite.active ? 'favorite' : 'favorite-border'}
                label={favorite.label}
                testID="info-favorite"
                tint={favorite.tint}
                onPress={favorite.onPress}
              />
            </TopAppBar.Actions>
          </TopAppBar>
        </Host>
      </View>
    </HeaderHeightContext.Provider>
  );
};

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
});
