import React from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { NativeList, Separator, ThemedView } from '@/components';
import { usePreferencesStore, useRemainingDownloadsCount } from '@/hooks';
import { EXTERNAL_LINKS } from '@/constants/config';
import { isTV, openBrowser } from '@/constants/utils';
import { ensureAlertPermission } from '@/utils/episodeAlerts';
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
  const setEpisodeNotifications = usePreferencesStore((state) => state.setEpisodeNotifications);
  const remainingDownloads = useRemainingDownloadsCount();

  const go = (href: string) => () => router.push(href as Href);
  const toggleEpisodeNotifications = async (value: boolean) => {
    if (!value) return setEpisodeNotifications(false);
    const permission = await ensureAlertPermission();
    if (permission === 'granted') setEpisodeNotifications(true);
    // Android stops showing the prompt after two refusals; only system settings can grant it then
    else if (permission === 'blocked') void Linking.openSettings();
  };

  return (
    <PerfProfiler id="more tab">
      <ThemedView>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="items-center py-10">
            <Image source={LOGO} style={{ width: 72, height: 72, borderRadius: 20 }} />
          </View>
          <Separator />
          <NativeList variant="flat">
            <NativeList.Item
              icon="cloud-offline-outline"
              title="Downloaded only"
              description="Filters favorites and history"
              toggle={{ value: downloadedOnly, onValueChange: setDownloadedOnly }}
            />
            <NativeList.Item
              icon="glasses-outline"
              title="Incognito mode"
              description="Pauses watch history"
              toggle={{ value: incognito, onValueChange: setIncognito }}
            />
            {!isTV && (
              <NativeList.Item
                icon="notifications-outline"
                title="New episode notifications"
                description="When a favorite gets a new episode"
                toggle={{ value: episodeNotifications, onValueChange: toggleEpisodeNotifications }}
              />
            )}
          </NativeList>
          <Separator />
          <NativeList variant="flat">
            <NativeList.Item icon="time-outline" title="History" onPress={go('/(settings)/history')} />
            <NativeList.Item
              icon="download-outline"
              title="Download queue"
              trailing={remainingDownloads > 0 ? `${remainingDownloads} remaining` : undefined}
              onPress={go('/(settings)/downloads')}
            />
            <NativeList.Item icon="heart-outline" title="Favorites" onPress={go('/(settings)/favorites')} />
            <NativeList.Item
              icon="extension-puzzle-outline"
              title="Extensions"
              onPress={go('/(settings)/extensions')}
            />
            <NativeList.Item icon="stats-chart-outline" title="Statistics" onPress={go('/(settings)/statistics')} />
            <NativeList.Item icon="server-outline" title="Data and storage" onPress={go('/(settings)/data')} />
          </NativeList>
          <Separator />
          <NativeList variant="flat">
            <NativeList.Item icon="settings-outline" title="Settings" onPress={go('/(settings)/settings')} />
            <NativeList.Item icon="play-circle-outline" title="Player settings" onPress={go('/(settings)/player')} />
            <NativeList.Item icon="information-circle-outline" title="About" onPress={go('/(settings)/about')} />
            <NativeList.Item
              icon="help-circle-outline"
              title="Help"
              onPress={() => openBrowser(EXTERNAL_LINKS.PROJECT_WEBSITE)}
            />
            {process.env.NODE_ENV === 'development' && (
              <NativeList.Item icon="flask-outline" title="Example" onPress={go('/(settings)/example')} />
            )}
          </NativeList>
        </ScrollView>
      </ThemedView>
    </PerfProfiler>
  );
};

export default More;
