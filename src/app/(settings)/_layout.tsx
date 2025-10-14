import { useCurrentTheme, usePureBlackBackground } from '@/hooks';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View, XStack } from 'tamagui';
import { ArrowLeft } from '@tamagui/lucide-icons';
import { RippleButton } from '@/components/ui-primitives';

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
              backgroundColor={pureBlackBackground ? '#000' : currentTheme?.background}
              paddingTop={insets.top}
              zIndex={1000}>
              <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$4">
                {/* Left Section - Back Button */}
                <XStack alignItems="center" flex={1}>
                  {canGoBack && (
                    // a small delay to ensure the back navigation is smooth
                    <RippleButton onPress={() => props.navigation.goBack()}>
                      <ArrowLeft size={24} color={currentTheme?.color1} />
                    </RippleButton>
                  )}
                </XStack>

                {/* Center Section - Title */}
                <XStack flex={2} justifyContent="center">
                  <Text
                    fontSize="$5"
                    fontWeight="600"
                    color={currentTheme?.color1}
                    textAlign="center"
                    numberOfLines={1}>
                    {props.options.title}
                  </Text>
                </XStack>

                {/* Right Section - Empty for now */}
                <XStack flex={1} justifyContent="flex-end" />
              </XStack>
            </View>
          );
        },
      }}>
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
      <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
      <Stack.Screen name="favorites" options={{ title: 'Favorites' }} />
      <Stack.Screen name="example" options={{ title: 'Example' }} />
      <Stack.Screen name="extensions" options={{ title: 'Extensions' }} />
    </Stack>
  );
}
