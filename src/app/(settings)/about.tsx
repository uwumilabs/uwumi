import React from 'react';
import { RefreshControl, ScrollView, Share, Text } from 'react-native';
import * as Application from 'expo-application';
import { getStoredOtaVersion, reloadApp } from 'react-native-nitro-ota';
import { Chip } from '@/components/heroui';
import { Button } from '@/components/Button';
import { HUXStack, HUYStack, Image, IoniconProps, IoniconsIcon, NativeList, ThemedView } from '@/components';
import { useUpdateChecker } from '@/hooks/useUpdateChecker';
import { runningOtaVersion, useHasActiveDownloads, useOtaUpdateStore } from '@/hooks';
import { EXTERNAL_LINKS } from '@/constants/config';
import { isTV, openBrowser } from '@/constants/utils';

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
    description: 'uwumi.vercel.app',
    icon: 'globe-outline',
    url: EXTERNAL_LINKS.PROJECT_WEBSITE,
  },
];

const SectionTitle = ({ children }: { children: string }) => (
  <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">{children}</Text>
);

const InfoRow = ({ icon, title, value }: { icon: IoniconProps['name']; title: string; value: string }) => (
  <NativeList.Item icon={icon} title={title} trailing={value} />
);

const About = () => {
  const { updateInfo, isUpdateAvailable, isLoading, isError, checkForUpdates } = useUpdateChecker(
    EXTERNAL_LINKS.GITHUB_LATEST_RELEASE_API,
  );

  // The installed binary's version; package.json's can differ once an OTA bundle is running
  const appVersion = Application.nativeApplicationVersion ?? updateInfo.currentVersion;
  const buildNumber = Application.nativeBuildVersion;
  const isPreRelease = appVersion.includes('-');
  const otaStatus = useOtaUpdateStore((state) => state.status);
  const otaPercent = useOtaUpdateStore((state) => state.percent);
  const hasActiveDownloads = useHasActiveDownloads();
  // Re-read on each render (otaStatus re-renders this when a download lands)
  const downloadedOtaVersion = getStoredOtaVersion();
  const pendingOtaVersion =
    downloadedOtaVersion && downloadedOtaVersion !== runningOtaVersion ? downloadedOtaVersion : null;

  const updateStatus = isError
    ? "Couldn't check"
    : isUpdateAvailable
      ? `v${updateInfo.newVersion} available`
      : 'Up to date';

  return (
    <ThemedView>
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
            <Chip size="sm" focusable={isTV ? false : undefined}>{`v${appVersion}`}</Chip>
            {isPreRelease && (
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
            <InfoRow
              icon="phone-portrait-outline"
              title="Version"
              value={buildNumber ? `${appVersion} (${buildNumber})` : appVersion}
            />
            <InfoRow
              icon="layers-outline"
              title="JS bundle"
              value={__DEV__ ? 'Metro' : (runningOtaVersion ?? 'Built-in')}
            />
            {otaStatus === 'downloading' && (
              <InfoRow icon="cloud-download-outline" title="Downloading update" value={`${otaPercent ?? 0}%`} />
            )}
            {pendingOtaVersion && otaStatus !== 'downloading' && (
              <NativeList.Item
                icon="sparkles-outline"
                title="Update ready"
                description={`${pendingOtaVersion} · ${hasActiveDownloads ? 'restart once downloads finish' : 'tap to restart'}`}
                onPress={() => reloadApp()}
                disabled={hasActiveDownloads}
              />
            )}
            <NativeList.Item
              icon="refresh-outline"
              title="Check for updates"
              trailing={updateStatus}
              trailingLoading={isLoading}
              trailingTone={isError ? 'danger' : 'muted'}
              onPress={() => checkForUpdates()}
              disabled={isLoading}
            />
          </NativeList>

          {isUpdateAvailable && (
            <Button variant="primary" onPress={() => openBrowser(EXTERNAL_LINKS.GITHUB_LATEST_RELEASE)}>
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
              icon="bug-outline"
              title="Report a bug"
              description={`Include v${appVersion} in the report`}
              onPress={() => openBrowser(EXTERNAL_LINKS.GITHUB_NEW_ISSUE)}
            />
            <NativeList.Item
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
