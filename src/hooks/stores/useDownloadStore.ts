import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { FFmpegKit, FFmpegKitConfig, FFprobeKit, Log, ReturnCode } from 'react-native-ffmpeg-kit';
import type { VideoTrack, AudioTrack, TextTrack, TextTracks } from 'react-native-video';
import { storage } from './MMKV';
import { UWUMI_DIR } from '@/constants/config';

const DOWNLOADS_DIR = `${UWUMI_DIR}/downloads`; // Downloaded episodes
const TEMP_DIR = `${RNFS.CachesDirectoryPath}/ffmpeg_temp`; // Temporary FFmpeg files

// Types
interface ExternalSubtitle {
  url: string;
  language: string;
  title: string;
}

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
  animeName: string;
  episode: number;
  externalSubtitles?: TextTracks;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress?: DownloadProgress;
  outputFile?: string; // Changed from File to string (file path)
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

  // Actions
  initialize: () => Promise<boolean>;
  addDownload: (episode: Omit<EpisodeDownload, 'id' | 'status' | 'createdAt'>) => string;
  startDownload: (downloadId: string, onProgress?: (progress: DownloadProgress) => void) => Promise<void>;
  cancelDownload: (downloadId: string) => Promise<boolean>;
  cancelAllDownloads: () => Promise<void>;
  removeDownload: (downloadId: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  getStreamInfo: (url: string) => Promise<StreamInfo>;
  downloadQueue: (
    episodes: Omit<EpisodeDownload, 'id' | 'status' | 'createdAt'>[],
    onQueueProgress?: (progress: any) => void,
  ) => Promise<void>;
  getStorageInfo: () => {
    downloadsPath: string;
    tempPath: string;
    downloadsSize: number;
    totalDownloads: number;
  };
  cleanupTempFiles: () => Promise<void>;
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

      // Initialize FFmpeg Kit and directories
      initialize: async () => {
        const state = get();
        if (state.isInitialized) return true;

        try {
          // Create directories in internal storage
          await ensureDir(UWUMI_DIR);
          await ensureDir(DOWNLOADS_DIR);
          await ensureDir(TEMP_DIR);

          // Configure FFmpeg logging (basic)
          FFmpegKitConfig.enableLogCallback((log: Log) => {
            console.log('FFmpeg:', log.getMessage());
          });

          set({ isInitialized: true });
          console.log('✅ FFmpeg Kit initialized');
          console.log('📁 Storage locations:');
          console.log('   Downloads:', DOWNLOADS_DIR);
          console.log('   Temp:', TEMP_DIR);
          return true;
        } catch (error) {
          console.error('❌ FFmpeg init failed:', error);
          throw error;
        }
      },

      // Add download to queue
      addDownload: (episode) => {
        const downloadId = `${episode.animeName.replace(/[^a-zA-Z0-9]/g, '_')}_E${episode.episode}_${Date.now()}`;
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
          // Update status
          set((state) => ({
            downloads: {
              ...state.downloads,
              [downloadId]: { ...download, status: 'downloading' },
            },
          }));

          // Get stream info
          let streamInfo;
          try {
            streamInfo = await get().getStreamInfo(download.url);
          } catch (streamError) {
            console.error(`❌ FFprobe failed for: ${download.animeName} E${download.episode}`, streamError);
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
            return;
          }

          // Prepare output file path
          const filename = `${download.animeName.replace(/[^a-zA-Z0-9]/g, '_')}_E${download.episode}.mp4`;
          const outputFile = `${DOWNLOADS_DIR}/${filename}`;

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

          // Setup log callback to parse progress from FFmpeg output (overrides simple logger)
          FFmpegKitConfig.enableLogCallback((log: Log) => {
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

                console.log(
                  `📥 ${dl.animeName} E${dl.episode} | ${percentage}% | ${timeStr}/${totalStr} | ${sizeStr} | ${bitrateStr} | Speed: ${progress.speed.toFixed(2)}x`,
                );

                // Update state
                set((state) => ({
                  downloads: {
                    ...state.downloads,
                    [dlId]: { ...state.downloads[dlId], progress },
                  },
                }));

                // Call callback for THIS download
                if (dlId === downloadId && onProgress) {
                  onProgress(progress);
                }
              }
            }
          });

          // Execute asynchronously with completion callback for real-time progress
          console.log(command);
          const session = await FFmpegKit.executeAsync(command, async (completedSession) => {
            const returnCode = await completedSession.getReturnCode();
            const sessionId = completedSession.getSessionId();

            // Check result
            if (ReturnCode.isSuccess(returnCode)) {
              const fileExists = await RNFS.exists(outputFile);
              if (fileExists) {
                const fileStat = await RNFS.stat(outputFile);
                console.log(`✅ Download completed: ${download.animeName} E${download.episode}`);
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
              console.log(`🚫 Download cancelled: ${download.animeName} E${download.episode}`);
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
            } else {
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
            }
          });

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
        } catch (error) {
          console.error('Cancel all failed:', error);
        }
      },

      // Remove download
      removeDownload: (downloadId) => {
        set((state) => {
          const { [downloadId]: _, ...rest } = state.downloads;
          return { downloads: rest };
        });
      },

      // Clear completed downloads
      clearCompleted: () => {
        set((state) => ({
          downloads: Object.fromEntries(
            Object.entries(state.downloads).filter(([_, download]) => download.status !== 'completed'),
          ),
        }));
      },

      // Clear all downloads
      clearAll: () => {
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
                  currentEpisodeName: `${episode.animeName} Episode ${episode.episode}`,
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
      getStorageInfo: () => {
        const state = get();
        const downloads = Object.values(state.downloads);
        const totalSize = downloads
          .filter((d) => d.status === 'completed')
          .reduce((sum, d) => sum + (d.fileSize || 0), 0);

        return {
          downloadsPath: DOWNLOADS_DIR,
          tempPath: TEMP_DIR,
          downloadsSize: totalSize,
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
            console.log('✅ Temp files cleaned up');
          }
        } catch (error) {
          console.error('❌ Failed to cleanup temp files:', error);
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
          Object.entries(state.downloads).map(([id, download]) => [
            id,
            {
              ...download,
              outputFile: download.outputFile || undefined,
            },
          ]),
        ),
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
 * // Add and start download (automatically downloads ALL audio and subtitle tracks)
 * const downloadId = useDownloadStore.getState().addDownload({
 *   url: 'https://example.com/episode.m3u8',
 *   animeName: 'Attack on Titan',
 *   episode: 1,
 * });
 *
 * // With external subtitles (if stream doesn't have any)
 * const downloadId = useDownloadStore.getState().addDownload({
 *   url: 'https://example.com/episode.m3u8',
 *   animeName: 'Attack on Titan',
 *   episode: 1,
 *   externalSubtitles: [
 *     { url: 'https://example.com/subs/en.vtt', language: 'en', title: 'English' },
 *     { url: 'https://example.com/subs/ja.vtt', language: 'ja', title: 'Japanese' },
 *   ],
 * });
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
 *   { url: 'url1', animeName: 'AOT', episode: 1 },
 *   {
 *     url: 'url2',
 *     animeName: 'AOT',
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
