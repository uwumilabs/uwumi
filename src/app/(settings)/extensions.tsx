import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { isCompatibleEntry, type ExtensionManifest, type ProviderType } from 'react-native-consumet';
import { installedExtensions, updateAvailable, useExtensionStore } from '@/hooks/stores/useExtensionStore';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { isTV } from '@/utils/tv';
import { Avatar, Card, Chip, useToast } from '@/components/heroui';
import { Button } from '@/components/Button';
import TVFocusWrapper from '@/components/TVFocusWrapper';
import { Image } from '@/components/Image';
import { BottomSheet } from '@/components/native/sheet/BottomSheet';
import { HUXStack, HUYStack, RippleButton } from '@/components/ui-primitives';
import { IoniconsIcon, type IoniconsIconProps } from '@/components/Icons';
import { Separator } from '@/components/native/separator/Separator';
import { HorizontalTabs } from '@/components/HorizontalTabs';
import { Switch } from '@/components/native/switch/Switch';

function ActionButton({
  testID,
  icon,
  label,
  isLoading,
  isDisabled,
  onPress,
}: {
  testID: string;
  icon: IoniconsIconProps['name'];
  label: string;
  isLoading: boolean;
  isDisabled?: boolean;
  onPress: () => void;
}) {
  const currentTheme = useCurrentTheme();
  return (
    <Button testID={testID} className="flex-1" onPress={onPress} isDisabled={isLoading || isDisabled}>
      <HUXStack className="items-center justify-center gap-2">
        {isLoading ? (
          <ActivityIndicator size="small" color={currentTheme?.default} />
        ) : (
          <IoniconsIcon name={icon} size={14} color={currentTheme?.default} />
        )}
        <Button.Label>{label}</Button.Label>
      </HUXStack>
    </Button>
  );
}

