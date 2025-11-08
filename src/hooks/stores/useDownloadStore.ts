import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { FFmpegKit, FFprobeKit, Log, ReturnCode } from 'react-native-ffmpeg-kit';
import type { VideoTrack, AudioTrack, TextTrack, TextTracks } from 'react-native-video';
import BackgroundService from 'react-native-background-actions';
import { storage } from './MMKV';
import { UWUMI_DIR } from '@/constants/config';

const DOWNLOADS_DIR = `${UWUMI_DIR}/downloads`; // Downloaded episodes
const TEMP_DIR = `${RNFS.CachesDirectoryPath}/ffmpeg_temp`; // Temporary FFmpeg files

// Types

interface StreamInfo {
  duration: number;
  videoTracks: VideoTrack[];
  audioTracks: AudioTrack[];
  textTracks: TextTrack[];
  totalStreams: number;
  rawInfo?: any;
}

interface DownloadProgress {
  percentage: number;
  currentTime: number;
  totalDuration: number;
  speed: number;
  bitrate: number;
  size: number;
}

interface EpisodeDownload {
  id: string;
  url: string;
  name: string;
  showName?: string;
  episode: number;
  season?: number;
  uniqueId?: string; // Episode unique ID from provider
  episodeId?: string; // Fallback episode ID
  externalSubtitles?: TextTracks;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress?: DownloadProgress;
  outputFile?: string;
  fileSize?: number;
  sessionId?: number;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

interface DownloadState {
  // State
  isInitialized: boolean;
  downloads: Record<string, EpisodeDownload>;
  activeSessionIds: Set<number>;
  isBackgroundServiceRunning: boolean;

