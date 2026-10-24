import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Dimensions, View } from 'react-native';
import { ISO639_1, TextTrackType, OnLoadData } from 'react-native-video/src';
import { MediaType, SubtitleTrack, WatchSearchParams } from '@/constants/types';
import { IAnimeInfo, IEpisodeServer, ISubtitle, TvType } from 'react-native-consumet';
import { HUXStack, MaterialIconsIcon, ThemedView } from '@/components';
import {
  PlayerOverlay,
  SkipSlot,
  type UpNext,
  EpisodesPanel,
  AddSubtitlesItem,
  AddSubtitlesViews,
  ServerStatusScreen,
  ServerLoadingOverlay,
  ServerMenuItem,
  ServerMenuView,
  type ServerChip,
  type ServerPhase,
  type SubtitleLanguage,
  type SubtitleSearchResult,
} from './components';
import ProviderSelection from './components/ProviderSelection';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import {
  useEpisodesIdStore,
  useEpisodeList,
  useSkipTimes,
  getAdjacentEpisodes,
  buildEpisodeRouteParams,
  useWatchProgressStore,
  useEpisodeServers,
  useEpisodeSources,
  NoSourcesError,
  useServerRotation,
  useLastServerStore,
  lastServerKey,
  type EpisodeTarget,
  useExternalSubtitles,
  externalSubtitlesQuery,
  canSearchExternalSubtitles,
  useBackHandler,
  useMediaInfo,
  useContinueWatchingStore,
  useExternalSubtitleStore,
  type EpisodeItem,
} from '@/hooks';
import { useToast } from 'heroui-native';
import * as DocumentPicker from 'expo-document-picker';
import { useActiveProvider, useProviders, META_PROVIDERS } from '@/constants/provider';
import { constants } from '@/constants/config';
import { isTV } from '@/constants/utils';
import { PerfProfiler, PerfRun } from '@/perf/perfHarness';
import { useEmbedMode, useProviderSelectionStore } from './components';
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