interface ExtensionCardProps {
  extension: ExtensionManifest;
  isInstalled: boolean;
  isLoading: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onUpdate: () => void;
  onShowDetails: () => void;
  hasUpdate: boolean;
  isCompatible: boolean;
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
  isCompatible,
}: ExtensionCardProps) {
  const currentTheme = useCurrentTheme();

  const getStatusIcon = () => {
    if (!isInstalled) {
      return <View className="h-2 w-2 rounded-full" style={{ backgroundColor: currentTheme?.muted }} />;
    }
    if (hasUpdate) return <IoniconsIcon name="alert-circle-outline" size={12} color={currentTheme?.warning} />;
    return <IoniconsIcon name="checkmark-circle-outline" size={12} color={currentTheme?.success} />;
  };

  return (
    <Card
      testID="extension-row"
      className="rounded-3xl p-4"
      style={{
        borderWidth: isInstalled ? 2 : 1,
        borderColor: !isInstalled ? currentTheme?.separator : hasUpdate ? currentTheme?.warning : currentTheme?.success,
      }}>
      <Card.Body>
        <HUYStack className="gap-3">
          <HUXStack className="justify-between items-start">
            <HUXStack className="gap-3 items-center flex-1">
              <Avatar size="md" variant="soft" color="default" alt={`${extension.name} logo`}>
                {!!extension.logo && (
                  <Avatar.Image source={{ uri: extension.logo }} asChild>
                    <Image style={{ width: '100%', height: '100%' }} contentFit="cover" />
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
                  {!isCompatible && (
                    <Chip size="sm" color="danger">
                      <Chip.Label>NEEDS APP UPDATE</Chip.Label>
                    </Chip>
                  )}
                </HUXStack>

                <HUXStack className="items-center gap-2 flex-wrap">
                  <Text className="text-xs font-semibold text-foreground/80">v{extension.version}</Text>

                  {!!extension.category && (
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

            <RippleButton
              testID="extension-row-details"
              onPress={onShowDetails}
              className="p-2"
              accessibilityLabel={`About ${extension.name}`}>
              <IoniconsIcon name="information-circle-outline" size={18} color={currentTheme?.accent} />
            </RippleButton>
          </HUXStack>

          <HUXStack className="gap-2 items-center justify-between flex-wrap">
            <HUXStack className="gap-2 flex-1">
              {hasUpdate && (
                <ActionButton
                  testID="extension-row-update"
                  icon="refresh-outline"
                  label="Update"
                  isLoading={isLoading}
                  onPress={onUpdate}
                />
              )}
              {isInstalled ? (
                <ActionButton
                  testID="extension-row-uninstall"
                  icon="trash-outline"
                  label="Uninstall"
                  isLoading={isLoading}
                  onPress={onUninstall}
                />
              ) : (
                <ActionButton
                  testID="extension-row-install"
                  icon="download-outline"
                  label="Install"
                  isLoading={isLoading}
                  isDisabled={!isCompatible}
                  onPress={onInstall}
                />
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
  extension: ExtensionManifest | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const theme = useCurrentTheme();
  if (!extension) return null;

  const sourceLabel = extension.baseUrl?.replace('https://', '').replace('http://', '') ?? '';
  const statusColor = extension.status === 'stable' ? 'success' : extension.status === 'beta' ? 'warning' : 'danger';

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      snapPoints={['80%']}
      scrollable>
      <View testID="extensions-details" className="p-4 gap-4">
        <HUXStack className="items-center gap-3">
          <Avatar size="lg" variant="soft" color="default" alt={`${extension.name} logo`}>
            {!!extension.logo && (
              <Avatar.Image source={{ uri: extension.logo }} asChild>
                <Image style={{ width: '100%', height: '100%' }} contentFit="cover" />
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
              <Chip.Label>{extension.status?.toUpperCase() || 'UNKNOWN'}</Chip.Label>
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
                  {extension.extractors.map((extractor) => (
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
    </BottomSheet>
  );
}

const CATEGORY_TABS: { key: ProviderType; label: string }[] = [
  { key: 'anime', label: 'Anime' },
  { key: 'movies', label: 'Movies' },
];

export default function Extensions() {
  const registry = useExtensionStore((state) => state.registry);
  const installed = useExtensionStore((state) => state.installed);
  const isLoading = useExtensionStore((state) => state.isLoading);
  const error = useExtensionStore((state) => state.error);
  const { updateRegistry, installExtension, uninstallExtension } = useExtensionStore.getState();
  const { toast } = useToast();
  const currentTheme = useCurrentTheme();

  const [installing, setInstalling] = useState<Record<string, boolean>>({});
  const [selectedExtension, setSelectedExtension] = useState<ExtensionManifest | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showInstalledOnly, setShowInstalledOnly] = useState(false);

  const install = async (extension: ExtensionManifest, verb: 'install' | 'update') => {
    setInstalling((prev) => ({ ...prev, [extension.id]: true }));
    if (!(await installExtension(extension.id))) {
      toast.show({ variant: 'danger', label: `Couldn't ${verb} ${extension.name}` });
    }
    setInstalling((prev) => ({ ...prev, [extension.id]: false }));
  };

  const showExtensionDetails = (extension: ExtensionManifest) => {
    setSelectedExtension(extension);
    setShowDetailsSheet(true);
  };

  const installedCount = installedExtensions({ registry, installed }).length;
  const filteredExtensions = showInstalledOnly ? installedExtensions({ registry, installed }) : registry.extensions;
  const updatesCount = registry.extensions.filter((ext) => updateAvailable(ext, installed)).length;

  // A refresh with a list on screen shows in the list's RefreshControl instead
  if (isLoading && filteredExtensions.length === 0) {
    return (
      <HUYStack testID="extensions-screen" className="flex-1 items-center justify-center gap-3">
        <ActivityIndicator testID="extensions-loading" size="large" />
        <Text className="text-foreground/70">Loading extensions...</Text>
      </HUYStack>
    );
  }

  // Not for an empty "Installed only" list: the switch to turn it off is in the header
  if (registry.extensions.length === 0) {
    return (
      <HUYStack testID="extensions-screen" className="flex-1 items-center justify-center gap-3 p-4">
        <IoniconsIcon name="extension-puzzle-outline" size={48} color={currentTheme.foreground} />
        <Text testID="extensions-empty" className="text-xl font-semibold text-foreground">
          No extensions found
        </Text>
        <Text className="text-foreground/70 text-center">
          {showInstalledOnly
            ? "You haven't installed any extensions yet"
            : 'Check your internet connection and try updating the registry'}
        </Text>
        <Button testID="extensions-refresh" onPress={updateRegistry} variant="primary">
          <HUXStack className="items-center gap-2">
            <IoniconsIcon name="refresh-outline" size={16} />
            <Text className="text-foreground font-semibold">Refresh</Text>
          </HUXStack>
        </Button>
      </HUYStack>
    );
  }

  return (
    <HUYStack testID="extensions-screen" className="flex-1">
      <HUXStack
        className="px-4 py-3 items-center justify-between border-b"
        style={{ borderColor: currentTheme.separator }}>
        <HUYStack>
          <Text className="text-foreground/70 text-xs">
            {installedCount} installed • {filteredExtensions.length} available
            {updatesCount > 0 && ` • ${updatesCount} update${updatesCount !== 1 ? 's' : ''}`}
          </Text>
        </HUYStack>

        {/* On TV the whole toggle is one focus target; on phones the switch takes the tap itself */}
        <TVFocusWrapper
          testID="extensions-installed-only"
          onPress={isTV ? () => setShowInstalledOnly(!showInstalledOnly) : undefined}
          focusScale={1}>
          <HUXStack className="items-center gap-2 px-2 py-1">
            <Switch
              testID="extensions-installed-only-switch"
              value={showInstalledOnly}
              onValueChange={isTV ? undefined : setShowInstalledOnly}
            />
            <Text className="text-foreground/70 text-xs">Installed only</Text>
          </HUXStack>
        </TVFocusWrapper>
      </HUXStack>

      {/* A failed refresh keeps the current registry, so the list stays usable */}
      {error && (
        <HUXStack testID="extensions-error" className="px-4 py-2 items-center gap-2">
          <IoniconsIcon name="alert-circle-outline" size={14} color={currentTheme.warning} />
          <Text className="flex-1 text-xs text-foreground/70">{error}</Text>
        </HUXStack>
      )}

      <HorizontalTabs
        items={CATEGORY_TABS.map(({ key, label }) => {
          const extensions = filteredExtensions.filter((extension) => extension.category === key);
          return {
            key,
            label,
            content: (
              <ScrollView
                testID="extensions-list"
                showsVerticalScrollIndicator={false}
                refreshControl={
                  isTV ? undefined : <RefreshControl refreshing={isLoading} onRefresh={updateRegistry} />
                }>
                <HUYStack className="gap-3 p-4 pb-8">
                  {extensions.length === 0 && (
                    <Text testID="extensions-tab-empty" className="text-foreground/70 text-center pt-8">
                      {showInstalledOnly
                        ? `No ${label.toLowerCase()} extensions installed`
                        : `No ${label.toLowerCase()} extensions available`}
                    </Text>
                  )}
                  {extensions.map((extension) => (
                    <ExtensionCard
                      key={extension.id}
                      extension={extension}
                      isInstalled={!!installed[extension.id]}
                      isLoading={!!installing[extension.id]}
                      hasUpdate={updateAvailable(extension, installed)}
                      isCompatible={isCompatibleEntry(extension)}
                      onInstall={() => install(extension, 'install')}
                      onUninstall={() => uninstallExtension(extension.id)}
                      onUpdate={() => install(extension, 'update')}
                      onShowDetails={() => showExtensionDetails(extension)}
                    />
                  ))}
                </HUYStack>
              </ScrollView>
            ),
          };
        })}
      />

      <ExtensionDetailsSheet
        extension={selectedExtension}
        isOpen={showDetailsSheet}
        onClose={() => setShowDetailsSheet(false)}
      />
    </HUYStack>
  );
}