  // Actions
  initialize: () => Promise<boolean>;
  addDownload: (episode: Omit<EpisodeDownload, 'id' | 'status' | 'createdAt'>) => string;
  startDownload: (downloadId: string, onProgress?: (progress: DownloadProgress) => void) => Promise<void>;
  cancelDownload: (downloadId: string) => Promise<boolean>;
  cancelAllDownloads: () => Promise<void>;
  removeDownload: (downloadId: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  clearAll: () => Promise<void>;
  getStreamInfo: (url: string) => Promise<StreamInfo>;
  downloadQueue: (
    episodes: Omit<EpisodeDownload, 'id' | 'status' | 'createdAt'>[],
    onQueueProgress?: (progress: any) => void,
  ) => Promise<void>;
  getStorageInfo: () => Promise<{
    downloadsPath: string;
    tempPath: string;
    downloadsSize: number;
    totalDownloads: number;
  }>;
  cleanupTempFiles: () => Promise<void>;
  startBackgroundService: () => Promise<void>;
  stopBackgroundService: () => Promise<void>;
  updateBackgroundNotification: (downloadId: string) => Promise<void>;
}

// Helper Functions
const ensureDir = async (directory: string): Promise<boolean> => {
  try {
    const exists = await RNFS.exists(directory);
    if (!exists) {
      await RNFS.mkdir(directory, { NSURLIsExcludedFromBackupKey: true });
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to create directory ${directory}:`, error);
    return false;
  }
};

// Helper to parse time from FFmpeg output like "00:02:50.73" to seconds
const parseFFmpegTime = (timeStr: string): number => {
  const match = timeStr.match(/(\d+):(\d+):(\d+\.?\d*)/);
  if (!match) return 0;
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseFloat(match[3]);
  return hours * 3600 + minutes * 60 + seconds;
};

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      // Initial state
      isInitialized: false,
      downloads: {},
      activeSessionIds: new Set(),
      isBackgroundServiceRunning: false,

      // Initialize FFmpeg Kit and directories
      initialize: async () => {
        const state = get();
        if (state.isInitialized) return true;

        try {
          // Create directories in internal storage
          await ensureDir(UWUMI_DIR);
          await ensureDir(DOWNLOADS_DIR);
          await ensureDir(TEMP_DIR);

          set({ isInitialized: true });
          // console.log('✅ FFmpeg Kit initialized');
          // console.log('📁 Storage locations:');
          // console.log('   Downloads:', DOWNLOADS_DIR);
          // console.log('   Temp:', TEMP_DIR);
          return true;
        } catch (error) {
          console.error('❌ FFmpeg init failed:', error);
          throw error;
        }
      },

      // Add download to queue
      addDownload: (episode) => {
        const state = get();

        // Use uniqueId or episodeId as the download ID, fallback to generated ID
        const downloadId =
          episode.uniqueId ||
          episode.episodeId ||
          `${episode.name.replace(/[^a-zA-Z0-9]/g, '_')}_E${episode.episode}_${Date.now()}`;

        // Check if this episode already exists (by ID)
        const existingDownload = state.downloads[downloadId];

        if (existingDownload) {
          // If already downloading or pending, return existing ID
          if (existingDownload.status === 'downloading' || existingDownload.status === 'pending') {
            // console.log(
            //   `⚠️ Episode already in queue: ${episode.name}${episode.season ? ` S${episode.season}` : ''} E${episode.episode}`,
            // );
            return existingDownload.id;
          }

          // If failed/cancelled/completed, update it to pending (re-download)
          // console.log(
          //   `♻️ Re-queueing episode: ${episode.name}${episode.season ? ` S${episode.season}` : ''} E${episode.episode}`,
          // );
          set((state) => ({
            downloads: {
              ...state.downloads,
              [downloadId]: {
                ...episode,
                id: downloadId,
                status: 'pending',
                createdAt: Date.now(),
                error: undefined,
                progress: undefined,
                sessionId: undefined,
              },
            },
          }));
          return downloadId;
        }

        // New download
        const download: EpisodeDownload = {
          ...episode,
          id: downloadId,
          status: 'pending',
          createdAt: Date.now(),
        };

        set((state) => ({
          downloads: {
            ...state.downloads,
            [downloadId]: download,
          },
        }));

        return downloadId;
      },

      // Start download
      startDownload: async (downloadId, onProgress) => {
        const state = get();
        const download = state.downloads[downloadId];

        if (!download || download.status === 'downloading') return;

        try {
          // Start background service if not already running
          await get().startBackgroundService();

          // Update status with initial progress
          set((state) => ({
            downloads: {
              ...state.downloads,
              [downloadId]: {
                ...download,
                status: 'downloading',
                progress: {
                  percentage: 0,
                  currentTime: 0,
                  totalDuration: 0,
                  speed: 0,
                  bitrate: 0,
                  size: 0,
                },
              },
            },
          }));

          // Update notification
          await get().updateBackgroundNotification(downloadId);

          // Get stream info
          let streamInfo;
          try {
            streamInfo = await get().getStreamInfo(download.url);
          } catch (streamError) {
            console.error(
              `❌ FFprobe failed for: ${download.name}${download.season ? ` S${download.season}` : ''} E${download.episode}`,
              streamError,
            );
            set((state) => ({
              downloads: {
                ...state.downloads,
                [downloadId]: {
                  ...state.downloads[downloadId],
                  status: 'failed',
                  error: streamError instanceof Error ? streamError.message : 'FFprobe failed to analyze video stream',
                },
              },
            }));

            // Stop background service if no more downloads
            const hasActiveDownloads = Object.values(get().downloads).some((d) => d.status === 'downloading');
            if (!hasActiveDownloads) {
              await get().stopBackgroundService();
            }
            return;
          }

          // Prepare output file path with show directory structure
          let showDir = DOWNLOADS_DIR;

          // Create show-specific directory if showName is provided
          if (download.showName) {
            const sanitizedShowName = download.showName;
            showDir = `${DOWNLOADS_DIR}/${sanitizedShowName}`;
            await ensureDir(showDir);
          }

          const filename = `${download.name}${download.season ? `_S${download.season}` : ''}_E${download.episode}.mp4`;
          const outputFile = `${showDir}/${filename}`;

          // Build FFmpeg command - Download ALL tracks with best subtitle codec
          // -map 0:v:0 = First video track
          // -map 0:a = All audio tracks
          // -map 0:s? = All subtitle tracks from main input (? = optional, won't fail if none exist)
          // -c:v copy = Copy video codec (no re-encoding)
          // -c:a copy = Copy audio codec (no re-encoding)
          // -c:s mov_text = Best subtitle codec for MP4 (supports styling, not burned in)
          const commandParts = ['-i', download.url];

          // Add external subtitle inputs
          if (download.externalSubtitles && download.externalSubtitles.length > 0) {
            download.externalSubtitles.forEach((sub) => {
              commandParts.push('-i', sub.uri);
            });
          }

          // Map video and audio from main input
          commandParts.push('-map', '0:v:0', '-map', '0:a');

          // Map subtitles from main input
          commandParts.push('-map', '0:s?');

          // Map external subtitles if any
          if (download.externalSubtitles && download.externalSubtitles.length > 0) {
            download.externalSubtitles.forEach((_, index) => {
              commandParts.push('-map', `${index + 1}:s?`);
            });
          }

          // Codec settings
          commandParts.push('-c:v', 'copy', '-c:a', 'copy', '-c:s', 'mov_text', '-bsf:a', 'aac_adtstoasc');

          // Add metadata for external subtitles (properly escaped)
          if (download.externalSubtitles && download.externalSubtitles.length > 0) {
            download.externalSubtitles.forEach((sub, index) => {
              const streamIndex = (streamInfo.textTracks?.length || 0) + index;
              if (sub.language) {
                commandParts.push('-metadata:s:s:' + streamIndex, 'language=' + sub.language);
              }
              if (sub.title) {
                // Escape special characters and wrap values with spaces in quotes
                const needsQuotes = sub.title.includes(' ') || sub.title.includes('"');
                const escapedTitle = sub.title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                commandParts.push(
                  '-metadata:s:s:' + streamIndex,
                  needsQuotes ? `"title=${escapedTitle}"` : `title=${escapedTitle}`,
                );
              }
            });
          }

          commandParts.push('-threads', '4', '-y', outputFile);

          // Join command parts - wrap items with spaces in quotes
          const command = commandParts
            .map((part) => {
              if (part.includes(' ') && !part.startsWith('"')) {
                return `"${part}"`;
              }
              return part;
            })
            .join(' ');

          // Total duration for percentage calc
          const totalDuration = streamInfo.duration;

          const handleSessionLog = (log: Log) => {
            const logSessionId = log.getSessionId?.();
            const message = log.getMessage();

            // Parse progress from FFmpeg output: "time=00:02:50.73 bitrate= 896.7kbits/s speed=4.66x"
            const timeMatch = message.match(/time=(\d+:\d+:\d+\.?\d*)/);
            const bitrateMatch = message.match(/bitrate=\s*([\d.]+)kbits\/s/);
            const speedMatch = message.match(/speed=([\d.]+)x/);
            const sizeMatch = message.match(/size=\s*(\d+)kB/);

            if (timeMatch) {
              const currentState = get();

              // Find which download this session belongs to
              const downloadEntry = Object.entries(currentState.downloads).find(
                ([_, d]) => d.sessionId === logSessionId,
              );

              if (downloadEntry) {
                const [dlId, dl] = downloadEntry;

                const currentTime = parseFFmpegTime(timeMatch[1]);
                const percentage =
                  totalDuration > 0
                    ? Math.min(Math.max(Math.round((currentTime / totalDuration) * 100), 0), 100)
                    : (dl.progress?.percentage ?? 0);

                const progress: DownloadProgress = {
                  percentage,
                  currentTime,
                  totalDuration,
                  speed: speedMatch ? parseFloat(speedMatch[1]) : 0,
                  bitrate: bitrateMatch ? parseFloat(bitrateMatch[1]) * 1000 : 0, // Convert to bits/s
                  size: sizeMatch ? parseInt(sizeMatch[1]) * 1024 : (dl.progress?.size ?? 0), // Convert to bytes
                };

                // Log progress to console
                const timeStr = `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60)
                  .toString()
                  .padStart(2, '0')}`;
                const totalStr =
                  totalDuration > 0
                    ? `${Math.floor(totalDuration / 60)}:${Math.floor(totalDuration % 60)
                        .toString()
                        .padStart(2, '0')}`
                    : '??:??';
                const sizeStr = `${(progress.size / 1024 / 1024).toFixed(2)} MB`;
                const bitrateStr = `${(progress.bitrate / 1000).toFixed(0)} kbps`;

                // console.log(
                //   `📥 ${dl.name}${dl.season ? ` S${dl.season}` : ''} E${dl.episode} | ${percentage}% | ${timeStr}/${totalStr} | ${sizeStr} | ${bitrateStr} | Speed: ${progress.speed.toFixed(2)}x`,
                // );

                // Update state with new object to ensure re-render
                set(() => ({
                  downloads: {
                    ...get().downloads,
                    [dlId]: {
                      ...get().downloads[dlId],
                      progress: { ...progress }, // Create new progress object reference
                    },
                  },
                }));

                // Update background notification
                get().updateBackgroundNotification(dlId);

                // Call callback for THIS download
                if (dlId === downloadId && onProgress) {
                  onProgress(progress);
                }
              }
            }
          };

          // Execute asynchronously with completion callback for real-time progress
          const session = await FFmpegKit.executeAsync(
            command,
            async (completedSession) => {
              const returnCode = await completedSession.getReturnCode();
              const sessionId = completedSession.getSessionId();

              // Check result
              if (ReturnCode.isSuccess(returnCode)) {
                const fileExists = await RNFS.exists(outputFile);
                if (fileExists) {
                  const fileStat = await RNFS.stat(outputFile);
                  // console.log(
                  //   `✅ Download completed: ${download.name}${download.season ? ` S${download.season}` : ''} E${download.episode}`,
                  // );
                  set((state) => ({
                    downloads: {
                      ...state.downloads,
                      [downloadId]: {
                        ...state.downloads[downloadId],
                        status: 'completed',
                        outputFile,
                        fileSize: Number(fileStat.size),
                        completedAt: Date.now(),
                      },
                    },
                    activeSessionIds: new Set([...state.activeSessionIds].filter((id) => id !== sessionId)),
                  }));
                } else {
                  console.error(`❌ Output file not found: ${outputFile}`);
                  set((state) => ({
                    downloads: {
                      ...state.downloads,
                      [downloadId]: {
                        ...state.downloads[downloadId],
                        status: 'failed',
                        error: 'Download completed but output file not found',
                      },
                    },
                    activeSessionIds: new Set([...state.activeSessionIds].filter((id) => id !== sessionId)),
                  }));
                }
              } else if (ReturnCode.isCancel(returnCode)) {
                // console.log(
                //   `🚫 Download cancelled: ${download.name}${download.season ? ` S${download.season}` : ''} E${download.episode}`,
                // );
                set((state) => ({
                  downloads: {
                    ...state.downloads,
                    [downloadId]: {
                      ...state.downloads[downloadId],
                      status: 'cancelled',
                    },
                  },
                  activeSessionIds: new Set([...state.activeSessionIds].filter((id) => id !== sessionId)),
                }));
              } /*else {
                // Failed
                console.error(`❌ FFmpeg failed with return code: ${returnCode}`);
                set((state) => ({
                  downloads: {
                    ...state.downloads,
                    [downloadId]: {
                      ...state.downloads[downloadId],
                      status: 'failed',
                      error: `FFmpeg failed with return code: ${returnCode}`,
                    },
                  },
                  activeSessionIds: new Set([...state.activeSessionIds].filter((id) => id !== sessionId)),
                }));
              }*/

              // Stop background service if no more active downloads
              const hasActiveDownloads = Object.values(get().downloads).some((d) => d.status === 'downloading');
              if (!hasActiveDownloads) {
                await get().stopBackgroundService();
              }
            },
            handleSessionLog,
          );

          const sessionId = session.getSessionId();

          // Track session immediately for cancel support and progress mapping
          set((state) => ({
            activeSessionIds: new Set([...state.activeSessionIds, sessionId]),
            downloads: {
              ...state.downloads,
              [downloadId]: { ...state.downloads[downloadId], sessionId },
            },
          }));
        } catch (error) {
          set((state) => ({
            downloads: {
              ...state.downloads,
              [downloadId]: {
                ...state.downloads[downloadId],
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            },
          }));

          const hasActiveDownloads = Object.values(get().downloads).some((d) => d.status === 'downloading');
          if (!hasActiveDownloads) {
            await get().stopBackgroundService();
          }

          throw error;
        }
      },

      // Cancel download
      cancelDownload: async (downloadId) => {
        const state = get();
        const download = state.downloads[downloadId];

        if (!download || !download.sessionId) return false;

        try {
          await FFmpegKit.cancel(download.sessionId);

          set((state) => ({
            downloads: {
              ...state.downloads,
              [downloadId]: { ...download, status: 'cancelled' },
            },
            activeSessionIds: new Set([...state.activeSessionIds].filter((id) => id !== download.sessionId)),
          }));

          // Stop background service if no more downloads
          const hasActiveDownloads = Object.values(get().downloads).some((d) => d.status === 'downloading');
          if (!hasActiveDownloads) {
            await get().stopBackgroundService();
          }

          return true;
        } catch (error) {
          console.error('Cancel failed:', error);
          return false;
        }
      },

      // Cancel all downloads
      cancelAllDownloads: async () => {
        try {
          const state = get();
          // Cancel each active session individually
          const cancelPromises = Array.from(state.activeSessionIds).map((sessionId) =>
            FFmpegKit.cancel(sessionId).catch((err) => console.error(`Failed to cancel session ${sessionId}:`, err)),
          );
          await Promise.all(cancelPromises);

          set((state) => ({
            downloads: Object.fromEntries(
              Object.entries(state.downloads).map(([id, download]) => [
                id,
                download.status === 'downloading' ? { ...download, status: 'cancelled' as const } : download,
              ]),
            ),
            activeSessionIds: new Set(),
          }));

          // Stop background service since all downloads are cancelled
          await get().stopBackgroundService();
        } catch (error) {
          console.error('Cancel all failed:', error);
        }
      },

      // Remove download
      removeDownload: async (downloadId) => {
        const state = get();
        const download = state.downloads[downloadId];

        // Delete the file from filesystem if it exists
        if (download?.outputFile) {
          try {
            const exists = await RNFS.exists(download.outputFile);
            if (exists) {
              await RNFS.unlink(download.outputFile);
              // console.log(`🗑️ Deleted file: ${download.outputFile}`);
            }
          } catch (error) {
            console.error(`❌ Failed to delete file: ${download.outputFile}`, error);
          }
        }

        // Remove from state
        set((state) => {
          const { [downloadId]: _, ...rest } = state.downloads;
          return { downloads: rest };
        });
      },

      // Clear completed downloads
      clearCompleted: async () => {
        const state = get();
        const completedDownloads = Object.values(state.downloads).filter((d) => d.status === 'completed');

        // Delete all completed files from filesystem
        for (const download of completedDownloads) {
          if (download.outputFile) {
            try {
              const exists = await RNFS.exists(download.outputFile);
              if (exists) {
                await RNFS.unlink(download.outputFile);
                // console.log(`🗑️ Deleted file: ${download.outputFile}`);
              }
            } catch (error) {
              console.error(`❌ Failed to delete file: ${download.outputFile}`, error);
            }
          }
        }

        // Remove from state
        set((state) => ({
          downloads: Object.fromEntries(
            Object.entries(state.downloads).filter(([_, download]) => download.status !== 'completed'),
          ),
        }));
      },

      // Clear all downloads
      clearAll: async () => {
        const state = get();
        const allDownloads = Object.values(state.downloads);

        // Delete all files from filesystem
        for (const download of allDownloads) {
          if (download.outputFile) {
            try {
              const exists = await RNFS.exists(download.outputFile);
              if (exists) {
                await RNFS.unlink(download.outputFile);
                // console.log(`🗑️ Deleted file: ${download.outputFile}`);
              }
            } catch (error) {
              console.error(`❌ Failed to delete file: ${download.outputFile}`, error);
            }
          }
        }

        // Clear all from state
        set({ downloads: {} });
      },

      // Get stream info
      getStreamInfo: async (url) => {
        try {
          const command = `-v quiet -print_format json -show_format -show_streams "${url}"`;
          const session = await FFprobeKit.execute(command);
          const returnCode = await session.getReturnCode();

          if (ReturnCode.isSuccess(returnCode)) {
            const output = await session.getOutput();
            const info = JSON.parse(output);

            let duration = 0;
            const videoTracks: VideoTrack[] = [];
            const audioTracks: AudioTrack[] = [];
            const textTracks: TextTrack[] = [];

            if (info.format?.duration) {
              duration = parseFloat(info.format.duration);
            }

            info.streams?.forEach((stream: any, index: number) => {
              switch (stream.codec_type) {
                case 'video':
                  videoTracks.push({
                    index,
                    width: stream.width,
                    height: stream.height,
                    codecs: stream.codec_name,
                    tracksId: index.toString(),
                    bitrate: parseInt(stream.bit_rate) || 0,
                  });
                  break;
                case 'audio':
                  audioTracks.push({
                    index,
                    title: stream.tags?.title || '',
                    language: stream.tags?.language || 'und',
                    type: stream.codec_name,
                    bitrate: parseInt(stream.bit_rate) || 0,
                  });
                  break;
                case 'subtitle':
                  textTracks.push({
                    index,
                    title: stream.tags?.title || '',
                    language: stream.tags?.language || 'und',
                    type: 'text/vtt',
                  });
                  break;
              }
            });

            return {
              duration,
              videoTracks,
              audioTracks,
              textTracks,
              totalStreams: info.streams?.length || 0,
              rawInfo: info,
            };
          }

          throw new Error('FFprobe failed');
        } catch (error) {
          console.error('FFprobe execution failed:', error);
          throw error instanceof Error ? error : new Error('FFprobe failed to analyze stream');
        }
      },

      // Download queue
      downloadQueue: async (episodes, onQueueProgress) => {
        const results: { success: boolean; downloadId?: string; error?: string; episode?: any }[] = [];

        for (let i = 0; i < episodes.length; i++) {
          const episode = episodes[i];

          try {
            const downloadId = get().addDownload(episode);

            await get().startDownload(downloadId, (progress) => {
              if (onQueueProgress) {
                onQueueProgress({
                  currentEpisode: i + 1,
                  totalEpisodes: episodes.length,
                  episodeProgress: progress,
                  overallProgress: Math.round(((i + progress.percentage / 100) / episodes.length) * 100),
                  currentEpisodeName: `${episode.name} Episode ${episode.episode}`,
                });
              }
            });

            results.push({ success: true, downloadId });

            // Delay between downloads
            if (i < episodes.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.error(`❌ Download failed for episode ${episode.episode}:`, error);
            results.push({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              episode,
            });
          }
        }
      },

      // Get storage information
      getStorageInfo: async () => {
        const state = get();
        const downloads = Object.values(state.downloads);

        // Calculate actual storage size from downloads directory
        let actualSize = 0;
        try {
          const exists = await RNFS.exists(DOWNLOADS_DIR);
          if (exists) {
            const dirItems = await RNFS.readDir(DOWNLOADS_DIR);

            // Recursively calculate size of all files and subdirectories
            const calculateDirSize = async (items: any[]): Promise<number> => {
              let size = 0;
              for (const item of items) {
                if (item.isFile()) {
                  size += Number(item.size) || 0;
                } else if (item.isDirectory()) {
                  const subItems = await RNFS.readDir(item.path);
                  size += await calculateDirSize(subItems);
                }
              }
              return size;
            };

            actualSize = await calculateDirSize(dirItems);
          }
        } catch (error) {
          console.error('❌ Failed to calculate storage size:', error);
          // Fallback to calculating from download records
          actualSize = downloads.filter((d) => d.status === 'completed').reduce((sum, d) => sum + (d.fileSize || 0), 0);
        }

        return {
          downloadsPath: DOWNLOADS_DIR,
          tempPath: TEMP_DIR,
          downloadsSize: actualSize,
          totalDownloads: downloads.filter((d) => d.status === 'completed').length,
        };
      },

      // Cleanup temporary files
      cleanupTempFiles: async () => {
        try {
          const exists = await RNFS.exists(TEMP_DIR);
          if (exists) {
            await RNFS.unlink(TEMP_DIR);
            await ensureDir(TEMP_DIR);
            // console.log('✅ Temp files cleaned up');
          }
        } catch (error) {
          console.error('❌ Failed to cleanup temp files:', error);
        }
      },

      // Start background service for downloads
      startBackgroundService: async () => {
        const state = get();
        if (state.isBackgroundServiceRunning) return;

        try {
          const backgroundTask = async (taskDataArguments: any) => {
            // Keep-alive task - just keeps the service running
            await new Promise(async (resolve) => {
              while (BackgroundService.isRunning()) {
                // Check if there are active downloads
                const currentState = get();
                const hasActiveDownloads = Object.values(currentState.downloads).some(
                  (d) => d.status === 'downloading',
                );

                if (!hasActiveDownloads) {
                  // No more downloads, stop service
                  // console.log('📱 No active downloads, stopping background service');
                  break;
                }

                // Wait before checking again
                await new Promise((r) => setTimeout(r, 2000));
              }
              resolve(undefined);
            });
          };

          const options = {
            taskName: 'DownloadTask',
            taskTitle: 'Downloading Episodes',
            taskDesc: 'Preparing download...',
            taskIcon: {
              name: 'notification_icon',
              type: 'drawable',
            },
            color: '#000',
            linkingURI: 'uwumi://(settings)/downloads',
            parameters: {},
          };

          await BackgroundService.start(backgroundTask, options);
          set({ isBackgroundServiceRunning: true });
          // console.log('✅ Background service started');
        } catch (error) {
          console.error('❌ Failed to start background service:', error);
        }
      },

      // Stop background service
      stopBackgroundService: async () => {
        const state = get();
        if (!state.isBackgroundServiceRunning) return;

        try {
          await BackgroundService.stop();
          set({ isBackgroundServiceRunning: false });
          // console.log('✅ Background service stopped');
        } catch (error) {
          console.error('❌ Failed to stop background service:', error);
        }
      },

      // Update background notification with current download progress
      updateBackgroundNotification: async (downloadId: string) => {
        const state = get();
        const download = state.downloads[downloadId];

        if (!download || !state.isBackgroundServiceRunning) return;

        try {
          const progress = download.progress;
          const progressText = progress
            ? `${progress.percentage.toFixed(1)}% • ${(progress.speed * 1024).toFixed(1)} KB/s`
            : 'Starting...';

          await BackgroundService.updateNotification({
            taskTitle: `${download.name}${download.season ? ` Season ${download.season}` : ''} - Episode ${download.episode}`,
            taskDesc: progressText,
            progressBar: progress
              ? {
                  max: 100,
                  value: Math.round(progress.percentage),
                  indeterminate: false,
                }
              : {
                  max: 100,
                  value: 0,
                  indeterminate: true,
                },
          });
        } catch (error) {
          console.error('❌ Failed to update notification:', error);
        }
      },
    }),
    {
      name: 'download-storage',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) ?? null,
        removeItem: (name) => storage.delete(name),
      })),
      partialize: (state) => ({
        downloads: Object.fromEntries(
          Object.entries(state.downloads).map(([id, download]) => {
            // Exclude transient fields from persistence
            const { progress, sessionId, ...persistableDownload } = download;
            return [
              id,
              {
                ...persistableDownload,
                outputFile: download.outputFile || undefined,
              },
            ];
          }),
        ),
        // Don't persist these runtime-only fields
        // isInitialized, activeSessionIds, isBackgroundServiceRunning will reset on restart
      }),
    },
  ),
);

/*
 * USAGE EXAMPLES:
 *
 * // Initialize
 * await useDownloadStore.getState().initialize();
 *
 * // Single episode download (no show directory)
 * const downloadId = useDownloadStore.getState().addDownload({
 *   url: 'https://example.com/movie.m3u8',
 *   name: 'Spirited Away',
 *   episode: 1,
 * });
 * // Creates: /downloads/Spirited_Away_E1.mp4
 *
 * // TV series download with show directory and season
 * const downloadId = useDownloadStore.getState().addDownload({
 *   url: 'https://example.com/episode.m3u8',
 *   name: 'The Final Season',
 *   showName: 'Attack on Titan',
 *   season: 4,
 *   episode: 1,
 * });
 * // Creates: /downloads/Attack_on_Titan/The_Final_Season_S4_E1.mp4
 *
 * // With external subtitles
 * const downloadId = useDownloadStore.getState().addDownload({
 *   url: 'https://example.com/episode.m3u8',
 *   name: 'Season 1',
 *   showName: 'Demon Slayer',
 *   season: 1,
 *   episode: 5,
 *   externalSubtitles: [
 *     { uri: 'https://example.com/subs/en.vtt', language: 'en', title: 'English', type: 'text/vtt' },
 *   ],
 * });
 * // Creates: /downloads/Demon_Slayer/Season_1_S1_E5.mp4
 *
 * await useDownloadStore.getState().startDownload(downloadId, (progress) => {
 *   console.log(`Progress: ${progress.percentage}% - Speed: ${progress.speed}x`);
 * });
 *
 * // In component
 * const downloads = useDownloadStore((state) => state.downloads);
 * const activeDownloads = Object.values(downloads).filter((d) => d.status === 'downloading');
 *
 * // Download queue
 * const episodes = [
 *   { url: 'url1', name: 'AOT', episode: 1 },
 *   {
 *     url: 'url2',
 *     name: 'AOT',
 *     episode: 2,
 *     externalSubtitles: [{ url: 'sub.vtt', language: 'en', title: 'English' }]
 *   },
 * ];
 *
 * await useDownloadStore.getState().downloadQueue(episodes, (queueProgress) => {
 *   console.log(`Queue: ${queueProgress.overallProgress}%`);
 * });
 *
 * // All tracks (video, audio, subtitles) are automatically included
 * // External subtitles can be added if stream doesn't have embedded subs
 * // Subtitles use mov_text codec (not burned in, switchable in player)
 * // Video and audio are copied without re-encoding for best quality and speed
 */
