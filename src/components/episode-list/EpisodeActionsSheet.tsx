import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, Text } from 'react-native';
import { IAnimeEpisode, IMovieEpisode, IEpisodeServer } from 'react-native-consumet';
import {
  useWatchProgressStore,
  useWatchAnimeEpisodes,
  useWatchMoviesEpisodes,
  useServerStore,
  useSheetColor,
  useDownloadStore,
  useMediaInfoStore,
} from '@/hooks';
import { toast } from 'sonner-native';
import { MediaType } from '@/constants/types';
import { useProviderStore } from '@/constants/provider';
import * as IntentLauncher from 'expo-intent-launcher';
import { HUXStack, HUYStack, RippleButton } from '../ui-primitives';
import { Divider } from 'heroui-native';
import { CustomSheet } from '../CustomSheet';
import { IoniconsIcon } from '../Icons';

interface EpisodeActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episode: IAnimeEpisode | IMovieEpisode | null;
  mediaType: MediaType;
  provider: string;
  mediaId: string;
  type?: string;
}

interface SheetButtonProps {
  onPress: () => void;
  icon?: React.ReactNode;
  label: string;
  rightIcon?: React.ReactNode;
}

const StyledSheetButton: React.FC<SheetButtonProps> = memo(({ onPress, icon, label, rightIcon }) => {
  return (
    <HUXStack className="items-center justify-between gap-3">
      <RippleButton className="flex-1 p-3.5 rounded-lg bg-default" onPress={onPress}>
        <HUXStack className="items-center gap-3">
          {icon ? icon : null}
          <Text className="text-base font-medium text-accent">{label}</Text>
        </HUXStack>
      </RippleButton>
      {rightIcon ? rightIcon : null}
    </HUXStack>
  );
});

StyledSheetButton.displayName = 'StyledSheetButton';

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

