import React from 'react';
import { RefreshControl, ScrollView, Share, Text } from 'react-native';
import * as Application from 'expo-application';
import { reloadApp } from 'react-native-nitro-ota';
import { Chip } from '@/components/heroui';
import { Button } from '@/components/Button';
import { HUXStack, HUYStack, ThemedView } from '@/components/ui-primitives';
import { Image } from '@/components/Image';
import { IoniconProps, IoniconsIcon } from '@/components/Icons';
import { List as NativeList } from '@/components/native/list/List';
import { APP_VERSION, isPreRelease, useUpdateChecker } from '@/hooks/useUpdateChecker';
import { pendingOtaVersion, runningOtaVersion, useCanRestartForUpdate } from '@/hooks/useOtaUpdates';
import { useOtaUpdateStore } from '@/hooks/stores/useOtaUpdateStore';
import { EXTERNAL_LINKS, DASH_HOST } from '@/constants/config';
import { isTV } from '@/utils/tv';
import { openBrowser } from '@/utils/share';

const COMMUNITY_LINKS: { label: string; description: string; icon: IoniconProps['name']; url: string }[] = [
  {
    label: 'GitHub',
    description: 'Source code and releases',
    icon: 'logo-github',
    url: EXTERNAL_LINKS.GITHUB_REPOSITORY,
  },
  {
    label: 'Discord',
    description: 'Chat with the community',
    icon: 'logo-discord',
    url: EXTERNAL_LINKS.DISCORD_SERVER,
  },
  {
    label: 'Website',
    description: DASH_HOST,
    icon: 'globe-outline',
    url: EXTERNAL_LINKS.PROJECT_WEBSITE,
  },
];

const SectionTitle = ({ children }: { children: string }) => (
  <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">{children}</Text>
);

const About = () => {
  const { updateInfo, hasUpdate, isLoading, isError, checkForUpdates } = useUpdateChecker();
  const buildNumber = Application.nativeBuildVersion;
  const otaStatus = useOtaUpdateStore((state) => state.status);
  const otaPercent = useOtaUpdateStore((state) => state.percent);
  const canRestart = useCanRestartForUpdate();
  // Re-read on each render (otaStatus re-renders this when a download lands)
  const pendingOta = pendingOtaVersion();

  const updateStatus = isError ? "Couldn't check" : hasUpdate ? `v${updateInfo.newVersion} available` : 'Up to date';

  return (
    <ThemedView testID="about-screen">
      <ScrollView
        contentContainerClassName="gap-6 px-4 pb-24 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void checkForUpdates()} />}>
        <HUYStack className="items-center gap-3">
          <Image
            source={require('../../../assets/images/icon.png')}
            alt="uwumi logo"
            style={{ width: 88, height: 88, borderRadius: 22 }}
          />
          <HUYStack className="items-center gap-1">
            <Text className="text-2xl font-bold text-foreground">uwumi</Text>
            <Text className="text-sm text-foreground/60">Anime, manga and movies in one place</Text>
          </HUYStack>
          <HUXStack className="gap-2">
            <Chip size="sm" focusable={isTV ? false : undefined}>{`v${APP_VERSION}`}</Chip>
            {isPreRelease(APP_VERSION) && (
              <Chip size="sm" color="warning" focusable={isTV ? false : undefined}>
                Pre-release
              </Chip>
            )}
            {__DEV__ && (
              <Chip size="sm" color="default" focusable={isTV ? false : undefined}>
                Development
              </Chip>
            )}
          </HUXStack>
        </HUYStack>

        <HUYStack className="gap-2">
          <SectionTitle>App</SectionTitle>
          <NativeList>
            <NativeList.Item
              testID="about-row-version"
              icon="phone-portrait-outline"
              title="Version"
              trailing={buildNumber ? `${APP_VERSION} (${buildNumber})` : APP_VERSION}
            />
            <NativeList.Item
              testID="about-row-js-bundle"
              icon="layers-outline"
              title="JS bundle"
              trailing={__DEV__ ? 'Metro' : (runningOtaVersion ?? 'Built-in')}
            />
            {otaStatus === 'downloading' && (
              <NativeList.Item
                testID="about-row-update-downloading"
                icon="cloud-download-outline"
                title="Downloading update"
                trailing={`${otaPercent ?? 0}%`}
              />
            )}
            {pendingOta && otaStatus !== 'downloading' && (
              <NativeList.Item
                testID="about-row-update-ready"
                icon="sparkles-outline"
                title="Update ready"
                description={`${pendingOta} · ${canRestart ? 'tap to restart' : 'restart once downloads finish'}`}
                onPress={() => reloadApp()}
                disabled={!canRestart}
              />
            )}
            <NativeList.Item
              testID="about-row-check-updates"
              icon="refresh-outline"
              title="Check for updates"
              trailing={updateStatus}
              trailingLoading={isLoading}
              trailingTone={isError ? 'danger' : 'muted'}
              onPress={() => checkForUpdates()}
              disabled={isLoading}
            />
          </NativeList>

          {hasUpdate && (
            <Button
              testID="about-download-update"
              variant="primary"
              onPress={() => openBrowser(EXTERNAL_LINKS.GITHUB_LATEST_RELEASE)}>
              <IoniconsIcon name="download-outline" size={18} className="text-accent-foreground" />
              <Button.Label>{`Download v${updateInfo.newVersion}`}</Button.Label>
            </Button>
          )}
        </HUYStack>

        <HUYStack className="gap-2">
          <SectionTitle>Community</SectionTitle>
          <NativeList>
            {COMMUNITY_LINKS.map(({ label, description, icon, url }) => (
              <NativeList.Item
                key={label}
                testID="about-row-community"
                icon={icon}
                title={label}
                description={description}
                onPress={() => openBrowser(url)}
              />
            ))}
          </NativeList>
        </HUYStack>

        <HUYStack className="gap-2">
          <SectionTitle>Support</SectionTitle>
          <NativeList>
            <NativeList.Item
              testID="about-row-report-bug"
              icon="bug-outline"
              title="Report a bug"
              description={`Include v${APP_VERSION} in the report`}
              onPress={() => openBrowser(EXTERNAL_LINKS.GITHUB_NEW_ISSUE)}
            />
            <NativeList.Item
              testID="about-row-share"
              icon="share-social-outline"
              title="Share uwumi"
              description="Send the download link to a friend"
              onPress={() =>
                Share.share({
                  message: `Watch anime, read manga and stream movies with uwumi: ${EXTERNAL_LINKS.GITHUB_LATEST_RELEASE}`,
                })
              }
            />
          </NativeList>
        </HUYStack>

        <Text className="text-center text-xs text-foreground/50">Made with ♥ by uwumilabs</Text>
      </ScrollView>
    </ThemedView>
  );
};

export default About;
