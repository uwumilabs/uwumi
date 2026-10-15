import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'heroui-native';
import { BaseButton, VideoPlayer, useProgress, useVideoSelector } from 'react-native-video-toolkit';
import type { SkipTime } from '@/hooks';

// An outro that runs this close to the end leads straight into the next episode
const OUTRO_TAIL_SECONDS = 5;

const SKIP_LABELS: Record<SkipTime['type'], string> = {
  intro: 'Skip intro',
  outro: 'Skip outro',
  recap: 'Skip recap',
};

export interface UpNext {
  label: string;
  title?: string;
}

/** What the current position can skip, if it's inside an intro, recap or outro. */
const useSkipAction = (skipTimes: SkipTime[], upNext: UpNext | undefined, onNext: () => void) => {
  const { currentTime, duration, seek } = useProgress();
  // Ends a second early so the button doesn't flash as playback leaves the range
  const active = skipTimes.find(({ start, end }) => currentTime >= start && currentTime < end - 1);
  if (!active) return null;
  if (active.type === 'outro' && upNext && duration > 0 && active.end >= duration - OUTRO_TAIL_SECONDS) {
    return { label: `Next · ${upNext.label}`, onPress: onNext };
  }
  return { label: SKIP_LABELS[active.type], onPress: () => seek(active.end) };
};

interface SkipProps {
  skipTimes: SkipTime[];
  upNext?: UpNext;
  onNext: () => void;
}

/** For the controls' bottom row: the skip while one applies. */
export const SkipSlot = ({ skipTimes, upNext, onNext }: SkipProps) => {
  const action = useSkipAction(skipTimes, upNext, onNext);
  if (!action) return null;
  return (
    <BaseButton onTap={action.onPress}>
      <Button variant="primary">{action.label}</Button>
    </BaseButton>
  );
};

/** Over the video: the skip button while the controls are hidden (SkipSlot shows it with them). */
export const PlayerOverlay = ({ skipTimes, upNext, onNext }: SkipProps) => {
  const controlsVisible = useVideoSelector((state) => state.controlsVisible);
  const action = useSkipAction(skipTimes, upNext, onNext);
  return (
    <VideoPlayer.Overlay visible={!!action && !controlsVisible} style={styles.floating}>
      {action && (
        <BaseButton onTap={action.onPress}>
          <Button variant="primary">{action.label}</Button>
        </BaseButton>
      )}
    </VideoPlayer.Overlay>
  );
};

const styles = StyleSheet.create({
  floating: { alignItems: 'flex-end', justifyContent: 'flex-end', padding: 16 },
});

export default PlayerOverlay;
