import React from 'react';
import { SETTINGS_SCREENS, type SettingsScreen } from '@/utils/routes';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { List as NativeList } from '@/components/native/list/List';
import { ThemedView } from '@/components/ui-primitives';

const Settings = () => {
  const router = useRouter();
  const go = (screen: SettingsScreen) => () => router.push(SETTINGS_SCREENS[screen].href);

  return (
    <ThemedView testID="settings-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <NativeList variant="flat">
          <NativeList.Item
            testID="settings-row-appearance"
            icon="color-palette-outline"
            title={SETTINGS_SCREENS.appearance.title}
            description="Theme, accent colour, pure black"
            onPress={go('appearance')}
          />
          <NativeList.Item
            testID="settings-row-player"
            icon="play-circle-outline"
            title={SETTINGS_SCREENS.player.title}
            description="Controls, intro skip, gestures, subtitles"
            onPress={go('player')}
          />
          <NativeList.Item
            testID="settings-row-reader"
            icon="book-outline"
            title={SETTINGS_SCREENS.reader.title}
            description="Background, page number, side padding"
            onPress={go('reader')}
          />
          <NativeList.Item
            testID="settings-row-downloads"
            icon="download-outline"
            title={SETTINGS_SCREENS.downloads.title}
            description="Download queue, storage used"
            onPress={go('downloads')}
          />
          <NativeList.Item
            testID="settings-row-extensions"
            icon="extension-puzzle-outline"
            title={SETTINGS_SCREENS.extensions.title}
            description="Install and manage sources"
            onPress={go('extensions')}
          />
          <NativeList.Item
            testID="settings-row-data"
            icon="server-outline"
            title={SETTINGS_SCREENS.data.title}
            description="Storage usage, clear cache and history"
            onPress={go('data')}
          />
          <NativeList.Item
            testID="settings-row-about"
            icon="information-circle-outline"
            title={SETTINGS_SCREENS.about.title}
            description="Version, updates, community"
            onPress={go('about')}
          />
        </NativeList>
      </ScrollView>
    </ThemedView>
  );
};

export default Settings;
