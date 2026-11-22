import type { MediaType } from '@/constants/types';
import { formatBytes, formatTime, joinDetails } from '@/utils/format';
import { seasonEpisodeLabel } from '@/utils/episodes';
import { isMovieType } from '@/utils/media';
import type { WatchParams } from '@/utils/routes';

export interface DownloadProgress {
  percentage: number;
  currentTime: number;
  totalDuration: number;
  /** FFmpeg's speed: seconds of video handled per second (9.6 = 9.6×), not a byte rate */
  speed: number;
  /** The stream's bits per second */
  bitrate: number;
  size: number;
}

/** Bytes downloaded per second: the stream's byte rate times how much faster than real time FFmpeg runs */
const downloadBytesPerSecond = ({ speed, bitrate }: Pick<DownloadProgress, 'speed' | 'bitrate'>) =>
  speed > 0 && bitrate > 0 ? (bitrate / 8) * speed : 0;

/** A subtitle file the provider sends beside the stream, saved into the download */
export interface ExternalSubtitle {
  uri: string;
  title?: string;
  /** An ISO 639-2 code (`subtitleLanguageCode`) */
  language?: string;
}

export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';

export interface EpisodeDownload {
  id: string;
  url: string;
  headers?: Record<string, string>;
  name: string;
  showName?: string;
  /** The info screen's id and media type, for "Downloaded only"; missing on downloads made before them */
  showId?: string;
  mediaType?: MediaType;
  /** The /watch route's params, to play it from Downloads; missing on downloads made before them */
  watchParams?: WatchParams;
  episode: number;
  season?: number;
  /** The episode's, which the download is saved under */
  uniqueId?: string;
  episodeId?: string;
  externalSubtitles?: ExternalSubtitle[];
  /** The provider's seek-preview sprite list, copied beside the file once it's downloaded */
  thumbnailsVtt?: string;
  /** The saved sprite list, relative to the downloads folder like `outputFile` */
  thumbnailsFile?: string;
  status: DownloadStatus;
  progress?: DownloadProgress;
  outputFile?: string;
  fileSize?: number;
  /** The FFmpeg session, once it runs: kept in memory only */
  sessionId?: number;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

/** Running or queued: restarting the app would stop it */
export const isActive = (status?: DownloadStatus) => status === 'downloading' || status === 'pending';

/** Ended without a file, so it can start again from its saved link */
export const canRetry = (status?: DownloadStatus) => status === 'failed' || status === 'cancelled';

/** The Downloads screen's groups: cancelled downloads go with the failed ones */
export type DownloadSection = 'downloading' | 'pending' | 'completed' | 'failed';

export const downloadSection = (status: DownloadStatus): DownloadSection => (canRetry(status) ? 'failed' : status);

/** Started, with nothing downloaded yet: the stream is being probed, or FFmpeg hasn't reported */
export const isPreparing = (download?: Pick<EpisodeDownload, 'status' | 'progress'>) =>
  download?.status === 'downloading' && !download.progress?.currentTime;

export const PREPARING_TEXT = 'Getting ready…';

/** A download's progress in words: `caption` (percent and speed, or "Getting ready…") and `detail` (how much of the video) */
export const downloadProgressText = (
  download?: Pick<EpisodeDownload, 'status' | 'progress'>,
): { preparing: boolean; caption: string; detail?: string } => {
  if (isPreparing(download)) return { preparing: true, caption: PREPARING_TEXT };
  const progress = download?.progress;
  const bytesPerSecond = progress ? downloadBytesPerSecond(progress) : 0;
  return {
    preparing: false,
    caption: joinDetails(
      `${Math.round(progress?.percentage ?? 0)}%`,
      bytesPerSecond ? `${formatBytes(bytesPerSecond)}/s` : undefined,
    ),
    detail:
      progress?.currentTime && progress.totalDuration
        ? `${formatTime(progress.currentTime)} / ${formatTime(progress.totalDuration)}`
        : undefined,
  };
};

/**
 * What a download is called. A film has one episode with no number worth showing, and its episode title is a
 * placeholder (AniDB calls every film's "Complete Movie"), so it goes by the film's own title.
 */
export const downloadLabels = (
  download: Partial<Pick<EpisodeDownload, 'name' | 'showName' | 'season' | 'episode' | 'watchParams'>>,
): { title: string; show?: string; number?: string } =>
  isMovieType(download.watchParams?.type)
    ? { title: download.showName || download.name || '' }
    : {
        title: download.name ?? '',
        show: download.showName,
        number: seasonEpisodeLabel(download.season, download.episode),
      };
