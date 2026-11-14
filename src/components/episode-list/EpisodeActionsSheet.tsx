import React, { memo, useCallback, useMemo, useState } from 'react';
import { Separator } from '@/components/native/separator/Separator';
import { ActivityIndicator, Linking, Platform, ScrollView, Text, View } from 'react-native';
import type { IEpisodeServer } from 'react-native-consumet';
import { resumeAt, useWatchProgressStore } from '@/hooks/stores/useWatchProgressStore';
import { episodeTarget, useEpisodeServers, useEpisodeSources } from '@/hooks/queries/watchQueries';
import { useLastServerStore, lastServerKey } from '@/hooks/stores/useLastServerStore';
import { useDownloadStore, useDownloadedFileUri } from '@/downloads/useDownloadStore';
import {
  episodeNumber,
  episodeSeason,
  episodeTitle,
  notOnProvider,
  type EpisodeContext,
  type EpisodeItem,
} from '@/utils/episodes';
import { useMediaInfo, useShownTitle } from '@/hooks/queries/infoQueries';
import { isTV } from '@/utils/tv';
import { openVideoInOtherApp, shareMedia } from '@/utils/share';
import { useProviderName, useProviderSelectionStore } from '@/hooks/stores/useProviderStore';
import * as IntentLauncher from 'expo-intent-launcher';
import { HUXStack, HUYStack, RippleButton } from '../ui-primitives';
import { BottomSheet } from '../native/BottomSheet';
import { IoniconsIcon } from '../Icons';
import { useToast } from '../heroui';

interface EpisodeActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episode: EpisodeItem | null;
  /** The show the episode is from, on the provider the list is from */
  context: EpisodeContext;
}

interface SheetButtonProps {
  testID: string;
  onPress: () => void;
  icon?: React.ReactNode;
  label: string;
  rightIcon?: React.ReactNode;
  hasTVPreferredFocus?: boolean;
}

const StyledSheetButton: React.FC<SheetButtonProps> = memo(
  ({ testID, onPress, icon, label, rightIcon, hasTVPreferredFocus }) => {
    return (
      <HUXStack className="items-center justify-between gap-3">
        <RippleButton
          testID={testID}
          className="flex-1 p-3.5 rounded-lg bg-default"
          onPress={onPress}
          hasTVPreferredFocus={hasTVPreferredFocus}
          focusScale={1}>
          <HUXStack className="items-center gap-3">
            {icon ? icon : null}
            <Text className="text-base font-medium text-accent flex-1">{label}</Text>
            {rightIcon ? rightIcon : null}
          </HUXStack>
        </RippleButton>
      </HUXStack>
    );
  },
);

StyledSheetButton.displayName = 'StyledSheetButton';

const NO_SERVERS: IEpisodeServer[] = [];

// On TV the sheet's own scroll view follows focus; a second one nested inside would hide focused rows below its fold

const SheetList = ({ children }: { children: React.ReactNode }) =>
  isTV ? <View>{children}</View> : <ScrollView style={{ maxHeight: 400 }}>{children}</ScrollView>;

const ListState = ({
  loading,
  title,
  subtitle,
  severity = 'default',
}: {
  loading?: boolean;
  title: string;
  subtitle?: string;
  severity?: 'default' | 'error';
}) => {
  const titleClassName =
    severity === 'error' ? 'text-xl font-semibold text-danger text-center' : 'text-lg text-foreground text-center';

  const subtitleClassName =
    severity === 'error'
      ? 'text-sm text-foreground text-center opacity-90'
      : 'text-sm text-foreground text-center opacity-80';

  return (
    <HUYStack className="items-center justify-center p-4 gap-2">
      {loading ? <ActivityIndicator size="large" /> : null}
      <Text className={titleClassName}>{title}</Text>
      {subtitle ? <Text className={subtitleClassName}>{subtitle}</Text> : null}
    </HUYStack>
  );
};

