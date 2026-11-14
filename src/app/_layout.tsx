import '../../global.css';
import '@/bootstrap';
import { SETTINGS_SCREENS } from '@/utils/routes';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo } from 'react';
import Animated, { Easing, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/constants/queryClient';
import {
  Inter_500Medium as InterMedium,
  Inter_600SemiBold as InterSemiBold,
  Inter_800ExtraBold as InterBold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { useOtaUpdates } from '@/hooks/useOtaUpdates';
import { useEpisodeAlertTaps } from '@/services/episodeAlerts';
import { useNativeHeaderOptions } from '@/hooks/useNativeHeaderOptions';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import { Platform, Text, View } from 'react-native';
import { ensureNotificationPermission } from '@/services/notifications';
import { HeroUINativeProvider } from '@/components/heroui';
import { KeyboardAvoidingView, KeyboardProvider } from 'react-native-keyboard-controller';
import { LinearGradient } from '@/components/LinearGradient';
import { OtaUpdateToast } from '@/components/OtaUpdateToast';
import { UpdateDialog } from '@/components/UpdateDialog';
import { AppVideoProvider, VIDEO_PORTAL_HOST } from '@/components/watch/AppVideoProvider';
import { VideoPortalHost } from 'react-native-video-toolkit';
import RNOrientationDirector, { Orientation } from 'react-native-orientation-director';
import { hexToRGB } from '@/utils/format';
import { isTV } from '@/utils/tv';
import { PerfWindows, perfScreenLayout } from '@/perf/perfHarness';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Android, under the info screen's see-through header: the background fading out downwards, like iOS's scroll edge
 * effect, so the header's buttons stay readable over the artwork and whatever scrolls under them. iOS draws its own.
 * Part of the screen rather than the header, so it can run on past the header and fade out gradually even where the
 * header is short (TV has no status bar above it).
 */
const HeaderScrim = () => {
  const color = useCurrentTheme().screenBackground;
  const headerHeight = useHeaderHeight();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[hexToRGB(color, 0.95), hexToRGB(color, 0.75), hexToRGB(color, 0)]}
      locations={[0, 0.5, 1]}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: headerHeight * 1.7 }}
    />
  );
};

// Android's native headers take the status bar's room from the window, which the banner already covers
const HEADER_UNDER_BANNER = { headerConfig: { disableTopInsetApplication: true } };

const IncognitoFrame = ({ children }: { children: (bannerShown: boolean) => React.ReactNode }) => {
  const incognito = usePreferencesStore((state) => state.incognito);
  const fullScreen = /^\/(watch|read)\//.test(usePathname());
  const insets = useSafeAreaInsets();
  const theme = useCurrentTheme();
  const shown = incognito && !fullScreen;
  const childInsets = useMemo(() => (shown ? { ...insets, top: 0 } : insets), [shown, insets]);
  return (
    <View style={{ flex: 1 }}>
      {shown && (
        <Animated.View
          entering={FadeInUp.duration(400).easing(Easing.bezier(0.05, 0.7, 0.1, 1))}
          exiting={FadeOutUp.duration(200).easing(Easing.bezier(0.3, 0, 0.8, 0.15))}
          style={{ paddingTop: insets.top, backgroundColor: theme.accent }}>
          <Text className="py-1 text-center text-xs font-semibold" style={{ color: theme.accentForeground }}>
            Incognito mode
          </Text>
        </Animated.View>
      )}
      <SafeAreaInsetsContext.Provider value={childInsets}>{children(shown)}</SafeAreaInsetsContext.Provider>
    </View>
  );
};

const screenLayout = ({ route, children }: { route: { name: string }; children: React.ReactNode }) => {
  const screen = perfScreenLayout ? perfScreenLayout({ route, children }) : <>{children}</>;
  if (Platform.OS !== 'android' || route.name !== 'info/[mediaType]') return screen;
  return (
    <View style={{ flex: 1 }}>
      {screen}
      <HeaderScrim />
    </View>
  );
};

