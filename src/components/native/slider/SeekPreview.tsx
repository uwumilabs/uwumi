import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { File as FsFile } from 'expo-file-system';
import { formatTime } from '@/constants/utils';
import { useSeekPreviewStore, type SeekPreviewSource } from '@/hooks/stores/useSeekPreviewStore';
import { findCue, parseThumbnailVtt } from '@/utils/seekPreview';

const TILE_WIDTH = 160;

const loadCues = async ({ url, headers }: SeekPreviewSource) => {
  const text = url.startsWith('file:') ? await new FsFile(url).text() : await (await fetch(url, { headers })).text();
  const cues = parseThumbnailVtt(text, url);
  // Fetched before the first drag, so the tiles show at once
  Image.prefetch([...new Set(cues.map((cue) => cue.uri))], { headers, cachePolicy: 'memory-disk' }).catch(() => {});
  return cues;
};

/** Above the progress slider while it's dragged: the frame at `time`, from the episode's sprite sheets */
export const SeekPreview = ({ time, duration }: { time: number | null; duration: number }) => {
  const source = useSeekPreviewStore((state) => state.source);
  const [trackWidth, setTrackWidth] = useState(0);
  const { data: cues } = useQuery({
    queryKey: ['seek-preview', source?.url],
    queryFn: () => loadCues(source!),
    enabled: !!source,
    staleTime: Infinity,
  });

  const cue = time !== null && cues?.length ? findCue(cues, time) : undefined;
  const scale = cue ? TILE_WIDTH / cue.w : 1;
  const left = Math.min(
    Math.max(((time ?? 0) / Math.max(duration, 1)) * trackWidth - TILE_WIDTH / 2, 0),
    Math.max(trackWidth - TILE_WIDTH, 0),
  );

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
      {cue && (
        <View style={[styles.bubble, { left }]}>
          <View style={[styles.tile, { height: cue.h * scale }]}>
            <Image
              source={{ uri: cue.uri, headers: source?.headers }}
              cachePolicy="memory-disk"
              style={{
                position: 'absolute',
                left: -cue.x * scale,
                top: -cue.y * scale,
                width: cue.sheetWidth * scale,
                height: cue.sheetHeight * scale,
              }}
            />
          </View>
          <Text style={styles.time}>{formatTime(time!)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: { position: 'absolute', bottom: '100%', marginBottom: 12, width: TILE_WIDTH, alignItems: 'center' },
  tile: {
    width: TILE_WIDTH,
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'black',
  },
  time: {
    marginTop: 4,
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'black',
    textShadowRadius: 4,
  },
});
