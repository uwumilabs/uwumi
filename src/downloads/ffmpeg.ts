import { FFprobeKit, Level, type Log, ReturnCode, type FFmpegSession } from 'react-native-ffmpeg-kit';
import type { AudioTrack, TextTrack, TextTracks, VideoTrack } from 'react-native-video/src';
import { runOnRuntimeAsync } from 'react-native-worklets';
import { SUB_LANGUAGE } from '@/constants/config';
import { downloadRuntime } from './runtime';

export interface StreamInfo {
  duration: number;
  isHls: boolean;
  videoTracks: VideoTrack[];
  audioTracks: AudioTrack[];
  textTracks: TextTrack[];
}

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

const IMAGE_CODECS = new Set(['png', 'mjpeg', 'gif', 'webp', 'bmp']);

const headerString = (headers?: Record<string, string>) =>
  headers && Object.keys(headers).length > 0
    ? Object.entries(headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n') + '\r\n'
    : undefined;

/**
 * The ISO 639-2 code MP4 needs for a subtitle's language. Providers give names ("English", "Portuguese - Brazilian
 * Portuguese"), which FFmpeg drops, so players list the tracks as "Track 1, 2, …"
 */
const languageCode = (lang?: string) => {
  if (!lang) return undefined;
  if (/^[a-z]{3}$/.test(lang)) return lang;
  const name = (Object.keys(SUB_LANGUAGE) as (keyof typeof SUB_LANGUAGE)[]).find((key) =>
    lang.toLowerCase().startsWith(key.toLowerCase()),
  );
  return name ? SUB_LANGUAGE[name] : undefined;
};

const probe = async (url: string, headers: Record<string, string> | undefined, persistent: boolean) => {
  const args: string[] = ['-allowed_extensions', 'ALL'];
  if (!persistent) args.push('-http_persistent', '0');
  const header = headerString(headers);
  if (header) args.push('-headers', header);
  args.push('-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', url);
  const session = await FFprobeKit.executeWithArguments(args);
  const returnCode = await session.getReturnCode();

  if (!ReturnCode.isSuccess(returnCode)) {
    const output = await session.getOutput();
    const logs = await session.getAllLogsAsString();
    console.error('[FFprobe] returnCode:', returnCode.getValue(), '\noutput:', output, '\nlogs:', logs);
    throw new Error(
      `FFprobe exited with code ${returnCode.getValue()}: ${logs?.slice(0, 300) || output?.slice(0, 300)}`,
    );
  }

  // getOutput() mixes in what the decoders log, which can land inside the JSON (h264's "non-existing SPS");
  // ffprobe prints the JSON itself at the STDERR level
  const output = (await session.getAllLogs())
    .filter((log) => log.getLevel() === Level.AV_LOG_STDERR)
    .map((log) => log.getMessage())
    .join('');
  const info = JSON.parse(output);

  const videoTracks: VideoTrack[] = [];
  const audioTracks: AudioTrack[] = [];
  const textTracks: TextTrack[] = [];
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
    duration: info.format?.duration ? parseFloat(info.format.duration) : 0,
    isHls: String(info.format?.format_name ?? '')
      .split(',')
      .includes('hls'),
    videoTracks,
    audioTracks,
    textTracks,
  } satisfies StreamInfo;
};

/**
 * What the stream holds, and whether FFmpeg needs a fresh connection per request. Throws a message fit to show when
 * there's nothing it can save.
 */
export const probeStream = async (url: string, headers?: Record<string, string>) => {
  // Some CDNs (NetflixMirror's) answer only the first request on a reused connection, so FFmpeg loads one
  // audio playlist and no video; those get a fresh connection per request
  let persistent = true;
  let stream = await probe(url, headers, persistent);
  if (!stream.videoTracks.length) {
    persistent = false;
    stream = await probe(url, headers, persistent);
  }
  if (!stream.videoTracks.length)
    throw new Error("Couldn't load this quality's video. Try again, or another quality or server");
  // Some servers (megaplay-hd) put a 1×1 PNG before each HLS segment's MPEG-TS data. Players resync past
  // it, but FFmpeg 6 takes the segments for pictures, so there's no audio or real video to save
  if (stream.isHls && stream.videoTracks.every(({ codecs }) => IMAGE_CODECS.has(codecs ?? '')))
    throw new Error("This server's stream can't be downloaded. Try another server");
  return { stream, persistent };
};