const AppContent = () => {
  const headerOptions = useNativeHeaderOptions();
  const [fontsLoaded, fontError] = useFonts({
    InterMedium,
    InterSemiBold,
    InterBold,
  });
  // A font that fails to load falls back to the system font instead of keeping the app on the splash
  const loaded = fontsLoaded || !!fontError;
  useOtaUpdates(loaded);
  useEpisodeAlertTaps();

  const currentTheme = useCurrentTheme();
  const { isDark } = currentTheme;
  useEffect(() => {
    // Android 13+: downloads show their progress in a notification (plugins/withBackgroundDownloads.js)
    if (Platform.OS === 'android') {
      ensureNotificationPermission().catch((error) => console.warn('Notification permission request failed:', error));
    }
    RNOrientationDirector.lockTo(isTV ? Orientation.landscape : Orientation.portrait);
  }, []);

  // Not waiting on the update check: its dialog shows whenever the check answers
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  const contentWrapper = useCallback(
    (children: React.ReactNode) => (
      <KeyboardAvoidingView pointerEvents="box-none" behavior="padding" keyboardVerticalOffset={12} className="flex-1">
        {children}
      </KeyboardAvoidingView>
    ),
    [],
  );

  if (!loaded) {
    return null;
  }

  // The navigators paint their container with this background; on iOS it shows behind a
  // screen's rounded corners during push transitions, so it must match the app theme.
  const baseNavigationTheme = isDark ? DarkTheme : DefaultTheme;
  const screenBackground = currentTheme.screenBackground;
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      background: screenBackground,
      card: screenBackground,
      text: currentTheme.foreground,
      border: currentTheme.border,
      primary: currentTheme.accent,
    },
  };

  return (
    <>
      <HeroUINativeProvider
        config={{
          toast: {
            disableFullWindowOverlay: true,
            contentWrapper,
            defaultProps: {
              placement: 'bottom',
            },
          },
          devInfo: {
            stylingPrinciples: false,
          },
        }}>
        <ThemeProvider value={navigationTheme}>
          <IncognitoFrame>
            {(bannerShown) => (
              // freezeOnBlur: screens under the top one (the tabs under watch, info under watch) stop re-rendering
              <Stack
                screenOptions={{
                  headerShown: false,
                  freezeOnBlur: true,
                  unstable_nativeProps: bannerShown ? HEADER_UNDER_BANNER : undefined,
                }}
                screenLayout={screenLayout}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="browse/[mediaType]" />
                <Stack.Screen name="search/[mediaType]" />
                <Stack.Screen
                  name="info/[mediaType]"
                  options={{
                    ...headerOptions,
                    headerShown: true,
                    headerTransparent: true,
                    headerStyle: { backgroundColor: 'transparent' },
                    title: '',
                  }}
                />
                <Stack.Screen name="watch/[mediaType]" />
                {/* Over the pages, so the reader's menu tap can hide it without moving them */}
                <Stack.Screen
                  name="read/[id]"
                  options={{ ...headerOptions, headerShown: true, headerTransparent: true, title: '' }}
                />
                {/* In the root stack rather than a nested one, so iOS gives the first of them a native back button too */}
                {Object.entries(SETTINGS_SCREENS).map(([name, { title }]) => (
                  <Stack.Screen
                    key={name}
                    name={`(settings)/${name}`}
                    options={{ ...headerOptions, headerShown: true, title }}
                  />
                ))}
                <Stack.Screen name="+not-found" />
              </Stack>
            )}
          </IncognitoFrame>
        </ThemeProvider>
        <PerfWindows />
        {/* Player sheets (the episodes panel) render here, inside HeroUI's provider so its components work */}
        <VideoPortalHost name={VIDEO_PORTAL_HOST} />
        <OtaUpdateToast />
        <UpdateDialog />
      </HeroUINativeProvider>
    </>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <AppVideoProvider>
            <AppContent />
          </AppVideoProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
