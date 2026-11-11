import BackgroundService from 'react-native-background-actions';
import { formatBytes } from '@/utils/format';
import type { DownloadProgress } from './ffmpeg';

/** Bytes downloaded per second: the stream's byte rate times how much faster than real time FFmpeg runs */
export const downloadBytesPerSecond = ({ speed, bitrate }: Pick<DownloadProgress, 'speed' | 'bitrate'>) =>
  speed > 0 && bitrate > 0 ? (bitrate / 8) * speed : 0;

let running = false;

/**
 * Android's foreground service, with its notification, so downloads go on in the background. It runs while
 * `isActive` holds, checked every 2 seconds.
 */
export const startDownloadService = async (isActive: () => boolean) => {
  if (running) return;
  try {
    await BackgroundService.start(
      async () => {
        while (BackgroundService.isRunning() && isActive()) await new Promise((r) => setTimeout(r, 2000));
      },
      {
        taskName: 'DownloadTask',
        taskTitle: 'Downloading Episodes',
        taskDesc: 'Preparing download...',
        // plugins/withBackgroundDownloads.js adds this drawable
        taskIcon: { name: 'notification_icon', type: 'drawable' },
        color: '#000',
        linkingURI: 'uwumi://(settings)/downloads',
        parameters: {},
        foregroundServiceType: ['dataSync'],
      },
    );
    running = true;
  } catch (error) {
    console.error('❌ Failed to start background service:', error);
  }
};

export const stopDownloadService = async () => {
  if (!running) return;
  try {
    await BackgroundService.stop();
    running = false;
  } catch (error) {
    console.error('❌ Failed to stop background service:', error);
  }
};

export const showDownloadInNotification = async (download: {
  name: string;
  season?: number;
  episode: number;
  progress?: DownloadProgress;
  sessionId?: number;
}) => {
  if (!running) return;
  // No FFmpeg session yet while the stream is being probed
  const progress = download.sessionId ? download.progress : undefined;
  try {
    await BackgroundService.updateNotification({
      taskTitle: `${download.name}${download.season ? ` Season ${download.season}` : ''} - Episode ${download.episode}`,
      taskDesc: progress
        ? `${progress.percentage.toFixed(1)}% • ${formatBytes(downloadBytesPerSecond(progress))}/s`
        : 'Getting ready…',
      progressBar: progress
        ? { max: 100, value: Math.round(progress.percentage), indeterminate: false }
        : { max: 100, value: 0, indeterminate: true },
    });
  } catch (error) {
    console.error('❌ Failed to update notification:', error);
  }
};
