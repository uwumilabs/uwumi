import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { BufferingStrategyType, ISO639_1, OnLoadData } from 'react-native-video/src';
import { MediaType, SubtitleTrack } from '@/constants/types';
import { IAnimeInfo, ISubtitle, TvType } from 'react-native-consumet';
import { HUXStack, ThemedView } from '@/components/ui-primitives';
import { MaterialIconsIcon } from '@/components/Icons';
import { PlayerOverlay, SkipSlot, type UpNext } from '@/components/watch/PlayerOverlay';
import { EpisodesPanel } from '@/components/watch/EpisodesPanel';
import {
  AddSubtitlesItem,
  AddSubtitlesViews,
  isSubtitleFile,
  subtitleType,
  SUBTITLE_FILE_TYPES,
  type SubtitleLanguage,
  type SubtitleSearchResult,
} from '@/components/watch/AddSubtitles';
import {
  ServerStatusScreen,
  ServerLoadingOverlay,
  type ServerChip,
  type ServerPhase,
} from '@/components/watch/ServerStatus';
import { ServerMenuItem, ServerMenuView } from '@/components/watch/ServerMenu';
import ProviderSelection from '@/components/watch/ProviderSelection';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEpisodesIdStore } from '@/hooks/stores/useEpisodesStore';
import {
  episodeNumber as numberOf,
  getAdjacentEpisodes,
  routeParams,
  watchParams,
  type EpisodeContext,
  type EpisodeItem,
  type WatchParams,
} from '@/utils/episodes';
import { infoHref } from '@/utils/routes';
import { infoTitle } from '@/utils/media';
import { useEpisodeList } from '@/hooks/useEpisodeList';
import {
  useSkipTimes,
  episodeTarget,
  sourceRequestHeaders,
  useExternalSubtitles,
  externalSubtitlesQuery,
  canSearchExternalSubtitles,
} from '@/hooks/queries/watchQueries';
import { isWatchedPercent, useWatchProgressStore } from '@/hooks/stores/useWatchProgressStore';
import { useServerPlayback } from '@/hooks/useServerRotation';
import { useBackHandler } from '@/hooks/useBackHandler';
import { useMediaInfo } from '@/hooks/queries/infoQueries';
import { useContinueWatchingStore } from '@/hooks/stores/useContinueWatchingStore';
import { useExternalSubtitleStore } from '@/hooks/stores/useExternalSubtitleStore';
import { usePlayerSettingsStore } from '@/hooks/stores/usePlayerSettingsStore';
import { useDownloadedFileUri, useDownloadedThumbnailsUri } from '@/downloads/useDownloadStore';
import { useSeekPreviewStore } from '@/hooks/stores/useSeekPreviewStore';
import { useToast } from '@/components/heroui';
import * as DocumentPicker from 'expo-document-picker';
import { useActiveProvider, useProviderName, useProviderSelectionStore } from '@/hooks/stores/useProviderStore';
import { isThumbnailTrack } from '@/utils/seekPreview';
import { isTV } from '@/utils/tv';
import { PerfProfiler, PerfRun } from '@/perf/perfHarness';
import {
  VideoPlayer,
  DefaultLayout,
  useVideoSelector,
  useFullscreen,
  useSettings,
  CustomVideoTrack,
  BaseIconButton,
  SkipNext,
  SkipPrevious,
} from 'react-native-video-toolkit';

// Saved progress this close to the end counts as finished
const RESTART_TAIL_SECONDS = 10;

