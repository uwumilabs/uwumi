import React, { memo, useCallback, useState, useEffect } from 'react';
import { Sheet, YStack, Text, XStack, Separator, Spinner } from 'tamagui';
import { Pressable, Linking, Platform, ScrollView } from 'react-native';
import { IAnimeEpisode, IMovieEpisode, IEpisodeServer } from 'react-native-consumet';
import { Check, X, Play, ChevronRight, Server, ChevronLeft } from '@tamagui/lucide-icons';
import {
  useWatchProgressStore,
  useCurrentTheme,
  useWatchAnimeEpisodes,
  useWatchMoviesEpisodes,
  useServerStore,
} from '@/hooks';
import { toast } from 'sonner-native';
import * as Haptics from 'expo-haptics';
import { MediaType } from '@/constants/types';
import { useProviderStore } from '@/constants/provider';
import * as IntentLauncher from 'expo-intent-launcher';
import { RippleButton } from '../ui-primitives';
import { SHEET_COLOR } from '@/constants/config';

interface EpisodeActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episode: IAnimeEpisode | IMovieEpisode | null;
  mediaType: MediaType;
  provider: string;
  mediaId: string;
  type?: string;
}

const EpisodeActionsSheet: React.FC<EpisodeActionsSheetProps> = memo(
  ({ open, onOpenChange, episode, mediaType, provider, mediaId, type }) => {
    const { setProgress, getProgress, progresses } = useWatchProgressStore();
    const { getCurrentServer } = useServerStore();
    const { getProvider } = useProviderStore();

    const [showQualitySelection, setShowQualitySelection] = useState(false);
    const [showServerSelection, setShowServerSelection] = useState(false);
    const [shouldFetchSources, setShouldFetchSources] = useState(false);
    const [selectedServer, setSelectedServer] = useState<IEpisodeServer | null>(null);

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
      }
    }, [open]);

    // Handle successful data fetch - show appropriate menu
    useEffect(() => {
      if (!shouldFetchSources || !data) return;

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

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [shouldFetchSources, data, selectedServer]);

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

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success(isCompleted ? 'Marked as incomplete' : 'Marked as complete');
      onOpenChange(false);
    }, [episode, getProgress, setProgress, onOpenChange]);

    const handleShowQualityOptions = () => {
      if (!episode?.id) return;
      // Trigger the query to fetch sources
      setShouldFetchSources(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const handleOpenWithQuality = useCallback(
      async (videoUrl: string, quality: string) => {
        try {
          if (Platform.OS === 'android') {
            // Get subtitles if available
            const subtitles = data?.subtitles || [];
            const hasSubtitles = subtitles.length > 0;

            // Prepare extras for external players
            const extras: Record<string, any> = {
              title: episode?.title || `Episode ${episode?.number ?? episode?.episode}`,
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
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: videoUrl,
              type: 'video/*',
              flags: 1,
              extra: extras,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const subMessage = hasSubtitles
              ? ` with ${subtitles.length} subtitle${subtitles.length > 1 ? 's' : ''}`
              : '';
            toast.success(`Opening ${quality}${subMessage}`);
          } else if (Platform.OS === 'ios') {
            await Linking.openURL(videoUrl);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success(`Opening ${quality} in external player`);
          }

          onOpenChange(false);
        } catch (error) {
          console.error('Error opening external player:', error);
          toast.error('Failed to open external player', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },
      [onOpenChange, data?.subtitles, episode],
    );

    const handleBackToMainMenu = useCallback(() => {
      if (showQualitySelection) {
        // If in quality view and server was selected, go back to server selection
        if (selectedServer) {
          setShowQualitySelection(false);
          setShowServerSelection(true);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [showQualitySelection, showServerSelection, selectedServer]);

    // Subscribe to progress changes - this will cause re-render when progress updates
    const progress = episode?.uniqueId ? progresses[episode.uniqueId] : null;
    const isCompleted = progress?.isCompleted ?? false;

    const videoSources = data?.sources || [];
    const availableServers = data?.servers || [];
    
    // console.log({ showQualitySelection, showServerSelection });
    // Determine current view title
    const getHeaderTitle = () => {
      if (showServerSelection) return 'Select Server';
      if (showQualitySelection) {
        const serverName = selectedServer?.name || getCurrentServer()?.name;
        return serverName ? `Select Quality - ${serverName}` : 'Select Quality';
      }
      return episode?.title;
    };

    if (!episode) return null;

    return (
      <Sheet
        forceRemoveScrollEnabled={false}
        modal
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={showQualitySelection || showServerSelection ? [70] : [35]}
        snapPointsMode="percent"
        dismissOnSnapToBottom
        zIndex={100_000}
        animation="quick">
        <Sheet.Overlay
          backgroundColor="rgba(0,0,0,0.5)"
          animation="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Frame backgroundColor={SHEET_COLOR} borderTopLeftRadius={20} borderTopRightRadius={20}>
          <YStack padding="$4" gap="$2" minHeight={200}>
            {/* Header */}
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
              <YStack flex={1}>
                <Text fontSize="$5" fontWeight={700} color="$color">
                  {getHeaderTitle()}
                </Text>
              </YStack>
              <RippleButton
                onPress={() =>
                  showQualitySelection || showServerSelection ? handleBackToMainMenu() : onOpenChange(false)
                }>
                {showQualitySelection || showServerSelection ? (
                  <ChevronLeft size={24} color="$color1" />
                ) : (
                  <X size={24} color="$color1" />
                )}
              </RippleButton>
            </XStack>

            <Separator borderColor="$color3" />

            {/* Main Menu */}
            {!showQualitySelection && !showServerSelection && (
              <YStack gap="$1" marginTop="$2">
                {/* Mark as Complete/Incomplete */}
                <XStack
                  padding="$3.5"
                  alignItems="center"
                  gap="$3"
                  borderRadius="$3"
                  backgroundColor="$color4"
                  onPress={handleMarkComplete}
                  cursor="pointer">
                  <Check size={20} color={isCompleted ? '$green10' : '$color'} />
                  <Text fontSize="$4" fontWeight="500" color="$color">
                    {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                  </Text>
                </XStack>

                {/* Open in External Player */}
                <XStack
                  padding="$3.5"
                  alignItems="center"
                  justifyContent="space-between"
                  borderRadius="$3"
                  backgroundColor="$color4"
                  onPress={handleShowQualityOptions}
                  cursor="pointer">
                  <XStack alignItems="center" gap="$3" flex={1}>
                    <Play size={20} color="$color" />
                    <YStack flex={1}>
                      <Text fontSize="$4" fontWeight="500" color="$color">
                        Open in External Player
                      </Text>
                      <Text fontSize="$2.5" color="$color1" opacity={0.7}>
                        Choose quality
                      </Text>
                    </YStack>
                  </XStack>
                  <ChevronRight size={20} color="$color1" />
                </XStack>
              </YStack>
            )}

            {/* Server Selection Menu */}
            {showServerSelection && (
              <ScrollView style={{ maxHeight: 400 }}>
                <YStack gap="$1" marginTop="$2">
                  {availableServers.length === 0 ? (
                    <YStack alignItems="center" padding="$4">
                      <Text fontSize="$4" color="$color1" textAlign="center">
                        No servers available
                      </Text>
                    </YStack>
                  ) : (
                    availableServers.map((server, index) => (
                      <XStack
                        key={index}
                        padding="$3.5"
                        alignItems="center"
                        justifyContent="space-between"
                        borderRadius="$3"
                        backgroundColor="$color4"
                        marginBottom="$1"
                        onPress={() => handleServerSelect(server)}
                        cursor="pointer">
                        <XStack alignItems="center" gap="$3">
                          <Server size={18} color="$color" />
                          <Text fontSize="$4" fontWeight="500" color="$color">
                            {server.name}
                          </Text>
                        </XStack>
                        <ChevronRight size={18} color="$color1" opacity={0.5} />
                      </XStack>
                    ))
                  )}
                </YStack>
              </ScrollView>
            )}

            {/* Quality Selection Menu */}
            {showQualitySelection && (
              <ScrollView style={{ maxHeight: 400 }}>
                <YStack gap="$1" marginTop="$2">
                  {isLoading ? (
                    <YStack alignItems="center" justifyContent="center" padding="$4">
                      <Spinner size="large" color="$color" />
                      <Text fontSize="$3" color="$color1" marginTop="$2">
                        Loading video sources...
                      </Text>
                    </YStack>
                  ) : error ? (
                    <YStack alignItems="center" padding="$4">
                      <Text fontSize="$4" color="$red10" textAlign="center">
                        Failed to load video sources
                      </Text>
                      <Text fontSize="$3" color="$color1" textAlign="center" marginTop="$2">
                        Please try again or use a different server
                      </Text>
                    </YStack>
                  ) : videoSources.length === 0 ? (
                    <YStack alignItems="center" padding="$4">
                      <Text fontSize="$4" color="$color1" textAlign="center">
                        No video sources available
                      </Text>
                      <Text fontSize="$3" color="$color1" textAlign="center" marginTop="$2">
                        Try selecting a different server
                      </Text>
                    </YStack>
                  ) : (
                    videoSources.map((source, index) => {
                      const quality = source.quality || `Source ${index + 1}`;
                      const url = source.url;

                      return (
                        <XStack
                          key={index}
                          padding="$3.5"
                          alignItems="center"
                          justifyContent="space-between"
                          borderRadius="$3"
                          backgroundColor="$color4"
                          marginBottom="$1"
                          onPress={() => handleOpenWithQuality(url, quality)}
                          cursor="pointer">
                          <XStack alignItems="center" gap="$3">
                            <Play size={18} color="$color" />
                            <YStack>
                              <Text fontSize="$4" fontWeight="500" color="$color">
                                {quality}
                              </Text>
                              {source.size && (
                                <Text fontSize="$2" color="$color1" opacity={0.7}>
                                  {source.size}
                                </Text>
                              )}
                            </YStack>
                          </XStack>
                          <ChevronRight size={18} color="$color1" opacity={0.5} />
                        </XStack>
                      );
                    })
                  )}
                </YStack>
              </ScrollView>
            )}
          </YStack>
        </Sheet.Frame>
      </Sheet>
    );
  },
);

EpisodeActionsSheet.displayName = 'EpisodeActionsSheet';

export default EpisodeActionsSheet;