// Providers often leave out a subtitle's type (NetflixMirror sends .srt), and ExoPlayer fails the whole source
// when a track doesn't parse as the type it's given
const subtitleType = (uri: string) => {
  const path = uri.split(/[?#]/)[0].toLowerCase();
  if (path.endsWith('.srt')) return TextTrackType.SUBRIP;
  if (path.endsWith('.ttml') || path.endsWith('.dfxp')) return TextTrackType.TTML;
  return TextTrackType.VTT;
};

const EMPTY_SERVERS: IEpisodeServer[] = [];
// A failure after this much playback is a broken stream rather than a bad server, so that server gets one reload
const MID_PLAYBACK_MS = 10_000;

const Watch = () => {
  const router = useRouter();
  const watchParams = useLocalSearchParams() as unknown as WatchSearchParams;
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
  } = watchParams;
  // console.log(useLocalSearchParams(), 'useLocalSearchParams');
  const setProgress = useWatchProgressStore((state) => state.setProgress);
  const getProgress = useWatchProgressStore((state) => state.getProgress);
  const currentProvider = useActiveProvider(mediaType);
  const { data: mediaInfo, isLoading: mediaInfoLoading } = useMediaInfo();
  const recordContinueWatching = useContinueWatchingStore((state) => state.record);
  const { toast } = useToast();
  const fullscreen = useVideoSelector((state) => state.fullscreen);
  const videoRef = useVideoSelector((state) => state.videoRef);
  const isPlaying = useVideoSelector((state) => state.isPlaying);
  const { enterFullscreen, exitFullscreen } = useFullscreen();
  const navigation = useNavigation();
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const openEpisodes = useCallback(() => setEpisodesOpen(true), []);
  const closeEpisodes = useCallback(() => setEpisodesOpen(false), []);

  const setEpisodeIds = useEpisodesIdStore((state) => state.setEpisodeIds);
  const currentEpisodeId = useEpisodesIdStore((state) => state.currentEpisodeId);
  const currentUniqueId = useEpisodesIdStore((state) => state.currentUniqueId);

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
  const missingOnProvider = switchedProvider && !episodesLoading && !activeEpisodeId;
  const providers = useProviders();
  const uniqueId = listedEpisode?.uniqueId ?? routeUniqueId;
  const episodeNumber = listedEpisode?.number !== undefined ? String(listedEpisode.number) : routeEpisodeNumber;
  const adjacentEpisodes = useMemo(
    () => getAdjacentEpisodes(allEpisodes, currentUniqueId || uniqueId),
    [allEpisodes, currentUniqueId, uniqueId],
  );
  const playingSeason =
    movieSeasons?.findIndex((season) => season.episodes?.some((episode) => episode.uniqueId === uniqueId)) ?? -1;

  const { prevEpisode, nextEpisode, hasPrev, hasNext } = adjacentEpisodes;

  // Keyed by episode, so the next episode doesn't query skip times with this one's length
  const [loadedLength, setLoadedLength] = useState<{ uniqueId?: string; seconds: number }>({ seconds: 0 });
  const malId = (mediaInfo as IAnimeInfo | undefined)?.malId;
  const { data: skipTimes = [], isFetched: skipTimesFetched } = useSkipTimes({
    malId,
    episodeNumber,
    episodeLength: loadedLength.uniqueId === uniqueId ? loadedLength.seconds : 0,
    enabled: mediaType === MediaType.ANIME,
  });
  // AniSkip has no times for many new episodes, and can't be asked without a MAL id
  const skipForward =
    mediaType === MediaType.ANIME && skipTimes.length === 0 && (skipTimesFetched || (!!mediaInfo && !malId));
  const upNext = useMemo<UpNext | undefined>(
    () =>
      nextEpisode
        ? { label: `EP ${nextEpisode.number ?? nextEpisode.episode ?? ''}`.trim(), title: nextEpisode.title }
        : undefined,
    [nextEpisode],
  );

  // Navigation context for building route params
  const navigationContext = useMemo(
    () => ({
      mediaType,
      provider: currentProvider ?? provider,
      id,
      mediaId: providerMediaId ?? mediaId,
      type: type as string,
    }),
    [mediaType, provider, id, mediaId, providerMediaId, type, currentProvider],
  );

  const openEpisode = useCallback(
    (episode: EpisodeItem | null) => {
      const routeParams = buildEpisodeRouteParams(episode, navigationContext);
      if (!routeParams) {
        toast.show({ variant: 'danger', label: 'Unable to navigate', description: 'Episode data is invalid' });
        return;
      }
      router.replace({ pathname: '/watch/[mediaType]', params: routeParams });
    },
    [navigationContext, router, toast],
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
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (event.data.action.type === 'REPLACE') return;
        leavingRef.current = true;
        exitFullscreen();
      }),
    [navigation, exitFullscreen],
  );

  useFocusEffect(
    useCallback(() => {
      if (episodeId && uniqueId) {
        setEpisodeIds(episodeId, uniqueId);
      }
      if (playingSeason >= 0) setSeason(playingSeason);
      return () => {
        setEpisodeIds('', '');
      };
    }, [uniqueId, episodeId, setEpisodeIds, playingSeason, setSeason]),
  );

  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('screen').width,
    height: Dimensions.get('screen').height,
  });
  const dub = useProviderSelectionStore((state) => state.dub);
  const isEmbed = useEmbedMode(mediaType, currentProvider);
  const sourceEpisodeId = activeEpisodeId || (switchedProvider ? '' : (currentEpisodeId as string)) || '';
  const target = useMemo<EpisodeTarget>(
    () =>
      mediaType === MediaType.ANIME
        ? { mediaType, provider: currentProvider, episodeId: sourceEpisodeId, dub }
        : {
            mediaType,
            provider: currentProvider,
            episodeId: sourceEpisodeId,
            mediaId: activeMediaId ?? '',
            embed: isEmbed,
          },
    [mediaType, currentProvider, sourceEpisodeId, dub, activeMediaId, isEmbed],
  );
  const rotationKey = useMemo(() => JSON.stringify(target), [target]);
  // A switched provider's list has to load before its episode id is known
  const waitingForList = switchedProvider && episodesLoading;
  const serversQuery = useEpisodeServers(target, !waitingForList);
  const serverNames = useMemo(
    () => (serversQuery.data ?? EMPTY_SERVERS).map((server) => server.name),
    [serversQuery.data],
  );
  const providerServerKey = lastServerKey(mediaType, currentProvider);
  const rememberedServer = useLastServerStore((state) => state.servers[providerServerKey]);
  const rememberServer = useLastServerStore((state) => state.remember);
  const rotation = useServerRotation(rotationKey, serversQuery.data ?? EMPTY_SERVERS, rememberedServer);
  const sourcesQuery = useEpisodeSources(target, rotation.server, rotation.attemptKey);
  // Recorded while rendering: the query is keyed by the attempt, so this error is the current server's
  if (sourcesQuery.isError && rotation.attempt && !rotation.failed[rotation.attempt.server]) {
    rotation.fail(rotation.attempt, sourcesQuery.error instanceof NoSourcesError ? 'no-video' : 'unavailable');
  }

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
    enabled: wantsExternalSubtitles,
  });

  const data = sourcesQuery.data;
  // New text tracks would reload the source, so the player waits for external subtitles, which give up quickly
  const waitingForSubtitles = wantsExternalSubtitles && (mediaInfoLoading || externalSubtitlesLoading);

  useBackHandler(episodesOpen, () => {
    setEpisodesOpen(false);
    return true;
  });

  const lastProgressUpdateRef = useRef({ currentTime: 0, seekableDuration: 0 });
  const recordedEpisodeRef = useRef<string | null>(null);
  const savedBucketRef = useRef('');
  // Where a reload or the next server picks up, when the failed one had been playing
  const resumeRef = useRef<{ uniqueId?: string; at: number } | null>(null);
  const loadedAtRef = useRef(0);
  const [loadedAttempt, setLoadedAttempt] = useState<string | null>(null);

  // Keyed by episode, like loadedLength, so a file added to one episode doesn't carry over to the next
  const [addedSubtitles, setAddedSubtitles] = useState<{ uniqueId?: string; tracks: SubtitleTrack[] }>({
    tracks: [],
  });
  // Adding tracks reloads the source, so onLoad resumes where it was and turns the first new track on
  const pendingAddRef = useRef<{ uniqueId?: string; resumeAt: number; title?: string } | null>(null);
  const { textTracks: playerTextTracks, setTextTrack } = useSettings();
  const queryClient = useQueryClient();

  // Puts this show at the front of Continue watching; the store keeps an earlier title and image if info hasn't loaded
  const rememberEpisode = useCallback(() => {
    const info = mediaInfo;
    const showTitle = info
      ? typeof info.title === 'string'
        ? info.title
        : info.title?.romaji || info.title?.english
      : undefined;
    const showImage = info?.image;
    const params = {
      ...Object.fromEntries(
        Object.entries(watchParams).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '',
        ),
      ),
      ...(uniqueId && { uniqueId }),
      ...(episodeNumber && { episodeNumber }),
      // Resumes on the provider it was switched to
      ...(switchedProvider &&
        activeEpisodeId && {
          provider: currentProvider,
          episodeId: activeEpisodeId,
          ...(activeMediaId && { mediaId: activeMediaId }),
        }),
    };
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
      watchParams: params,
      infoParams: {
        mediaType,
        id,
        provider: currentProvider ?? provider,
        metaProvider: META_PROVIDERS[mediaType],
        ...(type && { type: type as string }),
        ...(showTitle && { title: showTitle }),
        ...(showImage && { image: showImage }),
      },
    });
  }, [
    mediaInfo,
    id,
    watchParams,
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
    provider,
    type,
  ]);

  const handleProgress = useCallback(
    ({ currentTime: newTime, seekableDuration: newDuration }: { currentTime: number; seekableDuration: number }) => {
      // Only update state if the time has changed by at least 0.5 seconds to prevent excessive re-renders
      const lastUpdate = lastProgressUpdateRef.current;
      if (Math.abs(newTime - lastUpdate.currentTime) >= 0.5) {
        // setCurrentTime(newTime);
        lastUpdate.currentTime = newTime;
      }
      if (Math.abs(newDuration - lastUpdate.seekableDuration) >= 0.5) {
        // setSeekableDuration(newDuration);
        lastUpdate.seekableDuration = newDuration;
      }

      // Save every 5 seconds: progress events come every 250 ms, so once per 5 s bucket, not on each event in it
      const bucket = `${uniqueId}:${Math.floor(newTime / 5)}`;
      if (uniqueId && newDuration > 0 && savedBucketRef.current !== bucket) {
        savedBucketRef.current = bucket;
        const savedProgress = getProgress(uniqueId);
        const progress = (newTime / newDuration) * 100;
        if (!savedProgress || newTime > (savedProgress.currentTime ?? 0)) {
          setProgress(uniqueId, { currentTime: newTime, duration: newDuration, progress });
        }
        // Again on finishing, by when the episode list (and so whether there's a next one) has loaded
        const recordKey = `${uniqueId}:${progress >= constants.PROGRESS_COMPLETION_PERCENTAGE}`;
        if (recordedEpisodeRef.current !== recordKey) {
          recordedEpisodeRef.current = recordKey;
          rememberEpisode();
        }
      }
    },
    [uniqueId, getProgress, setProgress, rememberEpisode],
  );

  const videoTracks = useMemo(() => {
    if (!data?.sources || data.sources.length === 0) return undefined;
    const tracks: CustomVideoTrack[] = [];
    data.sources.forEach((track, index) => {
      if (track?.url) {
        const qualityStr = track.quality?.toLowerCase() || '';
        const match = qualityStr.match(/(\d{3,4})p/);
        const height = match ? Number(match[1]) : qualityStr === 'auto' || qualityStr === 'default' ? 9999 : 0;
        tracks.push({
          index,
          height,
          label: qualityStr === 'auto' || qualityStr === 'default' ? 'Auto' : qualityStr.toUpperCase(),
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

  const source = useMemo(() => {
    return (
      data?.sources?.[0]?.url ||
      data?.sources?.find((s) => s.quality === 'auto' || s.quality === 'default')?.url ||
      data?.sources?.[0]?.url ||
      ''
    );
  }, [data]);

  const sourceHeaders = useMemo<Record<string, string> | undefined>(() => {
    const h = data?.headers;
    if (!h || typeof h !== 'object') return undefined;
    // Flatten to Record<string, string>, dropping any non-string values
    return Object.fromEntries(Object.entries(h).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
  }, [data?.headers]);

  // const gestures = Gesture.Exclusive(doubleTapGesture, brightnessVolumeGesture, singleTapGesture);

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
      pendingAddRef.current = { uniqueId, resumeAt: lastProgressUpdateRef.current.currentTime, title: fresh[0].title };
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
    if (!/\.(srt|vtt|ttml|dfxp)$/i.test(file.name)) {
      toast.show({ variant: 'danger', label: 'Not a subtitle file', description: 'Pick an .srt, .vtt or .ttml file.' });
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

  const phase: ServerPhase | 'loading' | 'playing' = missingOnProvider
    ? 'missing'
    : serversQuery.isError
      ? 'unavailable'
      : rotation.exhausted
        ? 'exhausted'
        : !source || waitingForList || waitingForSubtitles
          ? 'finding'
          : loadedAttempt === rotation.attemptKey
            ? 'playing'
            : 'loading';

  const providerName = providers[mediaType]?.find(({ value }) => value === currentProvider)?.name ?? currentProvider;
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
  const { attemptKey, pick } = rotation;
  const pickServer = useCallback(
    (name: string) => {
      if (loadedAttempt === attemptKey) resumeRef.current = { uniqueId, at: lastProgressUpdateRef.current.currentTime };
      pick(name);
    },
    [loadedAttempt, attemptKey, pick, uniqueId],
  );

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
          changeProvider={<ProviderSelection mediaType={mediaType} isDubbed={watchParams.isDubbed} />}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView
      useStatusBar={false}
      useSafeArea
      onLayout={(e) => {
        setDimensions({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        });
      }}
      style={{
        top: 0,
      }}>
      <PerfRun />
      <VideoPlayer
        // A fresh native player per attempt: a failed one can't deliver late events to the next
        key={`${activeEpisodeId || (currentEpisodeId as string) || 'video'}|${rotation.attemptKey}`}
        gestureProps={{ onSwipeUp: openEpisodes, onSwipeDown: closeEpisodes, onSingleTap: closeEpisodes }}
        videoProps={{
          resizeMode: 'contain',
          poster: { source: { uri: poster }, resizeMode: 'contain' },
          onProgress: handleProgress,
          reportBandwidth: true,
          automaticallyWaitsToMinimizeStalling: true,
          preventsDisplaySleepDuringVideoPlayback: true,
          allowsEaxternalPlayback: true,
          mixWithOthers: 'mix',
          enterPictureInPictureOnLeave: !isTV && isPlaying,
          onError: () => {
            const attempt = rotation.attempt;
            if (!attempt) return;
            const loaded = loadedAttempt === rotation.attemptKey;
            if (loaded) resumeRef.current = { uniqueId, at: lastProgressUpdateRef.current.currentTime };
            if (loaded && attempt.reloads === 0 && Date.now() - loadedAtRef.current > MID_PLAYBACK_MS) {
              rotation.reload(attempt);
            } else {
              rotation.fail(attempt, 'playback');
            }
          },
          onLoad: (value: OnLoadData) => {
            setLoadedAttempt(rotation.attemptKey);
            loadedAtRef.current = Date.now();
            if (rotation.attempt) rememberServer(providerServerKey, rotation.attempt.server);
            setLoadedLength({ uniqueId, seconds: Math.round(value.duration) });
            const pending = pendingAddRef.current?.uniqueId === uniqueId ? pendingAddRef.current : null;
            pendingAddRef.current = null;
            const resume = resumeRef.current?.uniqueId === uniqueId ? resumeRef.current.at : undefined;
            resumeRef.current = null;
            const startAt = pending?.resumeAt ?? resume ?? (getProgress(uniqueId)?.currentTime || 0);
            lastProgressUpdateRef.current.currentTime = startAt;
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
            // @ts-ignore
            ?.filter((track) => track.kind !== 'thumbnails' && track.lang !== 'thumbnails')
            .map((track, index) => {
              const uri = ('url' in track ? track.url : track.uri) || '';
              return {
                title:
                  ('title' in track ? track.title : undefined) ||
                  ('lang' in track ? track.lang : track.language) ||
                  'Untitled',
                language: (('lang' in track ? track.lang : track.language)?.toLowerCase() as ISO639_1) || 'en',
                type: 'type' in track && track.type !== 'application/x-media-cues' ? track.type : subtitleType(uri),
                uri,
                index,
              };
            }),
          textTracksAllowChunklessPreparation: false,
          bufferConfig: {
            minBufferMs: 85000, // 85s minimum buffer (VLC-like for smooth seeking)
            maxBufferMs: 120000, // 120s maximum buffer (prevents excessive memory usage)
            bufferForPlaybackMs: 2500, // 2.5s initial buffer before playback starts
            bufferForPlaybackAfterRebufferMs: 5000, // 5s buffer after rebuffering for stability
            backBufferDurationMs: 120000, // Keep 120s of back buffer for smooth seeking backwards
            maxHeapAllocationPercent: 0.25, // Use max 25% of heap for buffering
            cacheSizeMB: 512, // 512MB cache size for better performance
          },
        }}>
        <DefaultLayout
          title={title}
          titleProps={{ style: { width: dimensions.width * 0.75 }, numberOfLines: 1 }}
          subtitle={
            type !== TvType.MOVIE ? `${seasonNumber ? `Season ${seasonNumber}` : ''} Episode ${episodeNumber}` : ''
          }
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
                {/* This view is just to take the whole space */}
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
          label={`Loading ${rotation.attempt?.server ?? ''} · ${position} of ${rotation.order.length}`}
        />
        <PlayerOverlay skipTimes={skipTimes} upNext={upNext} onNext={handleNextEpisode} />
        <ServerLoadingOverlay
          loading={phase === 'loading'}
          label={`Loading ${rotation.attempt?.server ?? ''} · ${position} of ${rotation.order.length}`}
          notice={rotation.switched && rotation.attempt ? `Playing on ${rotation.attempt.server}` : undefined}
        />
        {upNext && (
          <VideoPlayer.UpNext
            title={upNext.title ? `${upNext.label} · ${upNext.title}` : upNext.label}
            onPlayNext={handleNextEpisode}
          />
        )}
      </VideoPlayer>
      <PerfProfiler id="EpisodesPanel">
        <EpisodesPanel open={episodesOpen} onOpenChange={setEpisodesOpen} onSelect={openEpisode} />
      </PerfProfiler>
    </ThemedView>
  );
};

export default Watch;
