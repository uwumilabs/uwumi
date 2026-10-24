import React, { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, cn, useThemeColor } from 'heroui-native';
import { VideoPlayer } from 'react-native-video-toolkit';
import { HUXStack, HUYStack, IoniconsIcon, MaterialIconsIcon } from '@/components';
import type { ServerFailure } from '@/hooks';

export type ServerPhase = 'finding' | 'exhausted' | 'unavailable' | 'missing';

export interface ServerChip {
  name: string;
  state: 'failed' | 'current' | 'pending';
  reason?: ServerFailure;
}

export const FAILURE_LABELS: Record<ServerFailure, string> = {
  'no-video': 'no video',
  unavailable: 'error',
  playback: 'didn’t play',
};

const NOTICE_MS = 2500;

const Chip = ({ chip, onPress }: { chip: ServerChip; onPress: () => void }) => {
  const accentForeground = useThemeColor('accent-foreground');
  const current = chip.state === 'current';
  return (
    <Button
      size="sm"
      variant={current ? 'primary' : 'tertiary'}
      onPress={current ? undefined : onPress}
      className={cn(chip.state === 'failed' && 'opacity-60')}>
      {current ? (
        <ActivityIndicator size="small" color={accentForeground} />
      ) : (
        <IoniconsIcon
          name={chip.state === 'failed' ? 'close-circle' : 'ellipse-outline'}
          size={14}
          className="text-foreground"
        />
      )}
      <Button.Label>{chip.reason ? `${chip.name} · ${FAILURE_LABELS[chip.reason]}` : chip.name}</Button.Label>
    </Button>
  );
};

/**
 * In place of the player while no server is playing: finding one, every server failed, the provider gave no servers,
 * or the episode isn't on this provider. Tapping a server tries it.
 */
export const ServerStatusScreen = ({
  phase,
  title,
  providerName,
  chips,
  onBack,
  onPick,
  onRetry,
  changeProvider,
}: {
  phase: ServerPhase;
  title?: string;
  providerName: string;
  chips: ServerChip[];
  onBack: () => void;
  onPick: (name: string) => void;
  onRetry?: () => void;
  changeProvider: ReactNode;
}) => {
  const current = chips.findIndex((chip) => chip.state === 'current');
  const heading = {
    finding: chips.length ? 'Finding a working server…' : 'Getting servers…',
    exhausted: 'No server worked for this episode',
    unavailable: `Couldn’t get servers from ${providerName}`,
    missing: `Not on ${providerName}`,
  }[phase];
  const detail = {
    finding: current >= 0 ? `Server ${current + 1} of ${chips.length} · tap one to try it` : undefined,
    exhausted: 'Try them again, or another provider.',
    unavailable: 'Try again, or another provider.',
    missing: 'This episode isn’t available there. Try another provider.',
  }[phase];

  return (
    <View className="flex-1 bg-black">
      <HUXStack className="items-center gap-2 p-4">
        <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Back">
          <MaterialIconsIcon name="arrow-back" size={26} color="white" />
        </Pressable>
        {title ? (
          <Text className="flex-1 text-lg font-semibold text-white" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </HUXStack>
      <HUYStack className="flex-1 items-center justify-center gap-3 px-6">
        {phase === 'finding' && !chips.length && <ActivityIndicator size="large" color="white" />}
        <Text className="text-center text-lg font-semibold text-white">{heading}</Text>
        {detail ? <Text className="text-center text-sm text-white/60">{detail}</Text> : null}
        {chips.length > 0 && phase !== 'unavailable' && phase !== 'missing' && (
          <HUXStack className="max-w-xl flex-wrap justify-center gap-2 pt-1">
            {chips.map((chip) => (
              <Chip key={chip.name} chip={chip} onPress={() => onPick(chip.name)} />
            ))}
          </HUXStack>
        )}
        {phase !== 'finding' && (
          <HUXStack className="items-center gap-3 pt-2">
            {onRetry && phase !== 'missing' && (
              <Button variant="primary" onPress={onRetry}>
                <Button.Label>Try again</Button.Label>
              </Button>
            )}
            {changeProvider}
          </HUXStack>
        )}
      </HUYStack>
    </View>
  );
};

/** Over the player: which server is loading, and briefly which one took over after a switch. */
export const ServerLoadingOverlay = ({
  loading,
  label,
  notice,
}: {
  loading: boolean;
  label: string;
  notice?: string;
}) => {
  const [expiredNotice, setExpiredNotice] = useState<string | undefined>();
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setExpiredNotice(notice), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);
  const showNotice = !loading && !!notice && expiredNotice !== notice;
  // Unmounted rather than faded out: Android picture-in-picture hides and restores the app's views, and an
  // opacity-hidden overlay comes back visible afterwards
  if (!loading && !showNotice) return null;

  return (
    <VideoPlayer.Overlay pointerEvents="none" style={styles.corner}>
      <HUXStack className="items-center gap-2 rounded-full bg-black/70 px-3 py-1.5">
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <IoniconsIcon name="checkmark-circle" size={16} color="white" />
        )}
        <Text className="text-sm text-white">{loading ? label : notice}</Text>
      </HUXStack>
    </VideoPlayer.Overlay>
  );
};

const styles = StyleSheet.create({
  corner: { alignItems: 'flex-start', justifyContent: 'flex-start', paddingTop: 72, paddingHorizontal: 16 },
});