const EpisodeActionsSheet: React.FC<EpisodeActionsSheetProps> = memo(({ open, onOpenChange, episode, context }) => {
  const { mediaType, provider, type } = context;
  const episodeProgress = useWatchProgressStore((state) =>
    episode?.uniqueId ? state.progresses[episode.uniqueId] : undefined,
  );
  const providerName = useProviderName(mediaType, provider);
  const rememberedServer = useLastServerStore((state) => state.servers[lastServerKey(mediaType, provider)]);
  const download = useDownloadStore((state) => state.download);
  const removeDownload = useDownloadStore((state) => state.removeDownload);
  const downloadedUri = useDownloadedFileUri(episode?.uniqueId);
  const { data: mediaInfo } = useMediaInfo();
  const { title: showTitle } = useShownTitle();
  const dub = useProviderSelectionStore((state) => state.dub);
  const { toast } = useToast();

  const [shouldFetchSources, setShouldFetchSources] = useState(false);
  const [selectedServer, setSelectedServer] = useState<IEpisodeServer | null>(null);
  const [actionMode, setActionMode] = useState<'external-player' | 'download'>('external-player');

  // The same servers and sources as the player, fetched once an action needs them
  const target = useMemo(
    () => episodeTarget({ mediaType, provider, episodeId: episode?.id ?? '', mediaId: context.mediaId, dub }),
    [mediaType, provider, episode?.id, context.mediaId, dub],
  );
  const serversQuery = useEpisodeServers(target, shouldFetchSources);
  const servers = serversQuery.data ?? NO_SERVERS;
  const server = selectedServer ?? servers.find(({ name }) => name === rememberedServer) ?? servers[0];
  const sourcesQuery = useEpisodeSources(target, shouldFetchSources ? server : undefined, 'sheet');
  const data = sourcesQuery.data;
  // Reset the menu when the sheet closes. Done while rendering rather than in an effect, so the closed sheet
  // never paints a frame of the old menu state.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setSelectedServer(null);
      setShouldFetchSources(false);
      setActionMode('external-player');
    }
  }

  // Which menu the sheet shows. Sources are fetched once an action is picked; the server list comes first (and
  // covers loading and errors) unless there's a single server or one was chosen.
  const step: 'menu' | 'servers' | 'quality' = !shouldFetchSources
    ? 'menu'
    : selectedServer || servers.length === 1
      ? 'quality'
      : 'servers';
  const showServerSelection = step === 'servers';
  const showQualitySelection = step === 'quality';

  const handleMarkComplete = useCallback(() => {
    if (!episode?.uniqueId) return;
    const watched = useWatchProgressStore.getState().toggleWatched(episode.uniqueId);
    toast.show({ variant: 'success', label: watched ? 'Marked as complete' : 'Marked as incomplete' });
    onOpenChange(false);
  }, [episode, onOpenChange, toast]);

  const handleShowQualityOptions = (mode: 'external-player' | 'download') => {
    setActionMode(mode);
    setShouldFetchSources(true);
  };

  // The server is part of the sources query key, so this fetches that server's sources

  const handleOpenWithQuality = useCallback(
    async (videoUrl: string) => {
      const subtitles = data?.subtitles ?? [];
      const hasSubtitles = subtitles.length > 0;
      const extras: Record<string, any> = {
        title: episode ? episodeTitle(episode) : 'Episode',
        position: episode?.uniqueId ? Math.floor(resumeAt(episode.uniqueId) * 1000) : 0,
        return_result: true,
        filename: episode?.title?.toLowerCase().replace(/\s/g, ' ') || episodeTitle,
      };

      if (hasSubtitles) {
        const subtitleUrls = subtitles.map((sub) => sub.uri);
        const subtitleNames = subtitles.map((sub) => sub.language || 'Unknown');

        if (subtitleUrls.length > 0) {
          extras['subs'] = subtitleUrls;
          extras['subs.enable'] = subtitleUrls;
          extras['subs.name'] = subtitleNames;
          extras['subs.filename'] = subtitleUrls;
          extras['subtitle'] = subtitleUrls[0];
          extras['subtitles_location'] = subtitleUrls[0];
        }
      }

      const uniqueId = episode?.uniqueId;

      let result: IntentLauncher.IntentLauncherResult | null = null;
      try {
        if (Platform.OS === 'android') {
          result = await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: videoUrl,
            type: 'video/*',
            flags: 1,
            extra: extras,
          });
        } else if (Platform.OS === 'ios') {
          await Linking.openURL(videoUrl);
        }
      } catch (e) {
        console.error('❌ Error opening external player:', e);
        const message = String((e as Error).message || 'Unknown error');
        toast.show({ variant: 'danger', label: 'Failed to open external player', description: message });
        return;
      }

      // VLC and MX Player report where playback stopped, in ms
      const played = result?.extra as
        | { extra_position?: number; position?: number; extra_duration?: number; duration?: number }
        | undefined;
      const position = played?.extra_position ?? played?.position;
      const duration = played?.extra_duration ?? played?.duration;
      if (position && duration && uniqueId) {
        useWatchProgressStore.getState().savePlayback(uniqueId, position / 1000, duration / 1000);
      }
      onOpenChange(false);
    },
    [onOpenChange, data, episode, toast],
  );

  const openDownload = async () => {
    if (!downloadedUri) return;
    onOpenChange(false);
    try {
      await openVideoInOtherApp(downloadedUri, episode?.title);
    } catch (e) {
      toast.show({
        variant: 'danger',
        label: "Couldn't open the download",
        description: String((e as Error).message),
      });
    }
  };

  const deleteDownload = async () => {
    if (!episode?.uniqueId) return;
    onOpenChange(false);
    await removeDownload(episode.uniqueId);
    toast.show({ variant: 'success', label: 'Download deleted' });
  };

  const handleDownloadWithQuality = useCallback(
    async (videoUrl: string) => {
      if (!episode) return;
      const number = episodeNumber(episode) ?? 1;
      const episodeName = episodeTitle(episode, number);
      const description = showTitle ? `${showTitle} - ${episodeName}` : episodeName;
      const season = episodeSeason(episode) ?? (mediaInfo as { season?: number } | undefined)?.season;

      // Probing the stream can take half a minute, so close the sheet and say so instead of sitting on it
      onOpenChange(false);
      toast.show({ label: 'Getting the download ready', description });
      const started = await download({
        episode,
        context,
        showName: showTitle,
        season: season !== undefined ? Number(season) : undefined,
        url: videoUrl,
        source: data,
      });
      if (started?.status === 'failed') {
        toast.show({ variant: 'danger', label: "Couldn't start the download", description: started.error });
      } else if (started?.status === 'downloading') {
        toast.show({ variant: 'success', label: 'Download started', description });
      }
    },
    [episode, data, mediaInfo, showTitle, context, download, onOpenChange, toast],
  );

  // From a chosen server's qualities back to the server list, otherwise back to the main menu
  const handleBackToMainMenu = useCallback(() => {
    if (!selectedServer) setShouldFetchSources(false);
    setSelectedServer(null);
  }, [selectedServer]);

  const progress = episodeProgress ?? null;
  const isCompleted = progress?.isCompleted ?? false;

  const videoSources = data?.sources ?? [];

  const headerTitle = useMemo(() => {
    if (showServerSelection) return 'Select Server';
    if (showQualitySelection) {
      return server ? `Select Quality - ${server.name}` : 'Select Quality';
    }
    return episode?.title;
  }, [episode?.title, server, showQualitySelection, showServerSelection]);

  const snapPoints = useMemo(
    () => (showQualitySelection || showServerSelection ? ['70%'] : ['40%']),
    [showQualitySelection, showServerSelection],
  );

  const shouldShowBack = showQualitySelection || showServerSelection;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} snapPoints={snapPoints}>
      {episode ? (
        <HUYStack className="gap-2 px-4">
          <HUXStack className="justify-between items-center mb-2">
            <Text className="text-lg font-bold text-accent w-4/5" numberOfLines={1}>
              {headerTitle}
            </Text>
            <RippleButton
              testID={shouldShowBack ? 'episode-actions-back' : 'episode-actions-close'}
              accessibilityLabel={shouldShowBack ? 'Back' : 'Close'}
              onPress={() => (shouldShowBack ? handleBackToMainMenu() : onOpenChange(false))}>
              {shouldShowBack ? (
                <IoniconsIcon name="chevron-back" size={24} className="text-foreground" />
              ) : (
                <IoniconsIcon name="close" size={24} className="text-foreground" />
              )}
            </RippleButton>
          </HUXStack>

          <Separator />

          {!showQualitySelection && !showServerSelection && (
            <HUYStack className="gap-1 mt-2">
              <StyledSheetButton
                testID="episode-action-toggle-watched"
                hasTVPreferredFocus
                onPress={handleMarkComplete}
                icon={<IoniconsIcon name="checkmark" size={20} />}
                label={isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
              />

              <StyledSheetButton
                testID="episode-action-external-player"
                onPress={downloadedUri ? openDownload : () => handleShowQualityOptions('external-player')}
                icon={<IoniconsIcon name="play" size={20} />}
                label={downloadedUri ? 'Open download in another app' : 'Open in External Player'}
              />
              <StyledSheetButton
                testID="episode-action-download"
                onPress={downloadedUri ? deleteDownload : () => handleShowQualityOptions('download')}
                icon={<IoniconsIcon name={downloadedUri ? 'trash-outline' : 'download-outline'} size={20} />}
                label={downloadedUri ? 'Delete download' : 'Download'}
              />
              <StyledSheetButton
                testID="episode-action-share"
                onPress={() => {
                  onOpenChange(false);
                  shareMedia({
                    mediaType,
                    id: context.id,
                    type,
                    title: showTitle,
                    episode: episodeNumber(episode),
                    season: episodeSeason(episode),
                  });
                }}
                icon={<IoniconsIcon name="share-social-outline" size={20} />}
                label="Share episode"
              />
            </HUYStack>
          )}

          {showServerSelection && (
            <SheetList>
              <HUYStack className="gap-1 mt-2">
                {!episode.id ? (
                  <ListState
                    title={notOnProvider(providerName).title}
                    subtitle={notOnProvider(providerName).detail}
                    severity="error"
                  />
                ) : serversQuery.isLoading ? (
                  <ListState loading title="Loading servers..." />
                ) : serversQuery.error ? (
                  <ListState title="Failed to load servers" subtitle="Please try again" severity="error" />
                ) : servers.length === 0 ? (
                  <ListState title="No servers available" subtitle="Please try again later" severity="error" />
                ) : (
                  servers.map((option, index) => (
                    <StyledSheetButton
                      testID="episode-action-server"
                      key={option.name}
                      hasTVPreferredFocus={index === 0}
                      onPress={() => setSelectedServer(option)}
                      icon={<IoniconsIcon name="server-outline" size={20} />}
                      label={option.name}
                    />
                  ))
                )}
              </HUYStack>
            </SheetList>
          )}

          {showQualitySelection && (
            <SheetList>
              <HUYStack className="gap-1 mt-2">
                {sourcesQuery.isLoading || !server ? (
                  <ListState loading title="Loading video sources..." />
                ) : sourcesQuery.error ? (
                  <ListState
                    title="Failed to load video sources"
                    subtitle="Please try again or try different server"
                    severity="error"
                  />
                ) : videoSources.length === 0 ? (
                  <ListState
                    title="No video sources available"
                    subtitle="Please try different server"
                    severity="error"
                  />
                ) : (
                  videoSources.map((source, index) => {
                    const quality = source.quality || `Source ${index + 1}`;
                    const url = source.url;

                    return (
                      <StyledSheetButton
                        testID="episode-action-quality"
                        key={`${index}-${url}`}
                        hasTVPreferredFocus={index === 0}
                        onPress={() =>
                          actionMode === 'download' ? handleDownloadWithQuality(url) : handleOpenWithQuality(url)
                        }
                        icon={
                          actionMode === 'download' ? (
                            <IoniconsIcon name="download-outline" size={18} />
                          ) : (
                            <IoniconsIcon name="play" size={18} />
                          )
                        }
                        label={source.server ? `${quality} · ${source.server}` : quality}
                        rightIcon={<IoniconsIcon name="chevron-forward" size={18} className="text-foreground" />}
                      />
                    );
                  })
                )}
              </HUYStack>
            </SheetList>
          )}
        </HUYStack>
      ) : null}
    </BottomSheet>
  );
});

EpisodeActionsSheet.displayName = 'EpisodeActionsSheet';

export default EpisodeActionsSheet;