const EpisodeActionsSheet: React.FC<EpisodeActionsSheetProps> = memo(
  ({ open, onOpenChange, episode, mediaType, provider, mediaId, type }) => {
    const { setProgress, getProgress, progresses } = useWatchProgressStore();
    const { getCurrentServer } = useServerStore();
    const { getProvider } = useProviderStore();
    const { addDownload, startDownload } = useDownloadStore();
    const mediaInfo = useMediaInfoStore((state) => state.mediaInfo);
    const sheetColor = useSheetColor();

    const [showQualitySelection, setShowQualitySelection] = useState(false);
    const [showServerSelection, setShowServerSelection] = useState(false);
    const [shouldFetchSources, setShouldFetchSources] = useState(false);
    const [selectedServer, setSelectedServer] = useState<IEpisodeServer | null>(null);
    const [actionMode, setActionMode] = useState<'external-player' | 'download'>('external-player');

    // Only fetch when user explicitly requests it
    const shouldEnableQuery = shouldFetchSources && !!episode?.id;

    // Fetch video sources when user wants to open in external player
    const animeSourcesQuery = useWatchAnimeEpisodes({
      episodeId: episode?.id || '',
      provider: getProvider(mediaType) || provider,
      server: selectedServer || getCurrentServer() || undefined,
      dub: episode?.isDubbed === 'true' || false,
      enabled: shouldEnableQuery,
    });

    const movieSourcesQuery = useWatchMoviesEpisodes({
      episodeId: episode?.id || '',
      mediaId,
      type: type || 'TV',
      provider: getProvider(mediaType) || provider,
      server: selectedServer || getCurrentServer() || undefined,
      embed: true,
      enabled: shouldEnableQuery,
    });

    // const sourcesQuery = mediaType === MediaType.ANIME ? animeSourcesQuery : movieSourcesQuery;
    const { data, isLoading, error } = mediaType === MediaType.ANIME ? animeSourcesQuery : movieSourcesQuery;

    // Reset all states when sheet closes
    useEffect(() => {
      if (!open) {
        setShowQualitySelection(false);
        setShowServerSelection(false);
        setSelectedServer(null);
        setShouldFetchSources(false);
        setActionMode('external-player');
      }
    }, [open]);

    // Handle successful data fetch - show appropriate menu
    useEffect(() => {
      if (!shouldFetchSources) return;

      // Show loading immediately - server selection screen ONLY if not already in quality view
      if (!data && !error) {
        // If we're already showing quality selection (e.g., after selecting a server), keep it
        if (!showQualitySelection) {
          setShowServerSelection(true);
          setShowQualitySelection(false);
        }
        return;
      }

      if (!data) return;

      const availableServers = data?.servers || [];

      // If multiple servers available and none selected, show server selection
      if (availableServers.length > 1 && !selectedServer) {
        setShowServerSelection(true);
        setShowQualitySelection(false);
      } else {
        // Otherwise go directly to quality selection
        setShowQualitySelection(true);
        setShowServerSelection(false);
      }
    }, [shouldFetchSources, data, selectedServer, error, showQualitySelection]);

    const handleMarkComplete = useCallback(() => {
      if (!episode?.uniqueId) return;

      const progress = getProgress(episode.uniqueId);
      const isCompleted = progress?.isCompleted ?? false;

      const newProgress = {
        currentTime: isCompleted ? 0 : (progress?.duration ?? 0),
        duration: progress?.duration ?? 0,
        progress: isCompleted ? 0 : 100,
        isCompleted: !isCompleted,
      };

      setProgress(episode.uniqueId, newProgress);

      toast.success(isCompleted ? 'Marked as incomplete' : 'Marked as complete');
      onOpenChange(false);
    }, [episode, getProgress, setProgress, onOpenChange]);

    const handleShowQualityOptions = (mode: 'external-player' | 'download') => {
      if (!episode?.id) return;
      setActionMode(mode);
      // Trigger the query to fetch sources
      setShouldFetchSources(true);
    };

    const handleServerSelect = useCallback((server: IEpisodeServer) => {
      setSelectedServer(server);
      setShowServerSelection(false);
      setShowQualitySelection(true); // Show quality selection immediately with loading state

      // Reset and refetch with new server
      setShouldFetchSources(false);

      // Slight delay to ensure state updates, then trigger refetch
      requestAnimationFrame(() => {
        setShouldFetchSources(true);
      });
    }, []);

    const handleOpenWithQuality = useCallback(
      async (videoUrl: string) => {
        try {
          if (Platform.OS === 'android') {
            // Get subtitles if available
            const subtitles = data?.subtitles || [];
            const hasSubtitles = subtitles.length > 0;
            const progress = getProgress(episode?.uniqueId!);
            // Prepare extras for external players
            const extras: Record<string, any> = {
              title: episode?.title || `Episode ${episode?.number ?? episode?.episode}`,
              position: progress ? Math.floor(progress.currentTime * 1000) : 0, // in ms
              return_result: true,
              filename:
                episode?.title?.toLowerCase().replace(/\s/g, ' ') || `Episode ${episode?.number ?? episode?.episode}`,
            };

            // Add subtitle URLs if available (for MX Player, VLC, etc.)
            if (hasSubtitles) {
              const subtitleUrls = subtitles.map((sub) => sub.url).filter(Boolean);
              const subtitleNames = subtitles.map((sub) => sub.lang || 'Unknown').filter(Boolean);

              if (subtitleUrls.length > 0) {
                // MX Player format
                extras['subs'] = subtitleUrls;
                extras['subs.enable'] = subtitleUrls;
                extras['subs.name'] = subtitleNames;
                extras['subs.filename'] = subtitleUrls;
                // VLC and other players
                extras['subtitle'] = subtitleUrls[0];
                extras['subtitles_location'] = subtitleUrls[0];
              }
            }

            // Use IntentLauncher to open video in external player apps (VLC, MX Player, etc.)
            // This returns a Promise with the result when the user returns to the app
            const result = await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: videoUrl,
              type: 'video/*',
              flags: 1,
              extra: extras,
            });
            // Check if player returned any useful data
            if (result.extra) {
              // @ts-ignore
              const position = result.extra.extra_position ?? result.extra.position;
              // @ts-ignore
              const duration = result.extra.extra_duration ?? result.extra.duration;

              // console.log('🎥 Playback Info from External Player:');
              // if (position !== undefined) console.log('  ⏱️  Position:', position / 1000, 's');
              // if (duration !== undefined) console.log('  ⏱️  Duration:', duration / 1000, 's');

              // You can use this data to update watch progress
              // Example: if position and duration are available, update progress store
              if (position && duration && episode?.uniqueId) {
                setProgress(episode.uniqueId, {
                  currentTime: position / 1000, // Convert ms to seconds
                  duration: duration / 1000,
                  progress: (position / duration) * 100,
                  isCompleted: position / duration >= 90,
                });
              }
            } else {
              console.log('No extras returned from external player');
            }
          } else if (Platform.OS === 'ios') {
            await Linking.openURL(videoUrl);
          }
          onOpenChange(false);
        } catch (error) {
          console.error('❌ Error opening external player:', error);
          toast.error('Failed to open external player', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },
      [onOpenChange, data?.subtitles, episode],
    );

    const handleDownloadWithQuality = useCallback(
      async (videoUrl: string) => {
        try {
          if (!episode) return;

          // Extract episode number and title
          const episodeNumber = Number(episode.number ?? episode.episode ?? 1);
          const episodeName = episode.title || `Episode ${episodeNumber}`;

          // Get show name from media info store
          let showName: string | undefined;
          if (mediaInfo?.title) {
            showName =
              typeof mediaInfo.title === 'object'
                ? mediaInfo.title.english || mediaInfo.title.romaji || mediaInfo.title.native
                : mediaInfo.title;
          }

          // Get season from episode or media info
          // @ts-ignore - Some episode objects may have season property
          const seasonFromEpisode = episode.season;
          // @ts-ignore - Some media info objects may have season property
          const seasonFromMedia = mediaInfo?.season;
          const season =
            seasonFromEpisode !== undefined
              ? Number(seasonFromEpisode)
              : seasonFromMedia !== undefined
                ? Number(seasonFromMedia)
                : undefined;

          // Get subtitles if available
          const subtitles = data?.subtitles || [];

          // Convert subtitles to TextTracks format for download
          const externalSubtitles = subtitles.map((sub) => ({
            title: sub.lang || 'Unknown',
            language: (sub.lang || 'en') as any, // Cast to avoid ISO639_1 type issues
            type: 'application/x-subrip' as any,
            uri: sub.url,
          }));

          // Add download to queue
          const downloadId = addDownload({
            url: videoUrl,
            name: episodeName,
            showName: showName,
            season: season,
            episode: episodeNumber,
            uniqueId: episode.uniqueId,
            episodeId: episode.id,
            externalSubtitles: externalSubtitles.length > 0 ? (externalSubtitles as any) : undefined,
          });

          // Start download immediately
          await startDownload(downloadId);

          toast.success('Download started', {
            description: showName ? `${showName} - ${episodeName}` : `${episodeName} - Episode ${episodeNumber}`,
          });

          onOpenChange(false);
        } catch (error) {
          console.error('❌ Error starting download:', error);
          toast.error('Failed to start download', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },
      [episode, data?.subtitles, mediaInfo, addDownload, startDownload, onOpenChange],
    );

    const handleBackToMainMenu = useCallback(() => {
      if (showQualitySelection) {
        // If in quality view and server was selected, go back to server selection
        if (selectedServer) {
          // Reset selected server and stop fetching to show server list
          setSelectedServer(null);
          setShowQualitySelection(false);
          setShouldFetchSources(false);
          // Trigger new fetch to show server selection
          requestAnimationFrame(() => {
            setShouldFetchSources(true);
          });
        } else {
          // Go back to main menu
          setShowQualitySelection(false);
          setShouldFetchSources(false);
        }
      } else if (showServerSelection) {
        // Go back to main menu
        setShowServerSelection(false);
        setShouldFetchSources(false);
      }
    }, [showQualitySelection, showServerSelection, selectedServer]);

    // Subscribe to progress changes - this will cause re-render when progress updates
    const progress = episode?.uniqueId ? progresses[episode.uniqueId] : null;
    const isCompleted = progress?.isCompleted ?? false;

    const videoSources = data?.sources || [];
    const availableServers = data?.servers || [];

    const headerTitle = useMemo(() => {
      if (showServerSelection) return 'Select Server';
      if (showQualitySelection) {
        const serverName = selectedServer?.name || getCurrentServer()?.name;
        return serverName ? `Select Quality - ${serverName}` : 'Select Quality';
      }
      return episode?.title;
    }, [episode?.title, getCurrentServer, selectedServer?.name, showQualitySelection, showServerSelection]);

    const snapPoints = useMemo(
      () => (showQualitySelection || showServerSelection ? ['70%'] : ['40%']),
      [showQualitySelection, showServerSelection],
    );

    const shouldShowBack = showQualitySelection || showServerSelection;

    if (!episode) return null;
    return (
      <CustomSheet open={open} onOpenChange={onOpenChange} snapPoints={snapPoints}>
        <HUYStack className="gap-2">
          {/* Header */}
          <HUXStack className="justify-between items-center mb-2">
            <Text className="text-lg font-bold text-accent w-4/5" numberOfLines={1}>
              {headerTitle}
            </Text>
            {/* <HUYStack className="flex-1">
            </HUYStack> */}
            <RippleButton onPress={() => (shouldShowBack ? handleBackToMainMenu() : onOpenChange(false))}>
              {shouldShowBack ? (
                <IoniconsIcon name="chevron-back" size={24} className="text-foreground" />
              ) : (
                <IoniconsIcon name="close" size={24} className="text-foreground" />
              )}
            </RippleButton>
          </HUXStack>

          <Divider />

          {/* Main Menu */}
          {!showQualitySelection && !showServerSelection && (
            <HUYStack className="gap-1 mt-2">
              {/* Mark as Complete/Incomplete */}
              <StyledSheetButton
                onPress={handleMarkComplete}
                icon={<IoniconsIcon name="checkmark" size={20} />}
                label={isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
              />

              {/* Open in External Player */}

              <StyledSheetButton
                onPress={() => handleShowQualityOptions('external-player')}
                icon={<IoniconsIcon name="play" size={20} />}
                label="Open in External Player"
              />
              {/* Download */}
              <StyledSheetButton
                onPress={() => handleShowQualityOptions('download')}
                icon={<IoniconsIcon name="download-outline" size={20} />}
                label="Download"
              />
            </HUYStack>
          )}

          {/* Server Selection Menu */}
          {showServerSelection && (
            <ScrollView style={{ maxHeight: 400 }}>
              <HUYStack className="gap-1 mt-2">
                {isLoading ? (
                  <ListState loading title="Loading servers..." />
                ) : error ? (
                  <ListState title="Failed to load servers" subtitle="Please try again" severity="error" />
                ) : availableServers.length === 0 ? (
                  <ListState title="No servers available" subtitle="Please try again later" severity="error" />
                ) : (
                  availableServers.map((server) => (
                    <StyledSheetButton
                      key={server.name}
                      onPress={() => handleServerSelect(server)}
                      icon={<IoniconsIcon name="server-outline" size={20} />}
                      label={server.name}
                    />
                  ))
                )}
              </HUYStack>
            </ScrollView>
          )}

          {/* Quality Selection Menu */}
          {showQualitySelection && (
            <ScrollView style={{ maxHeight: 400 }}>
              <HUYStack className="gap-1 mt-2">
                {isLoading ? (
                  <ListState loading title="Loading video sources..." />
                ) : error ? (
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
                        key={quality}
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
                        label={quality}
                        rightIcon={<IoniconsIcon name="chevron-forward" size={18} className="text-foreground" />}
                      />
                    );
                  })
                )}
              </HUYStack>
            </ScrollView>
          )}
        </HUYStack>
      </CustomSheet>
    );
  },
);

EpisodeActionsSheet.displayName = 'EpisodeActionsSheet';

export default EpisodeActionsSheet;
