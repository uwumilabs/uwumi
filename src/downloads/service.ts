import BackgroundService from 'react-native-background-actions';
import { DOWNLOADS_LINK } from '@/utils/routes';
import { formatBytes } from '@/utils/format';
import { downloadBytesPerSecond, isPreparing, type EpisodeDownload } from './model';

// The library counts as running only once its native start resolves, so downloads starting together share one start
let starting: Promise<void> | undefined;

/**
 * Android's foreground service, with its notification, so downloads go on in the background. It runs while
 * `isActive` holds, checked every 2 seconds.
 */
export const startDownloadService = async (isActive: () => boolean) => {
  if (BackgroundService.isRunning()) return;
  starting ??= start(isActive).finally(() => (starting = undefined));
  return starting;
};

const start = async (isActive: () => boolean) => {
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
        linkingURI: DOWNLOADS_LINK,
        parameters: {},
        foregroundServiceType: ['dataSync'],
      },
    );
  } catch (error) {
    console.error('❌ Failed to start background service:', error);
  }
};

export const stopDownloadService = async () => {
  if (!BackgroundService.isRunning()) return;
  try {
    await BackgroundService.stop();
  } catch (error) {
    console.error('❌ Failed to stop background service:', error);
  }
};

export const showDownloadInNotification = async (
  download: Pick<EpisodeDownload, 'name' | 'season' | 'episode' | 'progress' | 'status' | 'sessionId'>,
) => {
  if (!BackgroundService.isRunning()) return;
  const progress = isPreparing(download) ? undefined : download.progress;
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
