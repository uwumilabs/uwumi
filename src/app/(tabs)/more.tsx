import React from 'react';
import { SETTINGS_SCREENS, type SettingsScreen } from '@/utils/routes';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { List as NativeList } from '@/components/native/list/List';
import { Separator } from '@/components/native/separator/Separator';
import { ThemedView } from '@/components/ui-primitives';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import { useRemainingDownloadsCount } from '@/downloads/useDownloadStore';
import { isTV } from '@/utils/tv';
import { setEpisodeAlerts } from '@/services/episodeAlerts';
import { PerfProfiler } from '@/perf/perfHarness';

const LOGO = require('../../../assets/images/icon.png');

// Aniyomi's More tab: logo, the two switches, then the screens, then settings and help
const More = () => {
  const router = useRouter();
  const incognito = usePreferencesStore((state) => state.incognito);
  const setIncognito = usePreferencesStore((state) => state.setIncognito);
  const downloadedOnly = usePreferencesStore((state) => state.downloadedOnly);
  const setDownloadedOnly = usePreferencesStore((state) => state.setDownloadedOnly);
  const episodeNotifications = usePreferencesStore((state) => state.episodeNotifications);
  const remainingDownloads = useRemainingDownloadsCount();

  const go = (screen: SettingsScreen) => () => router.push(SETTINGS_SCREENS[screen].href);

  return (
    <PerfProfiler id="more tab">
      <ThemedView testID="more-screen">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="items-center py-10">
            <Image source={LOGO} style={{ width: 72, height: 72, borderRadius: 20 }} />
          </View>
          <Separator />
          <NativeList variant="flat">
            <NativeList.Item
              testID="more-row-downloaded-only"
              icon="cloud-offline-outline"
              title="Downloaded only"
              description="Filters favorites and history"
              toggle={{ value: downloadedOnly, onValueChange: setDownloadedOnly }}
            />
            <NativeList.Item
              testID="more-row-incognito"
              icon="glasses-outline"
              title="Incognito mode"
              description="Pauses watch history"
              toggle={{ value: incognito, onValueChange: setIncognito }}
            />
            {!isTV && (
              <NativeList.Item
                testID="more-row-episode-notifications"
                icon="notifications-outline"
                title="New episode notifications"
                description="When a favorite gets a new episode"
                toggle={{ value: episodeNotifications, onValueChange: setEpisodeAlerts }}
              />
            )}
          </NativeList>
          <Separator />
          <NativeList variant="flat">
            <NativeList.Item
              testID="more-row-history"
              icon="time-outline"
              title={SETTINGS_SCREENS.history.title}
              onPress={go('history')}
            />
            <NativeList.Item
              testID="more-row-download-queue"
              icon="download-outline"
              title="Download queue"
              trailing={remainingDownloads > 0 ? `${remainingDownloads} remaining` : undefined}
              onPress={go('downloads')}
            />
            <NativeList.Item
              testID="more-row-favorites"
              icon="heart-outline"
              title={SETTINGS_SCREENS.favorites.title}
              onPress={go('favorites')}
            />
            <NativeList.Item
              testID="more-row-extensions"
              icon="extension-puzzle-outline"
              title={SETTINGS_SCREENS.extensions.title}
              onPress={go('extensions')}
            />
            <NativeList.Item
              testID="more-row-statistics"
              icon="stats-chart-outline"
              title={SETTINGS_SCREENS.statistics.title}
              onPress={go('statistics')}
            />
            <NativeList.Item
              testID="more-row-data"
              icon="server-outline"
              title={SETTINGS_SCREENS.data.title}
              onPress={go('data')}
            />
          </NativeList>
          <Separator />
          <NativeList variant="flat">
            <NativeList.Item
              testID="more-row-settings"
              icon="settings-outline"
              title={SETTINGS_SCREENS.settings.title}
              onPress={go('settings')}
            />
            <NativeList.Item
              testID="more-row-player-settings"
              icon="play-circle-outline"
              title="Player settings"
              onPress={go('player')}
            />
            <NativeList.Item
              testID="more-row-about"
              icon="information-circle-outline"
              title={SETTINGS_SCREENS.about.title}
              onPress={go('about')}
            />
            {__DEV__ && (
              <NativeList.Item
                testID="more-row-example"
                icon="flask-outline"
                title={SETTINGS_SCREENS.example.title}
                onPress={go('example')}
              />
            )}
          </NativeList>
        </ScrollView>
      </ThemedView>
    </PerfProfiler>
  );
};

export default More;
