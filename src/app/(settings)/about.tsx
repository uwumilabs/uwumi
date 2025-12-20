import React, { useEffect } from 'react';
import { ThemedView } from '@/components/ui-primitives';
import { Github, ExternalLink, CheckCircle2, AlertCircle, Globe, RefreshCw } from 'lucide-react-native';
import { CustomImage, RippleButton, HUYStack, HUXStack } from '@/components';
import { useUpdateChecker } from '@/hooks/useUpdateChecker';
import { openBrowserAsync } from 'expo-web-browser';
import { EXTERNAL_LINKS } from '@/constants/config';
import { useCurrentTheme } from '@/hooks';
import { toast } from 'sonner-native';
import { DiscordIcon } from '@/svg';
import { Card, Divider } from 'heroui-native';
import { ActivityIndicator, ScrollView, Text } from 'react-native';

const About = () => {
  const { updateInfo, isLoading, isError, checkForUpdates } = useUpdateChecker(
    EXTERNAL_LINKS.GITHUB_LATEST_RELEASE_API,
  );

  const hasNewVersion = !updateInfo.isNewVersionPreRelease && updateInfo.newVersion !== updateInfo.currentVersion;
  const currentTheme = useCurrentTheme();

  // Handle error state with toast notification in useEffect to avoid side effects during render
  useEffect(() => {
    if (isError) {
      toast.error('Unable to check for updates. Please try again later.', {
        description: `Current version: ${updateInfo.currentVersion}`,
      });
    }
  }, [isError, updateInfo.currentVersion]);

  return (
    <ThemedView>
      <ScrollView>
        <HUYStack className="gap-6 p-4">
          <HUYStack className="items-center gap-2">
            <CustomImage
              source={require('../../../assets/images/icon.png')}
              alt="Logo"
              style={{ width: 100, height: 100, borderRadius: 20 }}
            />
          </HUYStack>

          <Divider />
          {process.env.NODE_ENV && (
            <Card className="self-center my-2 w-64 rounded-3xl p-2">
              <Card.Body>
                <HUXStack className="items-center justify-center gap-2">
                  <AlertCircle size={16} />
                  <Text className="text-lg font-medium">
                    Environment: <Text className="font-semibold capitalize text-accent">{process.env.NODE_ENV}</Text>
                  </Text>
                </HUXStack>
              </Card.Body>
            </Card>
          )}

          <Card className="rounded-3xl p-4">
            <Card.Body>
              <HUYStack className="gap-3">
                <HUXStack className="items-center gap-2">
                  <CheckCircle2 size={18} color="$color" />
                  <Text className="text-xl font-semibold">Version Information</Text>
                </HUXStack>

                <HUYStack className="gap-1 pl-2">
                  <Text className="text-foreground text-lg">Current Version</Text>
                  {isLoading ? (
                    <HUXStack className="items-center gap-2">
                      <ActivityIndicator size="small" />
                      <Text className="text-2xl font-medium">Checking for updates...</Text>
                    </HUXStack>
                  ) : isError ? (
                    <Text className="text-lg font-medium text-red-500">
                      {updateInfo.currentVersion} (Unable to check for updates)
                    </Text>
                  ) : (
                    <Text className="text-lg font-medium">
                      {updateInfo.createdAt
                        ? `${updateInfo.currentVersion} (${new Date(updateInfo.createdAt).toLocaleDateString()})`
                        : updateInfo.currentVersion}
                    </Text>
                  )}
                </HUYStack>

                {hasNewVersion && (
                  <Card className="mt-2 rounded-2xl p-3">
                    <Card.Body>
                      <HUYStack className="gap-1">
                        <HUXStack className="items-center gap-2">
                          <AlertCircle size={16} color="$color" />
                          <Text className="text-base font-semibold text-foreground">Update Available</Text>
                        </HUXStack>
                        <Text className="text-lg font-medium">{`Version ${updateInfo.newVersion}`}</Text>
                      </HUYStack>
                    </Card.Body>
                  </Card>
                )}
              </HUYStack>
            </Card.Body>
          </Card>

          <HUYStack className="items-center gap-4">
            <RippleButton onPress={() => checkForUpdates()}>
              <HUXStack className="items-center gap-2">
                <RefreshCw size={20} color={currentTheme.accent} />
                <Text className="text-foreground font-semibold">Check for Updates</Text>
              </HUXStack>
            </RippleButton>
            <HUXStack className="flex-wrap items-center justify-center gap-4">
              <RippleButton onPress={() => openBrowserAsync(EXTERNAL_LINKS.GITHUB_REPOSITORY)}>
                <HUXStack className="items-center gap-2">
                  <Github size={20} color={currentTheme.accent} />
                  <Text className="text-foreground font-semibold">GitHub</Text>
                </HUXStack>
              </RippleButton>

              <RippleButton onPress={() => openBrowserAsync(EXTERNAL_LINKS.DISCORD_SERVER)}>
                <HUXStack className="items-center gap-2">
                  <DiscordIcon size={20} color={currentTheme.accent} />
                  <Text className="text-foreground font-semibold">Discord</Text>
                </HUXStack>
              </RippleButton>

              <RippleButton onPress={() => openBrowserAsync(EXTERNAL_LINKS.PROJECT_WEBSITE)}>
                <HUXStack className="items-center gap-2">
                  <Globe size={20} color={currentTheme.accent} />
                  <Text className="text-foreground font-semibold">Website</Text>
                </HUXStack>
              </RippleButton>

              {hasNewVersion && (
                <RippleButton onPress={() => openBrowserAsync(EXTERNAL_LINKS.GITHUB_LATEST_RELEASE)}>
                  <HUXStack className="items-center gap-2">
                    <ExternalLink size={20} />
                    <Text className="text-foreground font-semibold">Update</Text>
                  </HUXStack>
                </RippleButton>
              )}
            </HUXStack>
          </HUYStack>
        </HUYStack>
      </ScrollView>
    </ThemedView>
  );
};

export default About;
