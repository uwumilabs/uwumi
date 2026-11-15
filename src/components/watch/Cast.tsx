import React, { useEffect, useEffectEvent } from 'react';
import CastContext, {
  useCastState,
  useRemoteMediaClient,
  type CastError,
  type MediaLoadRequest,
} from 'react-native-google-cast';
import { BaseIconButton } from 'react-native-video-toolkit';
import { TextTrackType } from 'react-native-video/src';
import { useToast } from '@/components/heroui';
import { MaterialIconsIcon } from '@/components/Icons';
import type { SubtitleTrack } from '@/constants/types';
import { useThemeStore } from '@/hooks/stores/useThemeStore';
import { themeCastDialog } from '@/modules/castDialog';
import { castProxyModule, castUrl } from '@/modules/castProxy';
import { isTV } from '@/utils/tv';

type MediaTrack = NonNullable<NonNullable<MediaLoadRequest['mediaInfo']>['mediaTracks']>[number];

/**
 * The player's Cast button, opening Google's device dialog: phones only, on builds that have the cast proxy. Not the
 * library's native button, which crashes iOS (5.0.0-beta.0 hands its props to React's RCTViewComponentView).
 */
export const PlayerCastButton = () => {
  const castState = useCastState();
  if (isTV || !castProxyModule) return null;
  return (
    <BaseIconButton
      testID="watch-cast"
      onTap={async () => {
        await themeCastDialog(useThemeStore.getState().themeName);
        if (!(await CastContext.showCastDialog())) console.warn("Couldn't open the Cast dialog");
      }}
      IconComponent={() => (
        <MaterialIconsIcon name={castState === 'connected' ? 'cast-connected' : 'cast'} size={24} color="white" />
      )}
    />
  );
};

interface CastPlaybackOptions {
  url: string;
  headers?: Record<string, string>;
  hls: boolean;
  subtitles: SubtitleTrack[];
  title?: string;
  subtitle?: string;
  poster?: string;
  startAt: () => number;
  onCasting: () => void;
}

/**
 * While a Cast session is connected, plays the episode on the receiver from where it is here, through the cast proxy.
 * Google's default receiver plays HLS, MP4 and WebVTT, so MKV sources and SRT subtitles don't cast.
 */
export const useCastPlayback = ({
  url,
  headers,
  hls,
  subtitles,
  title,
  subtitle,
  poster,
  startAt,
  onCasting,
}: CastPlaybackOptions) => {
  const client = useRemoteMediaClient();
  const { toast } = useToast();

  const load = useEffectEvent((remote: NonNullable<typeof client>) => {
    const contentUrl = castUrl(url, headers);
    if (!contentUrl) return;
    const mediaTracks = subtitles
      .filter((track) => track.type === TextTrackType.VTT)
      .map(
        (track, index): MediaTrack => ({
          id: index + 1,
          type: 'text',
          subtype: 'subtitles',
          name: track.title,
          language: track.language,
          contentId: castUrl(track.uri, headers),
          contentType: 'text/vtt',
        }),
      );
    remote
      .loadMedia({
        mediaInfo: {
          contentUrl,
          contentType: hls ? 'application/x-mpegURL' : 'video/mp4',
          metadata: { type: 'movie', title, subtitle, images: poster ? [{ url: poster }] : undefined },
          mediaTracks,
        },
        startTime: startAt(),
        autoplay: true,
      })
      .then(onCasting)
      .catch((error: CastError) => {
        console.warn('Casting failed:', error);
        const code = error.nativeCode === undefined ? error.code : `${error.code} ${error.nativeCode}`;
        toast.show({
          variant: 'danger',
          label: "Couldn't play it on the TV",
          description: error.message ? `${error.message} (${code})` : code,
        });
      });
  });

  // A new session, or a new episode or server while connected
  useEffect(() => {
    if (client && url) load(client);
  }, [client, url]);
};
