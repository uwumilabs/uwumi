import { HUXStack } from '@/components/ui-primitives';
import { isTV } from '@/utils/tv';
import { useMediaInfo } from '@/hooks/queries/infoQueries';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export const AnimatedCountdown = () => {
  const { data: mediaInfo } = useMediaInfo();
  const targetDate = mediaInfo?.nextAiringEpisode?.airingTime || mediaInfo?.nextAiringEpisode?.releaseDate;
  // A yyyy-mm-dd string, or a Unix timestamp in seconds
  const target = typeof targetDate === 'string' ? new Date(targetDate).getTime() : targetDate ? targetDate * 1000 : 0;
  const [now, setNow] = useState(Date.now);
  const difference = target - now;

  useEffect(() => {
    if (!target || difference <= 0) return;
    // Seconds only show in the last hour; before that the text changes once a minute
    const delay = difference > HOUR_MS ? (difference % MINUTE_MS) + 50 : 1000;
    const timer = setTimeout(() => setNow(Date.now()), delay);
    return () => clearTimeout(timer);
  }, [target, difference]);

  const left = Math.max(0, difference);
  const timeLeft = {
    d: Math.floor(left / (24 * HOUR_MS)),
    h: Math.floor((left / HOUR_MS) % 24),
    m: Math.floor((left / MINUTE_MS) % 60),
    s: Math.floor((left / 1000) % 60),
  };

  const unitsToShow = Object.entries(timeLeft).filter(([key, value]) => {
    if (key === 'd' && value > 0) return true;
    if (key === 'h' && (timeLeft.d > 0 || value > 0)) return true;
    if (key === 'm' && (timeLeft.d > 0 || timeLeft.h > 0 || value > 0)) return true;
    if (key === 's' && timeLeft.d === 0 && timeLeft.h === 0) return true;
    return false;
  });

  return (
    <HUXStack className="gap-2 items-center" focusable={isTV ? false : undefined}>
      {unitsToShow.map(([key, value]) => (
        <HUXStack className="items-center gap-1" key={key}>
          <View>
            <Text className="text-accent text-sm font-bold">{value.toString().padStart(2, '0')}</Text>
          </View>
          <Text className="text-foreground text-sm font-bold">{key}</Text>
        </HUXStack>
      ))}
    </HUXStack>
  );
};
