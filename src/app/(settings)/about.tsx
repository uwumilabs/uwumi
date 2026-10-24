import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Share, Text, View } from 'react-native';
import * as Application from 'expo-application';
import { getStoredOtaVersion, reloadApp } from 'react-native-nitro-ota';
import { Button, Chip, ListGroup, Separator } from 'heroui-native';
import { HUXStack, HUYStack, Image, IoniconProps, IoniconsIcon, ThemedView } from '@/components';
import { useUpdateChecker } from '@/hooks/useUpdateChecker';
import { runningOtaVersion, useCurrentTheme, useHasActiveDownloads, useOtaUpdateStore } from '@/hooks';
import { EXTERNAL_LINKS } from '@/constants/config';
import { openBrowser } from '@/constants/utils';

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
    description: 'uwumi-dash.netlify.app',
    icon: 'globe-outline',
    url: EXTERNAL_LINKS.PROJECT_WEBSITE,
  },
];

const SectionTitle = ({ children }: { children: string }) => (
  <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-foreground/60">{children}</Text>
);

const InfoRow = ({ icon, title, value }: { icon: IoniconProps['name']; title: string; value: React.ReactNode }) => {
  const currentTheme = useCurrentTheme();
  return (
    <ListGroup.Item disabled>
      <ListGroup.ItemPrefix>
        <IoniconsIcon name={icon} size={20} color={currentTheme?.foreground} />
      </ListGroup.ItemPrefix>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>{value}</ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
};

const About = () => {
  const currentTheme = useCurrentTheme();
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

  const updateStatus = isLoading ? (
    <ActivityIndicator size="small" />
  ) : (
    <Text className={isError ? 'text-sm text-danger' : 'text-sm text-foreground/70'}>
      {isError ? "Couldn't check" : isUpdateAvailable ? `v${updateInfo.newVersion} available` : 'Up to date'}
    </Text>
  );

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
            <Chip size="sm">{`v${appVersion}`}</Chip>
            {isPreRelease && (
              <Chip size="sm" color="warning">
                Pre-release
              </Chip>
            )}
            {__DEV__ && (
              <Chip size="sm" color="default">
                Development
              </Chip>
            )}
          </HUXStack>
        </HUYStack>

        <HUYStack className="gap-2">
          <SectionTitle>App</SectionTitle>
          <ListGroup>
            <InfoRow
              icon="phone-portrait-outline"
              title="Version"
              value={
                <Text className="text-sm text-foreground/70">
                  {buildNumber ? `${appVersion} (${buildNumber})` : appVersion}
                </Text>
              }
            />
            <Separator className="mx-4" />
            <InfoRow
              icon="layers-outline"
              title="JS bundle"
              value={
                <Text className="text-sm text-foreground/70">
                  {__DEV__ ? 'Metro' : (runningOtaVersion ?? 'Built-in')}
                </Text>
              }
            />
            {otaStatus === 'downloading' && (
              <>
                <Separator className="mx-4" />
                <InfoRow
                  icon="cloud-download-outline"
                  title="Downloading update"
                  value={<Text className="text-sm text-foreground/70">{`${otaPercent ?? 0}%`}</Text>}
                />
              </>
            )}
            {pendingOtaVersion && otaStatus !== 'downloading' && (
              <>
                <Separator className="mx-4" />
                <ListGroup.Item onPress={() => reloadApp()} disabled={hasActiveDownloads}>
                  <ListGroup.ItemPrefix>
                    <IoniconsIcon name="sparkles-outline" size={20} color={currentTheme?.foreground} />
                  </ListGroup.ItemPrefix>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Update ready</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>{`${pendingOtaVersion} · ${hasActiveDownloads ? 'restart once downloads finish' : 'tap to restart'}`}</ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix />
                </ListGroup.Item>
              </>
            )}
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => checkForUpdates()} disabled={isLoading}>
              <ListGroup.ItemPrefix>
                <IoniconsIcon name="refresh-outline" size={20} color={currentTheme?.foreground} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Check for updates</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>{updateStatus}</ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>

          {isUpdateAvailable && (
            <Button variant="primary" onPress={() => openBrowser(EXTERNAL_LINKS.GITHUB_LATEST_RELEASE)}>
              <IoniconsIcon name="download-outline" size={18} className="text-accent-foreground" />
              <Button.Label>{`Download v${updateInfo.newVersion}`}</Button.Label>
            </Button>
          )}
        </HUYStack>

        <HUYStack className="gap-2">
          <SectionTitle>Community</SectionTitle>
          <ListGroup>
            {COMMUNITY_LINKS.map(({ label, description, icon, url }, index) => (
              <View key={label}>
                {index > 0 && <Separator className="mx-4" />}
                <ListGroup.Item onPress={() => openBrowser(url)}>
                  <ListGroup.ItemPrefix>
                    <IoniconsIcon name={icon} size={20} color={currentTheme?.foreground} />
                  </ListGroup.ItemPrefix>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>{label}</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix />
                </ListGroup.Item>
              </View>
            ))}
          </ListGroup>
        </HUYStack>

        <HUYStack className="gap-2">
          <SectionTitle>Support</SectionTitle>
          <ListGroup>
            <ListGroup.Item onPress={() => openBrowser(EXTERNAL_LINKS.GITHUB_NEW_ISSUE)}>
              <ListGroup.ItemPrefix>
                <IoniconsIcon name="bug-outline" size={20} color={currentTheme?.foreground} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Report a bug</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>{`Include v${appVersion} in the report`}</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item
              onPress={() =>
                Share.share({
                  message: `Watch anime, read manga and stream movies with uwumi: ${EXTERNAL_LINKS.GITHUB_LATEST_RELEASE}`,
                })
              }>
              <ListGroup.ItemPrefix>
                <IoniconsIcon name="share-social-outline" size={20} color={currentTheme?.foreground} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Share uwumi</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>Send the download link to a friend</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </ListGroup>
        </HUYStack>

        <Text className="text-center text-xs text-foreground/50">Made with ♥ by uwumilabs</Text>
      </ScrollView>
    </ThemedView>
  );
};

export default About;
