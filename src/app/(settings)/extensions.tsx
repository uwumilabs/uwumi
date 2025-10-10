import React, { useState, useEffect, useCallback } from 'react';
import { RefreshControl } from 'react-native';
import { useExtensionStore, useCurrentTheme } from '@/hooks';
import {
  Button,
  Text,
  XStack,
  YStack,
  Card,
  Avatar,
  Switch,
  ScrollView,
  Spinner,
  Sheet,
  H3,
  H4,
  Paragraph,
  Circle,
  styled,
} from 'tamagui';
import {
  Puzzle,
  Download,
  Trash2,
  RefreshCw,
  Info,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
} from '@tamagui/lucide-icons';

const Badge = styled(Text, {
  color: 'white',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$2',
  fontSize: '$2',
  fontWeight: '600',
});

interface ExtensionCardProps {
  extension: any;
  isInstalled: boolean;
  isLoading: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onUpdate: () => void;
  onShowDetails: () => void;
  hasUpdate: boolean;
}

function ExtensionCard({
  extension,
  isInstalled,
  isLoading,
  onInstall,
  onUninstall,
  onUpdate,
  onShowDetails,
  hasUpdate,
}: ExtensionCardProps) {
  const currentTheme = useCurrentTheme();

  const getStatusIcon = () => {
    if (!isInstalled) return <Circle size={8} backgroundColor="gray" />;
    if (hasUpdate) return <AlertCircle size={12} color="orange" />;
    return <CheckCircle size={12} color="$green9" />;
  };

  // Debug logging
  //console.log(`Extension ${extension.id}: installed=${isInstalled}, hasUpdate=${hasUpdate}`);

  return (
    <Card
      bordered
      elevate
      size="$4"
      padding="$4"
      borderRadius="$6"
      borderColor={!hasUpdate && isInstalled ? 'green' : hasUpdate && isInstalled ? 'orange' : '$borderColor'}
      borderWidth={isInstalled ? 2 : 1}
      pressStyle={{ scale: 0.98 }}
      animation="quick">
      <YStack gap="$3">
        {/* Header with logo and basic info */}
        <XStack justifyContent="space-between" alignItems="flex-start">
          <XStack gap="$3" alignItems="center" flex={1}>
            <Avatar circular size="$6">
              <Avatar.Image source={{ uri: extension.logo }} />
              <Avatar.Fallback backgroundColor="$background">
                <Puzzle size={20} color="white" />
              </Avatar.Fallback>
            </Avatar>

            <YStack flex={1} gap="$1">
              <XStack alignItems="center" gap="$2">
                <Text fontWeight="700" fontSize="$5">
                  {extension.name}
                </Text>
                {getStatusIcon()}
                {hasUpdate && (
                  <Badge backgroundColor="orange" color="white">
                    UPDATE
                  </Badge>
                )}
              </XStack>

              <XStack alignItems="center" gap="$2" flexWrap="wrap">
                <Text fontSize="$2.5" fontWeight={700}>
                  v{extension.version}
                </Text>
                {extension.category && (
                  <Badge backgroundColor={currentTheme?.color4}>{extension.category.toUpperCase()}</Badge>
                )}
                <XStack>
                  {extension.languages && (
                    <XStack alignItems="center" gap="$1">
                      <Globe size={12} />
                      <Text fontSize="$2.5" fontWeight={700}>
                        {extension.languages.slice(0, 2).join(', ')}
                        {extension.languages.length > 2 && ` +${extension.languages.length - 2}`}
                      </Text>
                    </XStack>
                  )}
                </XStack>
                {extension.nsfw && (
                  <Badge backgroundColor="red" color="white">
                    NSFW
                  </Badge>
                )}
              </XStack>
            </YStack>
          </XStack>

          <Button circular size="$3" chromeless onPress={onShowDetails} icon={<Info color="$color1" size={16} />} />
        </XStack>

        {/* Action buttons */}
        <XStack gap="$2" alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <XStack gap="$2">
            {hasUpdate && isInstalled && (
              <Button
                size="$3"
                flex={1}
                variant="outlined"
                onPress={onUpdate}
                disabled={isLoading}
                icon={isLoading ? <Spinner color="$color1" size="small" /> : <RefreshCw color="$color1" size={14} />}>
                Update
              </Button>
            )}

            {isInstalled ? (
              <Button
                size="$3"
                flex={1}
                variant="outlined"
                onPress={onUninstall}
                disabled={isLoading}
                icon={isLoading ? <Spinner color="$color1" size="small" /> : <Trash2 color="$color1" size={14} />}>
                Uninstall
              </Button>
            ) : (
              <Button
                size="$3"
                flex={1}
                variant="outlined"
                onPress={onInstall}
                disabled={isLoading}
                icon={isLoading ? <Spinner color="$color1" size="small" /> : <Download color="$color1" size={14} />}>
                Install
              </Button>
            )}
          </XStack>
        </XStack>
      </YStack>
    </Card>
  );
}

