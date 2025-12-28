import { useCurrentTheme, usePureBlackBackground } from '@/hooks';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import { RippleButton, HUXStack, IoniconsIcon } from '@/components';

export default function SettingsLayout() {
  const currentTheme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const insets = useSafeAreaInsets();

  //making a custom header component due to edge-to-edge issues with the default header in Expo Router or may be i'm small brained
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        contentStyle: {
          paddingTop: insets.top * 2,
          backgroundColor: pureBlackBackground ? '#000' : currentTheme?.background,
        },
        header(props) {
          const canGoBack = props.navigation.canGoBack();
          return (
            <View
              style={{
                backgroundColor: pureBlackBackground ? '#000' : currentTheme?.background,
                paddingTop: insets.top,
              }}
              className="z-1000">
              <HUXStack className="items-center px-4">
                {/* Left Section - Back Button */}
                <HUXStack className="flex-1 items-start">
                  {canGoBack && (
                    // a small delay to ensure the back navigation is smooth
                    <RippleButton onPress={() => props.navigation.goBack()}>
                      <IoniconsIcon name="chevron-back" size={24} color={currentTheme?.foreground} />
                    </RippleButton>
                  )}
                </HUXStack>

                {/* Center Section - Title */}
                <HUXStack className="flex-1 items-center justify-center">
                  <Text className="text-foreground text-xl font-semibold text-center ">{props.options.title}</Text>
                </HUXStack>

                {/* Right Section - Empty for now */}
                <HUXStack className="flex-1 items-end" />
              </HUXStack>
            </View>
          );
        },
      }}>
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
      <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
      <Stack.Screen name="favorites" options={{ title: 'Favorites' }} />
      <Stack.Screen name="downloads" options={{ title: 'Downloads' }} />
      <Stack.Screen name="example" options={{ title: 'Example' }} />
      <Stack.Screen name="extensions" options={{ title: 'Extensions' }} />
    </Stack>
  );
}
