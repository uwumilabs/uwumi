import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FFmpegKit,
  FFmpegKitConfig,
  LogRedirectionStrategy,
  ReturnCode,
  type Statistics,
} from 'react-native-ffmpeg-kit';
import { persistStorage } from '@/hooks/stores/MMKV';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import { DOWNLOADS_DIR, fileUri, fsDirectory, fsFile } from '@/utils/files';
import { episodeNumber, episodeTitle, type EpisodeContext, type EpisodeItem } from '@/utils/episodes';
import { episodeWatchHref } from '@/utils/routes';
import type { PlayableSource } from '@/hooks/queries/watchQueries';
import { downloadArgs, failureReason, probeStream } from './ffmpeg';
import { isActive, type DownloadProgress, type EpisodeDownload } from './model';
import { deleteOutputFile, ensureDownloadsFolder, outputPathFor, relativeOutputFile, resolveOutputFile } from './files';
import { saveThumbnails } from './thumbnails';
import { showDownloadInNotification, startDownloadService, stopDownloadService } from './service';

/** One quality of an episode, as the episode actions sheet offers it */
export interface DownloadRequest {
  episode: EpisodeItem;
  context: EpisodeContext;
  showName?: string;
  season?: number;
  url: string;
  source?: PlayableSource;
}

const newDownload = ({ episode, context, showName, season, url, source }: DownloadRequest) => {
  const number = Number(episodeNumber(episode) ?? 1);
  return {
    url,
    headers: source?.headers,
    name: episodeTitle(episode, number),
    showName,
    showId: context.id,
    mediaType: context.mediaType,
    watchParams: episodeWatchHref(episode, context).params,
    season,
    episode: number,
    uniqueId: episode.uniqueId,
    episodeId: episode.id,
    externalSubtitles: source?.subtitles.length
      ? source.subtitles.map(({ title, language, uri }) => ({
          title: title || 'Unknown',
          language: language || 'en',
          uri,
        }))
      : undefined,
    thumbnailsVtt: source?.thumbnails,
  } satisfies Omit<EpisodeDownload, 'id' | 'status' | 'createdAt'>;
};