function ExtensionDetailsSheet({
  extension,
  isOpen,
  onClose,
}: {
  extension: any;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!extension) return null;

  return (
    <Sheet
      forceRemoveScrollEnabled={isOpen}
      modal
      open={isOpen}
      onOpenChange={onClose}
      dismissOnSnapToBottom
      zIndex={100000}
      snapPoints={[80]}
      snapPointsMode={'percent'}
      animation="quick">
      <Sheet.Overlay
        backgroundColor="transparent"
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />

      <Sheet.Frame padding="$4" justifyContent="flex-start">
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$4" paddingBottom="$8">
            {/* Header */}
            <XStack alignItems="center" gap="$3">
              <Avatar circular size="$8">
                <Avatar.Image source={{ uri: extension.logo }} />
                <Avatar.Fallback backgroundColor="$blue9">
                  <Puzzle size={24} color="white" />
                </Avatar.Fallback>
              </Avatar>

              <YStack flex={1}>
                <H3>{extension.name}</H3>
                <Text color="gray">Version {extension.version}</Text>
              </YStack>
            </XStack>

            {extension.description && (
              <YStack gap="$2">
                <H4>Description</H4>
                <Paragraph color="gray">{extension.description}</Paragraph>
              </YStack>
            )}

            {/* Details */}
            <YStack gap="$3">
              {extension.author && (
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="gray">Author</Text>
                  <Text fontWeight="600">{extension.author.name}</Text>
                </XStack>
              )}

              <XStack justifyContent="space-between" alignItems="center">
                <Text color="gray">Category</Text>
                <Text fontWeight="600"> {extension.category?.toUpperCase() || 'UNKNOWN'}</Text>
              </XStack>

              {extension.baseUrl && (
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="gray">Source</Text>
                  <Text fontWeight="600" numberOfLines={1} flex={1} textAlign="right">
                    {extension.baseUrl.replace('https://', '').replace('http://', '')}
                  </Text>
                </XStack>
              )}

              <XStack justifyContent="space-between" alignItems="center">
                <Text color="gray">Status</Text>
                <Badge
                  backgroundColor={
                    extension.status === 'stable' ? 'green' : extension.status === 'beta' ? 'orange' : 'red'
                  }
                  color="white">
                  {extension.status?.toUpperCase() || 'UNKNOWN'}
                </Badge>
              </XStack>

              {extension.lastUpdated && (
                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="gray">Last Updated</Text>
                  <Text fontWeight="600">{new Date(extension.lastUpdated).toLocaleDateString()}</Text>
                </XStack>
              )}
            </YStack>

            {/* Features */}
            {(extension.languages || extension.extractors || extension.subbed || extension.dubbed) && (
              <YStack gap="$3">
                {extension.languages && (
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text color="gray">Languages</Text>
                    <Text fontWeight="600">{extension.languages.join(', ')}</Text>
                  </XStack>
                )}

                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="gray">Content Types</Text>
                  <XStack gap="$1">
                    {extension.subbed && (
                      <Badge fontSize="$2.5" fontWeight="600" backgroundColor="$blue6" color="$blue12">
                        SUB
                      </Badge>
                    )}
                    {extension.dubbed && (
                      <Badge fontSize="$2.5" fontWeight="600" backgroundColor="$green6" color="$green12">
                        DUB
                      </Badge>
                    )}
                  </XStack>
                </XStack>

                {extension.extractors && (
                  <XStack justifyContent="space-between" alignItems="flex-start">
                    <Text color="gray">Extractors</Text>
                    <YStack alignItems="flex-end" gap="$1">
                      {extension.extractors.map((extractor: string) => (
                        <Badge
                          fontSize="$2.5"
                          fontWeight="600"
                          key={extractor}
                          backgroundColor="$purple6"
                          color="$purple12">
                          {extractor}
                        </Badge>
                      ))}
                    </YStack>
                  </XStack>
                )}

                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="gray">NSFW Content</Text>
                  <Badge backgroundColor={extension.nsfw ? 'red' : 'green'} color="white">
                    {extension.nsfw ? 'YES' : 'NO'}
                  </Badge>
                </XStack>
              </YStack>
            )}
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
}

export default function Extensions() {
  const {
    registry,
    updateRegistry,
    installExtension,
    uninstallExtension,
    updateExtension,
    isExtensionInstalled,
    checkForUpdates,
    isLoading,
    error,
  } = useExtensionStore();

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [availableUpdates, setAvailableUpdates] = useState<string[]>([]);
  const [selectedExtension, setSelectedExtension] = useState<any>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showInstalledOnly, setShowInstalledOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUpdates = useCallback(async () => {
    try {
      //console.log('🔍 Fetching updates...');
      const updates = await checkForUpdates();
      //console.log('Available updates:', updates);
      setAvailableUpdates(updates.extensions);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }, [checkForUpdates]);

  // Check for updates whenever registry changes
  useEffect(() => {
    if (registry) {
      //console.log('Registry updated, checking for updates...');
      fetchUpdates();
    }
  }, [registry, fetchUpdates]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await updateRegistry(
        'https://raw.githubusercontent.com/uwumilabs/react-native-consumet/refs/heads/main/src/extension-registry.json',
      );
      // await syncExtensions();
      await fetchUpdates();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
    setIsRefreshing(false);
  }, [fetchUpdates, updateRegistry]);

  const handleAction = async (action: () => Promise<boolean>, extensionId: string) => {
    setLoadingStates((prev) => ({ ...prev, [extensionId]: true }));
    try {
      const success = await action();
      //console.log(`Action ${action.name} for ${extensionId}: ${success ? 'success' : 'failed'}`);

      // Always refresh updates after any action
      await fetchUpdates();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [extensionId]: false }));
    }
  };

  const showExtensionDetails = (extension: any) => {
    setSelectedExtension(extension);
    setShowDetailsSheet(true);
  };

  const filteredExtensions =
    registry?.extensions.filter((ext) => (showInstalledOnly ? isExtensionInstalled(ext.id) : true)) || [];

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <Spinner size="large" />
        <Text color="gray">Loading extensions...</Text>
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3" padding="$4">
        <XCircle size={48} color="red" />
        <Text fontSize="$6" fontWeight="600" color="red">
          Something went wrong
        </Text>
        <Text color="gray" textAlign="center">
          {error}
        </Text>
        <Button onPress={onRefresh} icon={<RefreshCw size={16} />}>
          Try Again
        </Button>
      </YStack>
    );
  }
  const installedCount = filteredExtensions.filter((ext) => isExtensionInstalled(ext.id)).length;
  const updatesCount = availableUpdates.length;
  if (!registry || filteredExtensions.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3" padding="$4">
        <Puzzle size={48} color="gray" />
        <Text fontSize="$6" fontWeight="600" color="gray">
          No extensions found
        </Text>
        <Text color="gray" textAlign="center">
          {showInstalledOnly
            ? "You haven't installed any extensions yet"
            : 'Check your internet connection and try updating the registry'}
        </Text>
        <Button onPress={onRefresh} icon={<RefreshCw size={16} color="gray" />}>
          Refresh
        </Button>
      </YStack>
    );
  }

  // Debug logging for updates
  //console.log('Available updates array:', availableUpdates);
  //console.log('Updates count:', updatesCount);

  return (
    <YStack flex={1}>
      {/* Header Stats */}
      <XStack
        padding="$4"
        justifyContent="space-between"
        alignItems="center"
        borderBottomWidth={1}
        borderBottomColor="$borderColor">
        <YStack>
          <Text color="gray" fontSize="$3">
            {installedCount} installed • {filteredExtensions.length} available
            {updatesCount > 0 && ` • ${updatesCount} update${updatesCount !== 1 ? 's' : ''}`}
          </Text>
          {/* Debug info - remove in production */}
          <Text color="gray" fontSize="$3">
            Updates available for: {availableUpdates.join(', ') || 'none'}
          </Text>
        </YStack>

        <XStack alignItems="center" gap="$3">
          <XStack alignItems="center" gap="$2">
            <Switch
              borderWidth={2}
              borderColor={showInstalledOnly ? '$color' : '$color2'}
              size="$4"
              backgroundColor={showInstalledOnly ? '$color' : 'transparent'}
              checked={showInstalledOnly}
              onCheckedChange={setShowInstalledOnly}>
              <Switch.Thumb
                borderWidth={0}
                scale={0.7}
                backgroundColor={showInstalledOnly ? '$color4' : '$color2'}
                animation="quick"
              />
            </Switch>
            <Text color="gray" fontSize="$2">
              Installed only
            </Text>
          </XStack>
        </XStack>
      </XStack>

      {/* Extensions List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        <YStack gap="$3" padding="$4" paddingBottom="$8">
          {filteredExtensions.map((extension) => {
            const extensionIsInstalled = isExtensionInstalled(extension.id);
            const extensionHasUpdate = availableUpdates.includes(extension.id);

            // Debug each extension
            //console.log(`Rendering ${extension.id}:`, {
            //   installed: extensionIsInstalled,
            //   hasUpdate: extensionHasUpdate,
            //   version: extension.version,
            // });

            return (
              <ExtensionCard
                key={extension.id}
                extension={extension}
                isInstalled={extensionIsInstalled}
                isLoading={loadingStates[extension.id] || false}
                hasUpdate={extensionHasUpdate}
                onInstall={() => handleAction(() => installExtension(extension.id), extension.id)}
                onUninstall={() => handleAction(() => uninstallExtension(extension.id), extension.id)}
                onUpdate={() => handleAction(() => updateExtension(extension.id), extension.id)}
                onShowDetails={() => showExtensionDetails(extension)}
              />
            );
          })}
        </YStack>
      </ScrollView>

      {/* Extension Details Sheet */}
      <ExtensionDetailsSheet
        extension={selectedExtension}
        isOpen={showDetailsSheet}
        onClose={() => setShowDetailsSheet(false)}
      />
    </YStack>
  );
}
