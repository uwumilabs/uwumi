import React from 'react';
import { ScrollView } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { NativeList, ThemedView } from '@/components';

const Settings = () => {
  const router = useRouter();
  const go = (href: string) => () => router.push(href as Href);

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <NativeList variant="flat">
          <NativeList.Item
            icon="color-palette-outline"
            title="Appearance"
            description="Theme, accent colour, pure black"
            onPress={go('/(settings)/appearance')}
          />
          <NativeList.Item
            icon="play-circle-outline"
            title="Player"
            description="External subtitles"
            onPress={go('/(settings)/player')}
          />
          <NativeList.Item
            icon="download-outline"
            title="Downloads"
            description="Download queue, storage used"
            onPress={go('/(settings)/downloads')}
          />
          <NativeList.Item
            icon="extension-puzzle-outline"
            title="Extensions"
            description="Install and manage sources"
            onPress={go('/(settings)/extensions')}
          />
          <NativeList.Item
            icon="server-outline"
            title="Data and storage"
            description="Storage usage, clear cache and history"
            onPress={go('/(settings)/data')}
          />
          <NativeList.Item
            icon="information-circle-outline"
            title="About"
            description="Version, updates, community"
            onPress={go('/(settings)/about')}
          />
        </NativeList>
      </ScrollView>
    </ThemedView>
  );
};

export default Settings;