/** The FFmpeg arguments that save every track: the video and audio copied, subtitles as switchable mov_text */
export const downloadArgs = ({
  url,
  headers,
  externalSubtitles,
  stream,
  persistent,
  outputFile,
}: {
  url: string;
  headers?: Record<string, string>;
  externalSubtitles?: TextTracks;
  stream: StreamInfo;
  persistent: boolean;
  outputFile: string;
}) => {
  const header = headerString(headers);
  const external = externalSubtitles ?? [];
  const args: string[] = [];
  // HLS demuxer options. FFmpeg rejects them for a direct file ("Option allowed_extensions not found")
  if (stream.isHls) {
    // Providers disguise HLS segments with fake extensions (.jpg/.js); allow them all
    args.push('-allowed_extensions', 'ALL');
    if (!persistent) args.push('-http_persistent', '0');
  }
  if (header) args.push('-headers', header);
  args.push('-i', url);
  // External subtitles come from the same CDN, which needs the same headers
  external.forEach((sub) => {
    if (header) args.push('-headers', header);
    args.push('-i', sub.uri);
  });

  // The first video track, every audio track, and the subtitles of every input (`?`: there may be none)
  args.push('-map', '0:v:0', '-map', '0:a', '-map', '0:s?');
  external.forEach((_, index) => args.push('-map', `${index + 1}:s?`));
  args.push('-c:v', 'copy', '-c:a', 'copy', '-c:s', 'mov_text', '-bsf:a', 'aac_adtstoasc');

  // FFmpeg 6.0 writes the source's own subtitles as "und" once converted to mov_text (players then list
  // "Track 1, 2"), so give them the languages the probe read
  stream.textTracks.forEach((track, index) => {
    const code = languageCode(track.language);
    if (code && code !== 'und') args.push(`-metadata:s:s:${index}`, `language=${code}`);
  });

  // Language and title for external subtitles; English is the default track, as when streaming
  const codes = external.map((sub) => languageCode(sub.language));
  const defaultIndex = Math.max(codes.indexOf('eng'), 0);
  external.forEach((sub, index) => {
    const streamIndex = stream.textTracks.length + index;
    if (codes[index]) args.push(`-metadata:s:s:${streamIndex}`, `language=${codes[index]}`);
    // Arguments go to FFmpeg as they are, so a title with spaces needs no quotes
    if (sub.title) args.push(`-metadata:s:s:${streamIndex}`, `title=${sub.title}`);
    args.push(`-disposition:s:${streamIndex}`, index === defaultIndex ? 'default' : '0');
  });

  args.push('-threads', '4', '-y', outputFile);
  return args;
};

/** Progress from one FFmpeg log line, parsed on the download runtime: pure string work, off the JS thread */
export const parseProgressLog = (log: Log, duration: number) =>
  runOnRuntimeAsync(
    downloadRuntime,
    (msg: string, dur: number) => {
      'worklet';
      const timeMatch = msg.match(/time=(\d+:\d+:\d+\.?\d*)/);
      if (!timeMatch) return null;

      const bitrateMatch = msg.match(/bitrate=\s*([\d.]+)kbits\/s/);
      const speedMatch = msg.match(/speed=([\d.]+)x/);
      const sizeMatch = msg.match(/size=\s*(\d+)kB/);

      const parts = timeMatch[1].match(/(\d+):(\d+):(\d+\.?\d*)/);
      if (!parts) return null;
      const currentTime = parseInt(parts[1]) * 3600 + parseInt(parts[2]) * 60 + parseFloat(parts[3]);
      const percentage = dur > 0 ? Math.min(Math.max(Math.round((currentTime / dur) * 100), 0), 100) : 0;

      return {
        currentTime,
        percentage,
        speed: speedMatch ? parseFloat(speedMatch[1]) : 0,
        bitrate: bitrateMatch ? parseFloat(bitrateMatch[1]) * 1000 : 0,
        size: sizeMatch ? parseInt(sizeMatch[1]) * 1024 : 0,
      };
    },
    String(log.getMessage()),
    duration,
  );

export const failureReason = async (session: FFmpegSession) => {
  const returnCode = await session.getReturnCode();
  const logs = (await session.getAllLogsAsString()) ?? '';
  console.error(`[FFmpeg] failed with code ${returnCode.getValue()}:\n${logs.slice(-1500)}`);
  // The log opens with FFmpeg's banner; why it stopped is at the end
  const reason = logs
    .split('\n')
    .reverse()
    .find((line) => /error|invalid|no streams|failed|forbidden|not found/i.test(line))
    ?.trim();
  return reason || `FFmpeg failed with code ${returnCode.getValue()}`;
};