interface DownloadState {
  isInitialized: boolean;
  downloads: Record<string, EpisodeDownload>;
  /** Once per app start: the folders, and the records a killed app or a reload left behind. False if it failed */
  initialize: () => Promise<boolean>;
  /**
   * Downloads the episode, again if it failed or was cancelled. Resolves once FFmpeg runs, or with the failure
   * recorded on the download (a probe takes up to half a minute); it never throws, so read the status.
   */
  download: (request: DownloadRequest) => Promise<EpisodeDownload | undefined>;
  cancelDownload: (downloadId: string) => Promise<boolean>;
  removeDownload: (downloadId: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const NO_PROGRESS: DownloadProgress = {
  percentage: 0,
  currentTime: 0,
  totalDuration: 0,
  speed: 0,
  bitrate: 0,
  size: 0,
};
const THROTTLE_MS = 300;
const THROTTLE_PCT = 1;

let initializing: Promise<boolean> | undefined;

/** Finished downloads whose file is gone, e.g. deleted outside the app, so they stop counting as downloaded */
const findMissingDownloads = (downloads: EpisodeDownload[]) =>
  downloads
    .filter(
      ({ status, outputFile }) =>
        status === 'completed' && !!outputFile && !fsFile(resolveOutputFile(outputFile)).exists,
    )
    .map(({ id }) => id);

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => {
      const update = (id: string, patch: Partial<EpisodeDownload>) =>
        set((state) =>
          state.downloads[id] ? { downloads: { ...state.downloads, [id]: { ...state.downloads[id], ...patch } } } : {},
        );
      const anyActive = () => Object.values(get().downloads).some(({ status }) => isActive(status));
      // The service runs while a download does
      const syncService = async () => {
        if (!anyActive()) await stopDownloadService();
      };
      const lastProgress = new Map<string, { time: number; pct: number }>();

      const add = (episode: Omit<EpisodeDownload, 'id' | 'status' | 'createdAt'>) => {
        const id =
          episode.uniqueId ||
          episode.episodeId ||
          `${episode.name.replace(/[^a-zA-Z0-9]/g, '_')}_E${episode.episode}_${Date.now()}`;
        const existing = get().downloads[id];
        if (existing && isActive(existing.status)) return id;
        set((state) => ({
          downloads: { ...state.downloads, [id]: { ...episode, id, status: 'pending', createdAt: Date.now() } },
        }));
        return id;
      };

      const onStatistics = (id: string, duration: number) => (statistics: Statistics) => {
        const download = get().downloads[id];
        if (!download || download.sessionId !== statistics.getSessionId()) return;
        const currentTime = statistics.getTime() / 1000;
        const percentage = duration > 0 ? Math.min(Math.max(Math.round((currentTime / duration) * 100), 0), 100) : 0;
        const now = Date.now();
        const last = lastProgress.get(id);
        if (last && Math.abs(percentage - last.pct) < THROTTLE_PCT && now - last.time < THROTTLE_MS) return;
        lastProgress.set(id, { time: now, pct: percentage });
        update(id, {
          progress: {
            percentage,
            currentTime,
            totalDuration: duration,
            speed: statistics.getSpeed(),
            bitrate: statistics.getBitrate() * 1000,
            size: statistics.getSize() || (download.progress?.size ?? 0),
          },
        });
        showDownloadInNotification(get().downloads[id]);
      };

      const start = async (id: string) => {
        const download = get().downloads[id];
        if (!download || download.status === 'downloading') return;
        try {
          await startDownloadService(anyActive);
          // Cancelled or removed while the service started
          if (get().downloads[id]?.status !== 'pending') return void (await syncService());
          update(id, { status: 'downloading', progress: NO_PROGRESS, error: undefined, sessionId: undefined });
          await showDownloadInNotification(get().downloads[id]);

          let probed: Awaited<ReturnType<typeof probeStream>>;
          try {
            probed = await probeStream(download.url, download.headers);
          } catch (error) {
            const label = `${download.name}${download.season ? ` S${download.season}` : ''} E${download.episode}`;
            console.error(`❌ FFprobe failed for: ${label}`, error);
            // Not if it was cancelled or removed meanwhile
            if (get().downloads[id]?.status === 'downloading') {
              update(id, {
                status: 'failed',
                error: error instanceof Error ? error.message : 'FFprobe failed to analyze video stream',
              });
            }
            await syncService();
            return;
          }
          if (get().downloads[id]?.status !== 'downloading') return;

          const outputFile = outputPathFor(download);
          const { stream, persistent } = probed;
          const session = await FFmpegKit.executeWithArgumentsAsync(
            downloadArgs({ ...download, stream, persistent, outputFile }),
            async (completed) => {
              const returnCode = await completed.getReturnCode();
              lastProgress.delete(id);
              if (ReturnCode.isSuccess(returnCode)) {
                const file = fsFile(outputFile);
                if (file.exists) {
                  update(id, { status: 'completed', fileSize: file.size, completedAt: Date.now() });
                  // Best effort, after the download already counts as done
                  const finished = get().downloads[id];
                  if (finished?.outputFile) {
                    saveThumbnails(
                      { ...finished, outputFile: finished.outputFile },
                      stream.duration,
                      stream.videoTracks[0],
                    )
                      .then((thumbnailsFile) => update(id, { thumbnailsFile }))
                      .catch((error) => console.warn('No seek-preview sprites for this download:', error));
                  }
                } else {
                  console.error(`❌ Output file not found: ${outputFile}`);
                  update(id, { status: 'failed', error: 'Download completed but output file not found' });
                }
              } else if (ReturnCode.isCancel(returnCode)) {
                update(id, { status: 'cancelled' });
              } else {
                // Marked failed so it can be downloaded again; left as downloading, Download would be a no-op
                update(id, { status: 'failed', error: await failureReason(completed) });
              }
              await syncService();
            },
            undefined,
            onStatistics(id, stream.duration),
          );
          // Recorded now, not on completion, so removing an unfinished download also deletes its partial file
          update(id, { sessionId: session.getSessionId(), outputFile: relativeOutputFile(outputFile) });
        } catch (error) {
          update(id, { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
          await syncService();
        }
      };

      return {
        isInitialized: false,
        downloads: {},

        initialize: () => {
          initializing ??= (async () => {
            try {
              ensureDownloadsFolder(DOWNLOADS_DIR);
              // Progress comes from statistics, so FFmpeg's log lines stay native; sessions still keep them for
              // failureReason
              await FFmpegKitConfig.disableLogs();
              FFmpegKitConfig.setLogRedirectionStrategy(LogRedirectionStrategy.NEVER_PRINT_LOGS);

              // FFmpeg sessions outlive a JS reload (an OTA applied in-process, or dev), but their callbacks don't, and
              // a killed app leaves records stuck as downloading. Neither resumes, so stop the sessions and fail the
              // records: left as downloading, Download would be a no-op
              await FFmpegKit.cancel();
              const interrupted = Object.values(get().downloads).filter(({ status }) => isActive(status));
              for (const { outputFile } of interrupted) if (outputFile) deleteOutputFile(outputFile);

              const missing = findMissingDownloads(Object.values(get().downloads));
              set((state) => {
                const downloads = { ...state.downloads };
                for (const id of missing) delete downloads[id];
                for (const { id } of interrupted) {
                  downloads[id] = {
                    ...downloads[id],
                    status: 'failed',
                    error: 'Interrupted. Download it again',
                    outputFile: undefined,
                  };
                }
                return { downloads, isInitialized: true };
              });
              return true;
            } catch (error) {
              // Tried again by the next call, such as opening Downloads
              initializing = undefined;
              console.error('❌ Downloads init failed:', error);
              return false;
            }
          })();
          return initializing;
        },

        download: async (request) => {
          const id = add(newDownload(request));
          await start(id);
          return get().downloads[id];
        },

        cancelDownload: async (id) => {
          const download = get().downloads[id];
          if (!download) return false;
          try {
            if (download.sessionId) await FFmpegKit.cancel(download.sessionId);
            update(id, { status: 'cancelled' });
            await syncService();
            return true;
          } catch (error) {
            console.error('Cancel failed:', error);
            return false;
          }
        },

        removeDownload: async (id) => {
          const download = get().downloads[id];
          // Stop FFmpeg first so it isn't still writing the file about to be deleted
          if (download?.sessionId && download.status === 'downloading') {
            await FFmpegKit.cancel(download.sessionId).catch((err) =>
              console.error(`Failed to cancel session ${download.sessionId}:`, err),
            );
          }
          if (download?.outputFile) deleteOutputFile(download.outputFile);
          set((state) => {
            const { [id]: _, ...rest } = state.downloads;
            return { downloads: rest };
          });
          await syncService();
        },

        clearCompleted: async () => {
          const completed = Object.values(get().downloads).filter((d) => d.status === 'completed');
          for (const download of completed) if (download.outputFile) deleteOutputFile(download.outputFile);
          set((state) => ({
            downloads: Object.fromEntries(Object.entries(state.downloads).filter(([, d]) => d.status !== 'completed')),
          }));
          await syncService();
        },

        clearAll: async () => {
          const all = Object.values(get().downloads);
          await Promise.all(
            all
              .filter((d) => d.sessionId && d.status === 'downloading')
              .map((d) =>
                FFmpegKit.cancel(d.sessionId).catch((err) =>
                  console.error(`Failed to cancel session ${d.sessionId}:`, err),
                ),
              ),
          );
          for (const download of all) if (download.outputFile) deleteOutputFile(download.outputFile);
          set({ downloads: {} });
          await stopDownloadService();
        },
      };
    },
    {
      name: 'download-storage',
      storage: persistStorage,
      partialize: (state) => ({
        downloads: Object.fromEntries(
          Object.entries(state.downloads).map(([id, { progress: _progress, sessionId: _sessionId, ...download }]) => [
            id,
            { ...download, outputFile: download.outputFile || undefined },
          ]),
        ),
      }),
    },
  ),
);

export const useHasActiveDownloads = () =>
  useDownloadStore((state) => Object.values(state.downloads).some(({ status }) => isActive(status)));

export const useRemainingDownloadsCount = () =>
  useDownloadStore((state) => Object.values(state.downloads).filter(({ status }) => isActive(status)).length);

/** A finished download's file as a file:// URI, encoded, as players and content URIs expect */
export const downloadedFileUri = (download: EpisodeDownload | undefined) =>
  download?.status === 'completed' && download.outputFile ? fileUri(resolveOutputFile(download.outputFile)) : undefined;

export const useDownloadedFileUri = (uniqueId: string | undefined) =>
  useDownloadStore((state) => (uniqueId ? downloadedFileUri(state.downloads[uniqueId]) : undefined));

export const useDownloadedThumbnailsUri = (uniqueId: string | undefined) =>
  useDownloadStore((state) => {
    const thumbnailsFile = uniqueId ? state.downloads[uniqueId]?.thumbnailsFile : undefined;
    return thumbnailsFile ? fileUri(resolveOutputFile(thumbnailsFile)) : undefined;
  });

/**
 * With "Downloaded only" on, a test for whether a title has a finished download; null when it's off.
 * Downloads made before they carried a show id fall back to matching the title.
 */
export const useDownloadedOnlyFilter = () => {
  const enabled = usePreferencesStore((state) => state.downloadedOnly);
  // A string, so finishing more episodes of an already-downloaded show doesn't re-render
  const keys = useDownloadStore((state) =>
    enabled
      ? [
          ...new Set(
            Object.values(state.downloads)
              .filter(({ status }) => status === 'completed')
              .map(({ showId, showName }) => (showId ? `id:${showId}` : `title:${showName?.toLowerCase() ?? ''}`)),
          ),
        ]
          .sort()
          .join('\n')
      : '',
  );
  return useMemo(() => {
    if (!enabled) return null;
    const downloaded = new Set(keys.split('\n'));
    // Titles ignore case: providers often give the show's name in capitals
    return (id: string, title?: string) =>
      downloaded.has(`id:${id}`) || (!!title && downloaded.has(`title:${title.toLowerCase()}`));
  }, [enabled, keys]);
};

/**
 * What the downloads folder takes on disk, leftovers included; measured on each visit and whenever a download is
 * added, removed or changes status (finishing writes the file, cancelling and removing delete it)
 */
export const useDownloadsSize = () => {
  const isInitialized = useDownloadStore((state) => state.isInitialized);
  const statusKey = useDownloadStore((state) =>
    Object.values(state.downloads)
      .map(({ id, status }) => `${id}:${status}`)
      .sort()
      .join(','),
  );
  const { data } = useQuery({
    queryKey: ['downloads', 'size', statusKey],
    queryFn: () => fsDirectory(DOWNLOADS_DIR).size ?? 0,
    enabled: isInitialized,
    // Sprites written after a download completes change it without a new key
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
  });
  return data;
};
