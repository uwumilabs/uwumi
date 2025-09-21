import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { TamaguiProvider, Theme, Dialog, Unspaced, XStack, Text, YStack, Button, Separator, View } from 'tamagui';
import { X, Download, ArrowUpCircle } from '@tamagui/lucide-icons';
import { PortalProvider } from '@tamagui/portal';
import { Toaster } from 'sonner-native';
import config from '../../tamagui.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Inter_500Medium as InterMedium,
  Inter_600SemiBold as InterSemiBold,
  Inter_800ExtraBold as InterBold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeStore, useAccentStore, useUpdateChecker, useOnboardingFlowStore } from '@/hooks';
import * as WebBrowser from 'expo-web-browser';
import { SystemBars } from 'react-native-edge-to-edge';
import { LogBox } from 'react-native';
import { EXTERNAL_LINKS } from '@/constants/config';
import { useSegments } from 'expo-router';
import { usePathname } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
  const accentName = useAccentStore((state) => state.accentName);
  return (
    <Theme name={accentName}>
      <Dialog modal open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            backgroundColor="rgba(0,0,0,0.5)"
            animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            width="85%"
            maxWidth={400}
            padding="$5"
            borderRadius="$6"
            animation={[
              'quick',
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ opacity: 0, scale: 0.95 }}
            exitStyle={{ opacity: 0, scale: 0.95 }}
            gap="$4">
            <YStack alignItems="center" marginTop="$2" marginBottom="$2">
              <ArrowUpCircle size={48} color={'$color'} opacity={0.9} />
            </YStack>
            <Dialog.Title textAlign="center" fontSize={13} fontWeight="700">
              New Version Available
            </Dialog.Title>
            <XStack justifyContent="center" gap="$4" paddingVertical="$2">
              <YStack alignItems="center">
                <Text fontSize={16}>Current</Text>
                <Text fontWeight="600">{currentVersion}</Text>
              </YStack>
              <Separator vertical />
              <YStack alignItems="center">
                <Text fontSize={16}>New</Text>
                <Text fontWeight="600">{newVersion}</Text>
              </YStack>
            </XStack>
            <Dialog.Description textAlign="center" paddingHorizontal="$2">
              {updateType} is now available.
            </Dialog.Description>
            <YStack gap="$3" marginTop="$2">
              <Button
                themeInverse
                icon={Download}
                fontSize={18}
                fontWeight="600"
                borderRadius="$4"
                onPress={async () => {
                  await WebBrowser.openBrowserAsync('https://github.com/2004durgesh/uwumi/releases/latest');
                }}>
                Update Now
              </Button>
              <Button variant="outlined" fontSize={18} borderRadius="$4" onPress={() => setShowUpdateDialog(false)}>
                Not Now
              </Button>
            </YStack>
            <Unspaced>
              <Dialog.Close asChild>
                <Button position="absolute" top="$3" right="$3" size="$2" circular icon={X} opacity={0.7} />
              </Dialog.Close>
            </Unspaced>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </Theme>
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

  const themeName = useThemeStore((state) => state.themeName);
  useEffect(() => {
    if (loaded && isUpdateChecked) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isUpdateChecked]);
  const { hasCompletedOnboarding } = useOnboardingFlowStore();

  if (__DEV__) {
    const segments = useSegments();
    const pathname = usePathname();
    // console.log(`Current segments: ${segments.join('/')}`);
    // console.log(`Current pathname: ${pathname}`);
  }

  if (!loaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config}>
      <PortalProvider>
        <Theme name={themeName}>
          <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
            {/* <Stack.Screen name="(onboarding)" /> */}
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="info/[mediaType]" />
            <Stack.Screen name="watch/[mediaType]" />
            <Stack.Screen name="read/[id]" />
            <Stack.Screen name="(settings)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          {isUpdateAvailable && (
            <DownloadDialog
              currentVersion={updateInfo.currentVersion}
              newVersion={updateInfo.newVersion}
              updateType={updateInfo.updateType}
              showUpdateDialog={isUpdateAvailable}
              setShowUpdateDialog={setIsUpdateAvailable}
            />
          )}
        </Theme>
      </PortalProvider>
      <Toaster position="bottom-center" invert autoWiggleOnUpdate="always" richColors swipeToDismissDirection="left" />
      <SystemBars hidden={false} />
    </TamaguiProvider>
  );
};

export default function RootLayout() {
  //suppress edge-to-edge warning for status bar background color
  LogBox.ignoreLogs(['StatusBar backgroundColor is not supported with edge-to-edge enabled']);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 60 * 60 * 1000, // 1 hour
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retryDelay: 1000,
      },
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