const Watch = () => {
  const router = useRouter();
  const params = useLocalSearchParams() as unknown as WatchParams;
  const {
    mediaType,
    provider,
    id,
    mediaId,
    episodeId,
    uniqueId: routeUniqueId,
    title,
    poster,
    type,
    episodeNumber: routeEpisodeNumber,
    seasonNumber,
  } = params;
  const savePlayback = useWatchProgressStore((state) => state.savePlayback);
  const currentProvider = useActiveProvider(mediaType);
  const { data: mediaInfo, isLoading: mediaInfoLoading } = useMediaInfo();
  const recordContinueWatching = useContinueWatchingStore((state) => state.record);
  const { toast } = useToast();
  const fullscreen = useVideoSelector((state) => state.fullscreen);
  const videoRef = useVideoSelector((state) => state.videoRef);
  const isPlaying = useVideoSelector((state) => state.isPlaying);
  const autoPip = usePlayerSettingsStore((state) => state.autoPip);
  const { enterFullscreen, exitFullscreen } = useFullscreen();
  const navigation = useNavigation();
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const openEpisodes = useCallback(() => setEpisodesOpen(true), []);
  const closeEpisodes = useCallback(() => setEpisodesOpen(false), []);

  // The same (cached) episode list the screen's EpisodeList shows
  const { episodes, movieSeasons, setSeason, providerMediaId, isLoading: episodesLoading } = useEpisodeList();
  // The list only holds the season on screen, but a TV episode's neighbours can be in the seasons either side
  const allEpisodes = useMemo<EpisodeItem[]>(
    () => (movieSeasons ? movieSeasons.flatMap((season) => season.episodes ?? []) : episodes),
    [movieSeasons, episodes],
  );
  const switchedProvider = !!provider && currentProvider !== provider;
  // A route can carry an older key than the loaded list (Continue watching saved before an upgrade); the list has
  // the current key and number
  const listedEpisode = switchedProvider
    ? allEpisodes.find((episode) => episode.uniqueId === routeUniqueId)
    : allEpisodes.find((episode) => episode.id === episodeId);
  const activeEpisodeId = switchedProvider ? listedEpisode?.id : episodeId;
  const activeMediaId = switchedProvider ? providerMediaId : mediaId;
  // The route's id is empty when the provider didn't find the title; after a switch, the list has to load first
  const missingOnProvider = !activeEpisodeId && !(switchedProvider && episodesLoading);
  const uniqueId = listedEpisode?.uniqueId ?? routeUniqueId;
  // A downloaded episode plays its file, with no servers, so it works offline. If the file won't play, it streams
  const downloadedUri = useDownloadedFileUri(uniqueId);
  const [failedDownload, setFailedDownload] = useState<string | undefined>();
  const localUri = downloadedUri && failedDownload !== uniqueId ? downloadedUri : undefined;
  const episodeNumber = listedEpisode?.number !== undefined ? String(listedEpisode.number) : routeEpisodeNumber;
  const adjacentEpisodes = useMemo(() => getAdjacentEpisodes(allEpisodes, uniqueId), [allEpisodes, uniqueId]);
  const playingSeason =
    movieSeasons?.findIndex((season) => season.episodes?.some((episode) => episode.uniqueId === uniqueId)) ?? -1;

  const { prevEpisode, nextEpisode, hasPrev, hasNext } = adjacentEpisodes;

  // Keyed by episode, so the next episode doesn't query skip times with this one's length
  const [loadedLength, setLoadedLength] = useState<{ uniqueId?: string; seconds: number }>({ seconds: 0 });
  const malId = (mediaInfo as IAnimeInfo | undefined)?.malId;
  const aniSkip = usePlayerSettingsStore((state) => state.aniSkip);
  const { data: skipTimes = [], isFetched: skipTimesFetched } = useSkipTimes({
    malId,
    episodeNumber,
    episodeLength: loadedLength.uniqueId === uniqueId ? loadedLength.seconds : 0,
    enabled: mediaType === MediaType.ANIME && aniSkip,
  });
  // AniSkip is off, has answered, or can't be asked without a MAL id; SkipSlot jumps where it has no intro or outro
  const skipForward = mediaType === MediaType.ANIME && (!aniSkip || skipTimesFetched || (!!mediaInfo && !malId));
  const upNext = useMemo<UpNext | undefined>(
    () => (nextEpisode ? { label: `EP ${numberOf(nextEpisode) ?? ''}`.trim(), title: nextEpisode.title } : undefined),
    [nextEpisode],
  );

  const episodeContext = useMemo<EpisodeContext>(
    () => ({ mediaType, provider: currentProvider, id, mediaId: providerMediaId ?? mediaId, type }),
    [mediaType, id, mediaId, providerMediaId, type, currentProvider],
  );

  const openEpisode = useCallback(
    (episode: EpisodeItem | null) => {
      if (!episode?.id || !episode.uniqueId) {
        toast.show({ variant: 'danger', label: 'Unable to navigate', description: 'Episode data is invalid' });
        return;
      }
      router.replace({ pathname: '/watch/[mediaType]', params: watchParams(episode, episodeContext) });
    },
    [episodeContext, router, toast],
  );

  const handlePrevEpisode = useCallback(() => {
    if (hasPrev) openEpisode(prevEpisode);
  }, [hasPrev, prevEpisode, openEpisode]);
  const handleNextEpisode = useCallback(() => {
    if (hasNext) openEpisode(nextEpisode);
  }, [hasNext, nextEpisode, openEpisode]);

  // The watch screen is always fullscreen. Changing episode replaces the route, so only leaving the screen exits
  // fullscreen; otherwise every episode would rotate to portrait and back.
  const leavingRef = useRef(false);
  useEffect(() => {
    if (!fullscreen && !leavingRef.current) enterFullscreen();
  }, [fullscreen, enterFullscreen]);
  const exitFullscreenRef = useRef(exitFullscreen);
  useEffect(() => {
    exitFullscreenRef.current = exitFullscreen;
  });
  // expo-router 58 has no beforeRemove event. By unmount the state shows where we went: another watch route means
  // the episode was replaced (stay in fullscreen); this route on top is React's dev remount
  useEffect(
    () => () => {
      const state = navigation.getState();
      if (state?.routes[state.index]?.name === 'watch/[mediaType]') return;
      leavingRef.current = true;
      exitFullscreenRef.current();
    },
    [navigation],
  );

  useFocusEffect(
    useCallback(() => {
      if (uniqueId) useEpisodesIdStore.getState().setCurrentUniqueId(uniqueId);
      if (playingSeason >= 0) setSeason(playingSeason);
      return () => {
        // The next episode's screen may have taken over already, as replacing the route focuses it first
        if (useEpisodesIdStore.getState().currentUniqueId === uniqueId) {
          useEpisodesIdStore.getState().setCurrentUniqueId(null);
        }
      };
    }, [uniqueId, playingSeason, setSeason]),
  );

  const { width: windowWidth } = useWindowDimensions();
  const dub = useProviderSelectionStore((state) => state.dub);
  const target = useMemo(
    () =>
      episodeTarget({
        mediaType,
        provider: currentProvider,
        episodeId: activeEpisodeId ?? '',
        mediaId: activeMediaId,
        dub,
      }),
    [mediaType, currentProvider, activeEpisodeId, dub, activeMediaId],
  );
  // A switched provider's list has to load before its episode id is known
  const waitingForList = switchedProvider && episodesLoading;
  const playback = useServerPlayback(target, !waitingForList && !localUri);
  const { serversQuery, rotation } = playback;
  const serverNames = useMemo(() => playback.servers.map((server) => server.name), [playback.servers]);

  const subtitleLanguage = useExternalSubtitleStore((state) => state.language);
  const subtitleSearch = useMemo(
    () => ({ imdbId: mediaInfo?.mappings?.imdb?.replace('tt', '') || '', episodeNumber, seasonNumber, type }),
    [mediaInfo?.mappings?.imdb, episodeNumber, seasonNumber, type],
  );
  // Only TMDB titles carry an IMDb id
  const canSearchSubtitles = mediaType === MediaType.MOVIE && canSearchExternalSubtitles(subtitleSearch);
  const wantsExternalSubtitles = !!subtitleLanguage && mediaType === MediaType.MOVIE;
  const { data: externalSubtitles, isLoading: externalSubtitlesLoading } = useExternalSubtitles({
    ...subtitleSearch,
    language: subtitleLanguage,
    // A download already carries the subtitles it was saved with
    enabled: wantsExternalSubtitles && !localUri,
  });

  const data = playback.sources;
  // New text tracks would reload the source, so the player waits for external subtitles, which give up quickly
  const waitingForSubtitles = !localUri && wantsExternalSubtitles && (mediaInfoLoading || externalSubtitlesLoading);

  useBackHandler(episodesOpen, () => {
    setEpisodesOpen(false);
    return true;
  });

  const playheadRef = useRef(0);
  const recordedEpisodeRef = useRef<string | null>(null);
  const savedBucketRef = useRef('');

  // Keyed by episode, like loadedLength, so a file added to one episode doesn't carry over to the next
  const [addedSubtitles, setAddedSubtitles] = useState<{ uniqueId?: string; tracks: SubtitleTrack[] }>({
    tracks: [],
  });
  // Adding tracks reloads the source, so onLoad resumes where it was and turns the first new track on
  const pendingAddRef = useRef<{ uniqueId?: string; resumeAt: number; title?: string } | null>(null);
  const { textTracks: playerTextTracks, setTextTrack } = useSettings();
  const queryClient = useQueryClient();

  // Puts this show at the front of Continue watching
  const rememberEpisode = useCallback(() => {
    const showTitle = infoTitle(mediaInfo);
    const showImage = mediaInfo?.image;
    recordContinueWatching({
      mediaType,
      showId: id,
      showTitle,
      showImage,
      uniqueId,
      // Unknown while the list loads, or when a season TMDB couldn't load might hold the next episode
      hasNextEpisode:
        adjacentEpisodes.currentIndex >= 0 && !movieSeasons?.some((season) => season.failed)
          ? adjacentEpisodes.hasNext
          : undefined,
      watchParams: routeParams({
        ...params,
        uniqueId,
        episodeNumber,
        // Resumes on the provider it was switched to
        ...(switchedProvider &&
          activeEpisodeId && { provider: currentProvider, episodeId: activeEpisodeId, mediaId: activeMediaId }),
      }),
      infoParams: infoHref({ mediaType, id, type, title: showTitle, image: showImage }).params,
    });
  }, [
    mediaInfo,
    id,
    params,
    recordContinueWatching,
    mediaType,
    uniqueId,
    episodeNumber,
    switchedProvider,
    activeEpisodeId,
    activeMediaId,
    adjacentEpisodes,
    movieSeasons,
    currentProvider,
    type,
  ]);

  const handleProgress = useCallback(
    ({ currentTime, seekableDuration }: { currentTime: number; seekableDuration: number }) => {
      playheadRef.current = currentTime;
      // Save every 5 seconds: progress events come every 250 ms, so once per 5 s bucket, not on each event in it
      const bucket = `${uniqueId}:${Math.floor(currentTime / 5)}`;
      if (!uniqueId || !(seekableDuration > 0) || savedBucketRef.current === bucket) return;
      savedBucketRef.current = bucket;
      savePlayback(uniqueId, currentTime, seekableDuration);
      // Again on finishing, by when the episode list (and so whether there's a next one) has loaded
      const recordKey = `${uniqueId}:${isWatchedPercent((currentTime / seekableDuration) * 100)}`;
      if (recordedEpisodeRef.current !== recordKey) {
        recordedEpisodeRef.current = recordKey;
        rememberEpisode();
      }
    },
    [uniqueId, savePlayback, rememberEpisode],
  );

  const videoTracks = useMemo(() => {
    if (!data?.sources || data.sources.length === 0) return undefined;
    const tracks: CustomVideoTrack[] = [];
    data.sources.forEach((track, index) => {
      if (track?.url) {
        const quality = track.quality?.toLowerCase() || '';
        const auto = quality === 'auto' || quality === 'default';
        const match = quality.match(/(\d{3,4})p/);
        tracks.push({
          index,
          height: match ? Number(match[1]) : auto ? 9999 : 0,
          label: auto ? 'Auto' : quality.toUpperCase(),
          uri: track.url,
        } as CustomVideoTrack);
      }
    });
    const sortedTracks = tracks.sort((a, b) => (b.height || 0) - (a.height || 0));
    sortedTracks.forEach((track, idx) => {
      (track as CustomVideoTrack & { index: number }).index = idx;
    });
    return sortedTracks;
  }, [data]);

  const source =
    localUri ||
    data?.sources?.[0]?.url ||
    data?.sources?.find((s) => s.quality === 'auto' || s.quality === 'default')?.url ||
    '';
  const sourceHeaders = useMemo(
    () => (localUri ? undefined : sourceRequestHeaders(data?.headers)),
    [localUri, data?.headers],
  );

  const downloadedThumbnails = useDownloadedThumbnailsUri(localUri ? uniqueId : undefined);
  const providerThumbnails = useMemo(() => data?.subtitles?.find((track) => isThumbnailTrack(track))?.url, [data]);
  const setSeekPreviewSource = useSeekPreviewStore((state) => state.setSource);
  useEffect(() => {
    const url = localUri ? downloadedThumbnails : providerThumbnails;
    setSeekPreviewSource(url ? { url, headers: sourceHeaders } : null);
    return () => setSeekPreviewSource(null);
  }, [localUri, downloadedThumbnails, providerThumbnails, sourceHeaders, setSeekPreviewSource]);

  // The source's own tracks first, so they're picked over external ones in the same language
  const subtitleTracks = useMemo<(SubtitleTrack | ISubtitle)[]>(
    () => [
      ...(data?.subtitles ?? []),
      ...(externalSubtitles ?? []),
      ...(addedSubtitles.uniqueId === uniqueId ? addedSubtitles.tracks : []),
    ],
    [data?.subtitles, externalSubtitles, addedSubtitles, uniqueId],
  );
  // Listed above "Off" in the Captions menu
  const addedTrackTitles = useMemo(
    () =>
      new Set(
        [...(externalSubtitles ?? []), ...(addedSubtitles.uniqueId === uniqueId ? addedSubtitles.tracks : [])].map(
          (track) => track.title,
        ),
      ),
    [externalSubtitles, addedSubtitles, uniqueId],
  );

  const addSubtitleTracks = useCallback(
    (tracks: SubtitleTrack[]) => {
      const loaded = new Set(subtitleTracks.map((track) => ('url' in track ? track.url : track.uri)));
      const fresh = tracks.filter((track) => !loaded.has(track.uri));
      // Already in the source, such as the Settings language's: selecting it needs no reload
      if (!fresh.length) {
        const existing = playerTextTracks.find((track) => track.title === tracks[0]?.title);
        if (existing) setTextTrack(existing);
        return;
      }
      pendingAddRef.current = { uniqueId, resumeAt: playheadRef.current, title: fresh[0].title };
      setAddedSubtitles((previous) => ({
        uniqueId,
        tracks: [...(previous.uniqueId === uniqueId ? previous.tracks : []), ...fresh],
      }));
    },
    [subtitleTracks, playerTextTracks, setTextTrack, uniqueId],
  );

  const addSubtitleFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled) return;
    const file = result.assets[0];
    if (!isSubtitleFile(file.name)) {
      toast.show({
        variant: 'danger',
        label: 'Not a subtitle file',
        description: `Pick an ${SUBTITLE_FILE_TYPES} file.`,
      });
      return;
    }
    addSubtitleTracks([{ title: file.name, type: subtitleType(file.name), uri: file.uri }]);
  }, [addSubtitleTracks, toast]);

  const searchSubtitles = useCallback(
    async ({ code }: SubtitleLanguage): Promise<SubtitleSearchResult> => {
      try {
        const tracks = await queryClient.fetchQuery(externalSubtitlesQuery({ ...subtitleSearch, language: code }));
        if (!tracks.length) return 'none';
        addSubtitleTracks(tracks);
        return 'added';
      } catch {
        return 'failed';
      }
    },
    [queryClient, subtitleSearch, addSubtitleTracks],
  );

  const phase: ServerPhase | 'loading' | 'playing' = localUri
    ? playback.loaded
      ? 'playing'
      : 'loading'
    : missingOnProvider
      ? 'missing'
      : serversQuery.isError
        ? 'unavailable'
        : rotation.exhausted
          ? 'exhausted'
          : !source || waitingForList || waitingForSubtitles
            ? 'finding'
            : playback.loaded
              ? 'playing'
              : 'loading';

  const providerName = useProviderName(mediaType, currentProvider);
  const chips = useMemo<ServerChip[]>(
    () =>
      rotation.order.map((name) => ({
        name,
        state: rotation.failed[name] ? 'failed' : name === rotation.attempt?.server ? 'current' : 'pending',
        reason: rotation.failed[name],
      })),
    [rotation.order, rotation.failed, rotation.attempt?.server],
  );
  const position = rotation.attempt ? rotation.order.indexOf(rotation.attempt.server) + 1 : 0;
  const { pick } = playback;
  const pickServer = useCallback((name: string) => pick(name, playheadRef.current), [pick]);

  if (phase !== 'loading' && phase !== 'playing') {
    return (
      <ThemedView useStatusBar={false} useSafeArea>
        <ServerStatusScreen
          phase={phase}
          title={title}
          providerName={providerName}
          chips={chips}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          onPick={rotation.pick}
          onRetry={phase === 'unavailable' ? () => serversQuery.refetch() : rotation.retryAll}
          changeProvider={<ProviderSelection mediaType={mediaType} isDubbed={params.isDubbed} />}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView useStatusBar={false} useSafeArea>
      <PerfRun />
      <VideoPlayer
        // A fresh native player per attempt: a failed one can't deliver late events to the next
        key={`${activeEpisodeId || 'video'}|${rotation.attemptKey}`}
        gestureProps={{ onSwipeUp: openEpisodes, onSwipeDown: closeEpisodes, onSingleTap: closeEpisodes }}
        videoProps={{
          resizeMode: 'contain',
          poster: { source: { uri: poster }, resizeMode: 'contain' },
          onProgress: handleProgress,
          reportBandwidth: true,
          automaticallyWaitsToMinimizeStalling: true,
          preventsDisplaySleepDuringVideoPlayback: true,
          allowsExternalPlayback: true,
          mixWithOthers: 'mix',
          bufferingStrategy: BufferingStrategyType.DEPENDING_ON_MEMORY,
          enterPictureInPictureOnLeave: !isTV && isPlaying && autoPip,
          onError: () => {
            if (localUri) {
              console.error('❌ The downloaded file would not play, streaming instead:', localUri);
              setFailedDownload(uniqueId);
              return;
            }
            playback.onError(playheadRef.current);
          },
          onLoad: (value: OnLoadData) => {
            const resume = playback.onLoad();
            setLoadedLength({ uniqueId, seconds: Math.round(value.duration) });
            const pending = pendingAddRef.current?.uniqueId === uniqueId ? pendingAddRef.current : null;
            pendingAddRef.current = null;
            // A watched episode starts over: resuming at its end would end it at once and roll on to the next
            const saved = useWatchProgressStore.getState().progresses[uniqueId];
            const savedAt =
              saved && !saved.isCompleted && saved.currentTime < value.duration - RESTART_TAIL_SECONDS
                ? saved.currentTime
                : 0;
            const startAt = pending?.resumeAt ?? resume ?? savedAt;
            playheadRef.current = startAt;
            videoRef?.current?.seek(startAt);
            const addedTrack = pending && value.textTracks.find((track) => track.title === pending.title);
            if (addedTrack) setTextTrack(addedTrack);
          },

          subtitleStyle: { paddingBottom: 50, fontSize: 20, opacity: 0.8 },
        }}
        customVideoTracks={videoTracks}
        source={{
          uri: source,
          headers: sourceHeaders,
          textTracks: subtitleTracks
            ?.filter((track) => !isThumbnailTrack(track as { kind?: string; lang?: string }))
            .map((track, index) => {
              const uri = ('url' in track ? track.url : track.uri) || '';
              return {
                title:
                  ('title' in track ? track.title : undefined) ||
                  ('lang' in track ? track.lang : track.language) ||
                  'Untitled',
                language: (('lang' in track ? track.lang : track.language)?.toLowerCase() as ISO639_1) || 'en',
                type: 'type' in track ? track.type : subtitleType(uri),
                uri,
                index,
              };
            }),
          textTracksAllowChunklessPreparation: false,
          bufferConfig: {
            minBufferMs: 60000,
            maxBufferMs: 120000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000,
            backBufferDurationMs: 30000,
            maxHeapAllocationPercent: 0.25,
            cacheSizeMB: 512,
          },
        }}>
        <DefaultLayout
          title={title}
          titleProps={{ style: { width: windowWidth * 0.75 }, numberOfLines: 1 }}
          subtitle={[
            type !== TvType.MOVIE && `${seasonNumber ? `Season ${seasonNumber} ` : ''}Episode ${episodeNumber}`,
            localUri && 'Downloaded',
          ]
            .filter(Boolean)
            .join(' · ')}
          pinCaptionTrack={(track) => !!track.title && addedTrackTitles.has(track.title)}
          slots={{
            beforeCaptionTracks: isTV ? undefined : (
              <AddSubtitlesItem canSearch={canSearchSubtitles} onAddFile={addSubtitleFile} />
            ),
            beforeMenuItems: serverNames.length ? <ServerMenuItem current={rotation.attempt?.server} /> : undefined,
            menuViews: (
              <>
                <ServerMenuView
                  servers={serverNames}
                  current={rotation.attempt?.server}
                  failed={rotation.failed}
                  onPick={pickServer}
                />
                {!isTV && canSearchSubtitles && (
                  <AddSubtitlesViews onAddFile={addSubtitleFile} onSearch={searchSubtitles} />
                )}
              </>
            ),
            beforeTitle: (
              <BaseIconButton
                onTap={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                IconComponent={() => <MaterialIconsIcon name="arrow-back" size={26} color="white" />}
              />
            ),
            beforeMuteButton: (
              <BaseIconButton
                onTap={openEpisodes}
                IconComponent={() => <MaterialIconsIcon name="video-library" size={24} color="white" />}
              />
            ),
            beforeProgressBar: (
              <HUXStack>
                <View className="flex-1 w-full" />
                <SkipSlot skipTimes={skipTimes} upNext={upNext} onNext={handleNextEpisode} skipForward={skipForward} />
              </HUXStack>
            ),
            beforeCenterPlayButton: (
              <BaseIconButton
                onTap={handlePrevEpisode}
                IconComponent={() => (
                  <SkipPrevious size={30} color={hasPrev ? 'white' : 'rgba(255,255,255,0.5)'} className="mr-10" />
                )}
              />
            ),
            afterCenterPlayButton: (
              <BaseIconButton
                onTap={handleNextEpisode}
                IconComponent={() => (
                  <SkipNext size={30} color={hasNext ? 'white' : 'rgba(255,255,255,0.5)'} className="ml-10" />
                )}
              />
            ),
          }}
        />
        <PlayerOverlay skipTimes={skipTimes} upNext={upNext} onNext={handleNextEpisode} />
        <ServerLoadingOverlay
          loading={phase === 'loading'}
          label={
            localUri
              ? 'Loading the download'
              : `Loading ${rotation.attempt?.server ?? ''} · ${position} of ${rotation.order.length}`
          }
          notice={rotation.switched && rotation.attempt ? `Playing on ${rotation.attempt.server}` : undefined}
        />
        {/* The toolkit's ended flag outlives a source until the next one loads, so a new episode would otherwise
            count down to the one after it before it plays */}
        {upNext && phase === 'playing' && (
          <VideoPlayer.UpNext
            title={upNext.title ? `${upNext.label} · ${upNext.title}` : upNext.label}
            onPlayNext={handleNextEpisode}
          />
        )}
      </VideoPlayer>
      <PerfProfiler id="EpisodesPanel">
        <EpisodesPanel
          currentUniqueId={uniqueId}
          open={episodesOpen}
          onOpenChange={setEpisodesOpen}
          onSelect={openEpisode}
        />
      </PerfProfiler>
    </ThemedView>
  );
};

export default Watch;
