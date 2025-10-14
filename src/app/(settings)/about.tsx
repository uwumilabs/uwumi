import React, { useEffect } from 'react';
import { ThemedView } from '@/components/ui-primitives';
import { Text, YStack, XStack, Separator, Card, Theme, Spinner } from 'tamagui';
import { Github, ExternalLink, CheckCircle2, AlertCircle, Globe, RefreshCw } from '@tamagui/lucide-icons';
import { CustomImage, RippleButton } from '@/components';
import { useUpdateChecker } from '@/hooks/useUpdateChecker';
import { openBrowserAsync } from 'expo-web-browser';
import { EXTERNAL_LINKS } from '@/constants/config';
import { useCurrentTheme } from '@/hooks';
import { toast } from 'sonner-native';
import { DiscordIcon } from '@/svg';

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
      <YStack padding="$4" gap="$6">
        <YStack alignItems="center" gap="$2">
          <CustomImage
            source={require('../../../assets/images/icon.png')}
            alt="Logo"
            style={{ width: 100, height: 100, borderRadius: 20 }}
          />
        </YStack>

        <Separator />
        {process.env.NODE_ENV && (
          <Card
            elevation="$1"
            padding="$2"
            borderRadius="$4"
            backgroundColor="$background"
            marginVertical="$2"
            width="$25"
            alignSelf="center">
            <XStack gap="$2" alignItems="center" justifyContent="center">
              <AlertCircle size={16} />
              <Text fontSize="$3" fontWeight="500">
                Environment:{' '}
                <Text fontWeight="600" textTransform="capitalize">
                  {process.env.NODE_ENV}
                </Text>
              </Text>
            </XStack>
          </Card>
        )}

        <Card elevation="$2" padding="$4" borderRadius="$4">
          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <CheckCircle2 size={18} color="$color" />
              <Text fontSize="$5" fontWeight="600">
                Version Information
              </Text>
            </XStack>

            <YStack gap="$1" paddingLeft="$2">
              <Text color="$color1" fontSize="$3">
                Current Version
              </Text>
              {isLoading ? (
                <XStack gap="$2" alignItems="center">
                  <Spinner size="small" />
                  <Text fontSize="$4" fontWeight="500">
                    Checking for updates...
                  </Text>
                </XStack>
              ) : isError ? (
                <Text fontSize="$4" fontWeight="500" color="red">
                  {updateInfo.currentVersion} (Unable to check for updates)
                </Text>
              ) : (
                <Text fontSize="$4" fontWeight="500">
                  {updateInfo.createdAt
                    ? `${updateInfo.currentVersion} (${new Date(updateInfo.createdAt).toLocaleDateString()})`
                    : updateInfo.currentVersion}
                </Text>
              )}
            </YStack>

            {hasNewVersion && (
              <Theme>
                <Card backgroundColor="$background" borderRadius="$3" padding="$3" marginTop="$2">
                  <YStack gap="$1">
                    <XStack gap="$2" alignItems="center">
                      <AlertCircle size={16} color="$color" />
                      <Text fontSize="$3" fontWeight="600" color="$color">
                        Update Available
                      </Text>
                    </XStack>
                    <Text fontSize="$4" fontWeight="500">
                      {`Version ${updateInfo.newVersion}`}
                    </Text>
                  </YStack>
                </Card>
              </Theme>
            )}
          </YStack>
        </Card>

        <YStack gap="$4" alignItems="center" marginTop="$2">
          <RippleButton onPress={() => checkForUpdates()}>
            <XStack gap="$2" alignItems="center">
              <RefreshCw size={20} color={currentTheme.color} />
              <Text fontWeight="600">Check for Updates</Text>
            </XStack>
          </RippleButton>
          <XStack gap="$4" justifyContent="center" flexWrap="wrap" alignItems="center">
            <Theme>
              <RippleButton onPress={() => openBrowserAsync(EXTERNAL_LINKS.GITHUB_REPOSITORY)}>
                <XStack gap="$2" alignItems="center">
                  <Github size={20} />
                  <Text fontWeight="600">GitHub</Text>
                </XStack>
              </RippleButton>

              <RippleButton onPress={() => openBrowserAsync(EXTERNAL_LINKS.DISCORD_SERVER)}>
                <XStack gap="$2" alignItems="center">
                  <DiscordIcon size={20} color={currentTheme.color} />
                  <Text fontWeight="600">Discord</Text>
                </XStack>
              </RippleButton>

              <RippleButton onPress={() => openBrowserAsync(EXTERNAL_LINKS.PROJECT_WEBSITE)}>
                <XStack gap="$2" alignItems="center">
                  <Globe size={20} color={currentTheme.color} />
                  <Text fontWeight="600">Website</Text>
                </XStack>
              </RippleButton>

              {hasNewVersion && (
                <RippleButton onPress={() => openBrowserAsync(EXTERNAL_LINKS.GITHUB_LATEST_RELEASE)}>
                  <XStack gap="$2" alignItems="center">
                    <ExternalLink size={20} />
                    <Text fontWeight="600">Update</Text>
                  </XStack>
                </RippleButton>
              )}
            </Theme>
          </XStack>
        </YStack>
      </YStack>
    </ThemedView>
  );
};

export default About;
