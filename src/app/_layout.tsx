import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';
import { Toaster } from 'sonner-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Inter_500Medium as InterMedium,
  Inter_600SemiBold as InterSemiBold,
  Inter_800ExtraBold as InterBold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCurrentTheme, useThemeStore, useUpdateChecker, useSheetColor } from '@/hooks';
import * as WebBrowser from 'expo-web-browser';
import { LogBox, Platform, PermissionsAndroid, Text, View } from 'react-native';
import { EXTERNAL_LINKS } from '@/constants/config';
import StoragePermissionModule from '../../modules/storage-permission-module';
import { Button, Dialog, HeroUINativeProvider } from 'heroui-native';
import { KeyboardAvoidingView, KeyboardProvider } from 'react-native-keyboard-controller';
import '../../global.css';
import { useUniwind } from 'uniwind';
import { CustomSheetProvider } from '@/components';
import { IoniconsIcon } from '@/components';
import { themes } from '@/themes/theme';
import { VideoProvider, defaultTheme } from 'react-native-video-toolkit';
import RNOrientationDirector, { Orientation } from 'react-native-orientation-director';
import { isTV, isTVOS } from '@/constants/utils';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Storage Permission Utility using native module
export const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    // Check if we already have permission
    const hasPermission = await StoragePermissionModule.hasStoragePermission();
    if (hasPermission) {
      return true;
    }

    // Get Android version for logging
    const androidVersion = StoragePermissionModule.getAndroidVersion();

    // Request permission
    const result = await StoragePermissionModule.requestStoragePermission();

    if (result.status === 'needs_settings') {
      // Optionally open settings automatically or show a dialog
      await StoragePermissionModule.openAppSettings();
      return false;
    }

    if (result.granted) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('❌ Error requesting storage permission:', error);
    return false;
  }
};

interface DownloadDialogProps {
  currentVersion: string;
  newVersion: string;
  updateType: string;
  showUpdateDialog: boolean;
  setShowUpdateDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const DownloadDialog = ({
  currentVersion,
  newVersion,
  updateType,
  showUpdateDialog,
  setShowUpdateDialog,
}: DownloadDialogProps) => {
  return (
    <Dialog isOpen={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50" />
        <Dialog.Content className="rounded-3xl bg-background p-5">
          <Dialog.Close className="absolute right-3 top-3" />

          <View className="items-center mt-1 mb-3">
            <IoniconsIcon name="arrow-up-circle-outline" className="text-accent" size={48} />
          </View>

          <View className="gap-3">
            <Dialog.Title className="text-center text-sm font-semibold text-foreground">
              New Version Available
            </Dialog.Title>

            <View className="flex-row justify-center gap-6">
              <View className="items-center">
                <Text className="text-base text-foreground">Current</Text>
                <Text className="text-base font-semibold text-foreground">{currentVersion}</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="items-center">
                <Text className="text-base text-foreground">New</Text>
                <Text className="text-base font-semibold text-foreground">{newVersion}</Text>
              </View>
            </View>

            <Dialog.Description className="text-center text-base text-foreground/80">
              {updateType} is now available.
            </Dialog.Description>

            <View className="gap-3">
              <Button
                variant="primary"
                onPress={async () => {
                  await WebBrowser.openBrowserAsync('https://github.com/2004durgesh/uwumi/releases/latest');
                }}
                className="w-full">
                Update Now
              </Button>

              <Dialog.Close size="md" variant="ghost" isIconOnly={false} className="w-full">
                Not Now
              </Dialog.Close>
            </View>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
};

const AppContent = () => {
  const { isUpdateAvailable, isUpdateChecked, updateInfo, setIsUpdateAvailable } = useUpdateChecker(
    EXTERNAL_LINKS.GITHUB_RELEASES_API,
  );
  const [loaded] = useFonts({
    InterMedium,
    InterSemiBold,
    InterBold,
  });

  const uniwindThemeName = useUniwind();
  const setTheme = useThemeStore((state) => state.setTheme);
  const themeName = useThemeStore((state) => state.themeName);
  // console.log(themeName, uniwindThemeName, Object.keys(themes), Object.keys(themes).includes(uniwindThemeName.theme));
  if (!Object.keys(themes).includes(uniwindThemeName.theme)) {
    setTheme(themeName ?? 'default-dark');
  }
  // Request storage permissions on app startup
  useEffect(() => {
    const requestPermissions = async () => {
      const granted = await requestStoragePermission();
      if (granted) {
      } else {
        console.warn('⚠️ Storage permissions denied');
      }
    };

    requestPermissions();
    if (Orientation.landscape && !isTV && !isTVOS) {
      RNOrientationDirector.lockTo(Orientation.portrait);
    }
    if (isTV || isTVOS) {
      RNOrientationDirector.lockTo(Orientation.landscape);
    }
  }, []);

  useEffect(() => {
    if (loaded && isUpdateChecked) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isUpdateChecked]);

  if (!loaded) {
    return null;
  }

  const contentWrapper = useCallback(
    (children: React.ReactNode) => (
      <KeyboardAvoidingView pointerEvents="box-none" behavior="padding" keyboardVerticalOffset={12} className="flex-1">
        {children}
      </KeyboardAvoidingView>
    ),
    [],
  );

  return (
    <>
      <HeroUINativeProvider
        config={{
          toast: {
            contentWrapper,
          },
          devInfo: {
            stylingPrinciples: false,
          },
        }}>
        <CustomSheetProvider>
          <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="info/[mediaType]" />
            <Stack.Screen name="watch/[mediaType]" />
            <Stack.Screen name="read/[id]" />
            <Stack.Screen name="(settings)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </CustomSheetProvider>
        {isUpdateAvailable && (
          <DownloadDialog
            currentVersion={updateInfo.currentVersion}
            newVersion={updateInfo.newVersion}
            updateType={updateInfo.updateType}
            showUpdateDialog={isUpdateAvailable}
            setShowUpdateDialog={setIsUpdateAvailable}
          />
        )}
      </HeroUINativeProvider>
      <Toaster
        position="bottom-center"
        invert
        autoWiggleOnUpdate="always"
        richColors
        {...(!isTV && { swipeToDismissDirection: 'left' as const })}
      />
    </>
  );
};

export default function RootLayout() {
  LogBox.ignoreLogs([
    'StatusBar backgroundColor is not supported with edge-to-edge enabled',
    'HeroUI Native Styling Principles',
  ]);
  const currentTheme = useCurrentTheme();
  const sheetColor = useSheetColor();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 10 * 60 * 1000, // 10 minutes
            gcTime: 60 * 60 * 1000, // 1 hour
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retryDelay: 1000,
          },
        },
      }),
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <VideoProvider
            theme={{
              colors: {
                ...defaultTheme.colors,
                sliderTrackActive: currentTheme.accent,
                sliderTrackInactive: currentTheme.default,
                spinner: currentTheme.accent,
                border: currentTheme.border,
                menuBackground: sheetColor,
              },
            }}
            config={{
              useCustomVideoTracks: true,
            }}>
            <AppContent />
          </VideoProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
