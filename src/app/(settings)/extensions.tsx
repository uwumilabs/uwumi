import { useMemo, useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useExtensionStore, useCurrentTheme } from '@/hooks';
import { isTV } from '@/constants/utils';
import { Avatar, Button, Card, Chip, Separator, Switch } from 'heroui-native';
import { CustomImage, CustomSheet, HUXStack, HUYStack, RippleButton, IoniconsIcon } from '@/components';

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
    if (!isInstalled) {
      return <View className="h-2 w-2 rounded-full" style={{ backgroundColor: currentTheme?.muted }} />;
    }
    if (hasUpdate) return <IoniconsIcon name="alert-circle-outline" size={12} color={currentTheme?.warning} />;
    return <IoniconsIcon name="checkmark-circle-outline" size={12} color={currentTheme?.success} />;
  };

  // Debug logging
  //console.log(`Extension ${extension.id}: installed=${isInstalled}, hasUpdate=${hasUpdate}`);

  return (
    <Card
      className="rounded-3xl p-4"
      style={{
        borderWidth: isInstalled ? 2 : 1,
        borderColor: !isInstalled ? currentTheme?.separator : hasUpdate ? currentTheme?.warning : currentTheme?.success,
      }}>
      <Card.Body>
        <HUYStack className="gap-3">
          {/* Header with logo and basic info */}
          <HUXStack className="justify-between items-start">
            <HUXStack className="gap-3 items-center flex-1">
              <Avatar size="md" variant="soft" color="default" alt={`${extension?.name ?? 'Extension'} logo`}>
                {!!extension.logo && (
                  <Avatar.Image source={{ uri: extension.logo }} asChild>
                    <CustomImage style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </Avatar.Image>
                )}
                <Avatar.Fallback>
                  <IoniconsIcon name="extension-puzzle-outline" size={20} color={currentTheme?.foreground} />
                </Avatar.Fallback>
              </Avatar>

              <HUYStack className="flex-1 gap-1">
                <HUXStack className="items-center gap-2 flex-wrap">
                  <Text className="text-lg font-bold text-foreground">{extension.name}</Text>
                  {getStatusIcon()}
                  {hasUpdate && (
                    <Chip size="sm" color="warning">
                      <Chip.Label>UPDATE</Chip.Label>
                    </Chip>
                  )}
                </HUXStack>

                <HUXStack className="items-center gap-2 flex-wrap">
                  <Text className="text-xs font-semibold text-foreground/80">v{extension.version}</Text>

                  {extension.category && (
                    <Chip size="sm" color="default">
                      <Chip.Label>{extension.category.toUpperCase()}</Chip.Label>
                    </Chip>
                  )}

                  {!!extension.languages?.length && (
                    <HUXStack className="items-center gap-1">
                      <IoniconsIcon name="globe-outline" size={12} color={currentTheme?.foreground} />
                      <Text className="text-xs font-semibold text-foreground/80">
                        {extension.languages.slice(0, 2).join(', ')}
                        {extension.languages.length > 2 && ` +${extension.languages.length - 2}`}
                      </Text>
                    </HUXStack>
                  )}

                  {extension.nsfw && (
                    <Chip size="sm" color="danger">
                      <Chip.Label>NSFW</Chip.Label>
                    </Chip>
                  )}
                </HUXStack>
              </HUYStack>
            </HUXStack>

            <RippleButton onPress={onShowDetails} className="p-2">
              <IoniconsIcon name="information-circle-outline" size={18} color={currentTheme?.accent} />
            </RippleButton>
          </HUXStack>

          {/* Action buttons */}
          <HUXStack className="gap-2 items-center justify-between flex-wrap">
            <HUXStack className="gap-2 flex-1">
              {hasUpdate && isInstalled && (
                <Button className="flex-1" onPress={onUpdate} isDisabled={isLoading}>
                  <HUXStack className="items-center justify-center gap-2">
                    {isLoading ? (
                      <ActivityIndicator size="small" color={currentTheme?.default} />
                    ) : (
                      <IoniconsIcon name="refresh-outline" size={14} color={currentTheme?.default} />
                    )}
                    <Button.Label>Update</Button.Label>
                  </HUXStack>
                </Button>
              )}

              {isInstalled ? (
                <Button className="flex-1" onPress={onUninstall} isDisabled={isLoading}>
                  <HUXStack className="items-center justify-center gap-2">
                    {isLoading ? (
                      <ActivityIndicator size="small" color={currentTheme?.default} />
                    ) : (
                      <IoniconsIcon name="trash-outline" size={14} color={currentTheme?.default} />
                    )}
                    <Button.Label>Uninstall</Button.Label>
                  </HUXStack>
                </Button>
              ) : (
                <Button className="flex-1" onPress={onInstall} isDisabled={isLoading}>
                  <HUXStack className="items-center justify-center gap-2">
                    {isLoading ? (
                      <ActivityIndicator size="small" color={currentTheme?.default} />
                    ) : (
                      <IoniconsIcon name="download-outline" size={14} color={currentTheme?.default} />
                    )}
                    <Button.Label>Install</Button.Label>
                  </HUXStack>
                </Button>
              )}
            </HUXStack>
          </HUXStack>
        </HUYStack>
      </Card.Body>
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
  const theme = useCurrentTheme();
  const sourceLabel = useMemo(() => {
    if (!extension?.baseUrl) return '';
    return extension.baseUrl.replace('https://', '').replace('http://', '');
  }, [extension.baseUrl]);

  const statusColor: 'success' | 'warning' | 'danger' | 'default' =
    extension?.status === 'stable' ? 'success' : extension?.status === 'beta' ? 'warning' : 'danger';

  if (!extension) return null;

  return (
    <CustomSheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      snapPoints={['80%']}
      scrollable>
      <View className="p-4 gap-4">
        {/* Header */}
        <HUXStack className="items-center gap-3">
          <Avatar size="lg" variant="soft" color="default" alt={`${extension?.name ?? 'Extension'} logo`}>
            {!!extension.logo && (
              <Avatar.Image source={{ uri: extension.logo }} asChild>
                <CustomImage style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </Avatar.Image>
            )}
            <Avatar.Fallback>
              <IoniconsIcon name="extension-puzzle-outline" size={24} color={theme?.foreground} />
            </Avatar.Fallback>
          </Avatar>

          <HUYStack className="flex-1">
            <Text className="text-xl font-bold text-foreground">{extension.name}</Text>
            <Text className="text-sm text-foreground/70">Version {extension.version}</Text>
          </HUYStack>
        </HUXStack>

        <Separator />

        {!!extension.description && (
          <HUYStack className="gap-2">
            <Text className="text-base font-semibold text-foreground">Description</Text>
            <Text className="text-sm text-foreground/80">{extension.description}</Text>
          </HUYStack>
        )}

        {/* Details */}
        <HUYStack className="gap-3">
          {!!extension.author?.name && (
            <HUXStack className="justify-between items-center">
              <Text className="text-sm text-foreground/70">Author</Text>
              <Text className="text-sm font-semibold text-foreground">{extension.author.name}</Text>
            </HUXStack>
          )}

          <HUXStack className="justify-between items-center">
            <Text className="text-sm text-foreground/70">Category</Text>
            <Text className="text-sm font-semibold text-foreground">
              {extension.category?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </HUXStack>

          {!!sourceLabel && (
            <HUXStack className="justify-between items-center">
              <Text className="text-sm text-foreground/70">Source</Text>
              <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                {sourceLabel}
              </Text>
            </HUXStack>
          )}

          <HUXStack className="justify-between items-center">
            <Text className="text-sm text-foreground/70">Status</Text>
            <Chip size="sm" variant="secondary" color={statusColor}>
              <Chip.Label>{(extension.status?.toUpperCase() || 'UNKNOWN') as string}</Chip.Label>
            </Chip>
          </HUXStack>

          {!!extension.lastUpdated && (
            <HUXStack className="justify-between items-center">
              <Text className="text-sm text-foreground/70">Last Updated</Text>
              <Text className="text-sm font-semibold text-foreground">
                {new Date(extension.lastUpdated).toLocaleDateString()}
              </Text>
            </HUXStack>
          )}
        </HUYStack>

        {/* Features */}
        {(extension.languages || extension.extractors || extension.subbed || extension.dubbed) && (
          <HUYStack className="gap-3">
            {!!extension.languages?.length && (
              <HUXStack className="justify-between items-center">
                <Text className="text-sm text-foreground/70">Languages</Text>
                <Text className="text-sm font-semibold text-foreground">{extension.languages.join(', ')}</Text>
              </HUXStack>
            )}

            <HUXStack className="justify-between items-center">
              <Text className="text-sm text-foreground/70">Content Types</Text>
              <HUXStack className="gap-2">
                {extension.subbed && (
                  <Chip size="sm" variant="primary">
                    <Chip.Label>SUB</Chip.Label>
                  </Chip>
                )}
                {extension.dubbed && (
                  <Chip size="sm" variant="primary">
                    <Chip.Label>DUB</Chip.Label>
                  </Chip>
                )}
              </HUXStack>
            </HUXStack>

            {!!extension.extractors?.length && (
              <HUXStack className="justify-between items-start">
                <Text className="text-sm text-foreground/70">Extractors</Text>
                <HUYStack className="items-end gap-2">
                  {extension.extractors.map((extractor: string) => (
                    <Chip key={extractor} size="sm" variant="secondary" color="default">
                      <Chip.Label>{extractor}</Chip.Label>
                    </Chip>
                  ))}
                </HUYStack>
              </HUXStack>
            )}

            <HUXStack className="justify-between items-center">
              <Text className="text-sm text-foreground/70">NSFW Content</Text>
              <Chip size="sm" variant="secondary" color={extension.nsfw ? 'danger' : 'success'}>
                <Chip.Label>{extension.nsfw ? 'YES' : 'NO'}</Chip.Label>
              </Chip>
            </HUXStack>
          </HUYStack>
        )}
      </View>
    </CustomSheet>
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

  const currentTheme = useCurrentTheme();

  if (isLoading) {
    return (
      <>
        <HUYStack className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" />
          <Text className="text-foreground/70">Loading extensions...</Text>
        </HUYStack>
      </>
    );
  }

  if (error) {
    return (
      <>
        <HUYStack className="flex-1 items-center justify-center gap-3 p-4">
          <IoniconsIcon name="close-circle-outline" size={48} color={currentTheme.danger} />
          <Text className="text-xl font-semibold text-foreground">Something went wrong</Text>
          <Text className="text-foreground/70 text-center">{error}</Text>
          <Button onPress={onRefresh} variant="primary">
            <HUXStack className="items-center gap-2">
              <IoniconsIcon name="refresh-outline" size={16} />
              <Text className="text-foreground font-semibold">Try Again</Text>
            </HUXStack>
          </Button>
        </HUYStack>
      </>
    );
  }
  const installedCount = filteredExtensions.filter((ext) => isExtensionInstalled(ext.id)).length;
  const updatesCount = availableUpdates.length;
  if (!registry || filteredExtensions.length === 0) {
    return (
      <>
        <HUYStack className="flex-1 items-center justify-center gap-3 p-4">
          <IoniconsIcon name="extension-puzzle-outline" size={48} color={currentTheme.foreground} />
          <Text className="text-xl font-semibold text-foreground">No extensions found</Text>
          <Text className="text-foreground/70 text-center">
            {showInstalledOnly
              ? "You haven't installed any extensions yet"
              : 'Check your internet connection and try updating the registry'}
          </Text>
          <Button onPress={onRefresh} variant="primary">
            <HUXStack className="items-center gap-2">
              <IoniconsIcon name="refresh-outline" size={16} />
              <Text className="text-foreground font-semibold">Refresh</Text>
            </HUXStack>
          </Button>
        </HUYStack>
      </>
    );
  }

  // Debug logging for updates
  //console.log('Available updates array:', availableUpdates);
  //console.log('Updates count:', updatesCount);

  return (
    <>
      <HUYStack className="flex-1">
        {/* Header Stats */}
        <HUXStack
          className="px-4 py-3 items-center justify-between border-b"
          style={{ borderColor: currentTheme.separator }}>
          <HUYStack>
            <Text className="text-foreground/70 text-xs">
              {installedCount} installed • {filteredExtensions.length} available
              {updatesCount > 0 && ` • ${updatesCount} update${updatesCount !== 1 ? 's' : ''}`}
            </Text>
            {/* Debug info - remove in production */}
            <Text className="text-foreground/70 text-xs">
              Updates available for: {availableUpdates.join(', ') || 'none'}
            </Text>
          </HUYStack>

          <HUXStack className="items-center gap-2">
            <Switch isSelected={showInstalledOnly} onSelectedChange={setShowInstalledOnly} />
            <Text className="text-foreground/70 text-xs">Installed only</Text>
          </HUXStack>
        </HUXStack>

        {/* Extensions List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={isTV ? undefined : <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
          <HUYStack className="gap-3 p-4 pb-8">
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
          </HUYStack>
        </ScrollView>

        {/* Extension Details Sheet */}
        <ExtensionDetailsSheet
          extension={selectedExtension}
          isOpen={showDetailsSheet}
          onClose={() => setShowDetailsSheet(false)}
        />
      </HUYStack>
    </>
  );
}
