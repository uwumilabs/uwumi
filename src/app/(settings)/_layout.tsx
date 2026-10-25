import { useCurrentTheme, usePureBlackBackground } from '@/hooks';
import { Stack } from 'expo-router';
import { StackHeader } from '@/components';
import { perfScreenLayout } from '@/perf/perfHarness';

export default function SettingsLayout() {
  const currentTheme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);

  return (
    <Stack
      screenLayout={perfScreenLayout}
      screenOptions={{
        contentStyle: {
          backgroundColor: pureBlackBackground ? '#000' : currentTheme?.background,
        },
        header: (props) => (
          <StackHeader
            title={props.options.title}
            onBack={props.navigation.canGoBack() ? () => props.navigation.goBack() : undefined}
          />
        ),
      }}>
      <Stack.Screen name="about" options={{ title: 'About' }} />
      <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
      <Stack.Screen name="player" options={{ title: 'Player' }} />
      <Stack.Screen name="favorites" options={{ title: 'Favorites' }} />
      <Stack.Screen name="downloads" options={{ title: 'Downloads' }} />
      <Stack.Screen name="example" options={{ title: 'Example' }} />
      <Stack.Screen name="extensions" options={{ title: 'Extensions' }} />
    </Stack>
  );
}
