import { HUXStack } from '@/components';
import { isTV } from '@/constants/utils';
import { useMediaInfoStore } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

export const AnimatedCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    d: 0,
    h: 0,
    m: 0,
    s: 0,
  });
  const { mediaInfo } = useMediaInfoStore();
  const targetDate = mediaInfo?.nextAiringEpisode?.airingTime || mediaInfo?.nextAiringEpisode?.releaseDate;
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      // Handle both timestamp and date string formats
      let target: number;
      if (typeof targetDate === 'string') {
        // If it's a string (yyyy-mm-dd format)
        target = new Date(targetDate).getTime();
      } else {
        // If it's a number (Unix timestamp in seconds)
        target = new Date(targetDate * 1000).getTime();
      }
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Determine which units to show based on time left
  const unitsToShow = Object.entries(timeLeft).filter(([key, value]) => {
    // Always show days if present
    if (key === 'd' && value > 0) return true;
    // Always show hours if days are present or hours > 0
    if (key === 'h' && (timeLeft.d > 0 || value > 0)) return true;
    // Always show minutes if days/hours present or minutes > 0
    if (key === 'm' && (timeLeft.d > 0 || timeLeft.h > 0 || value > 0)) return true;
    // Only show seconds if less than 1 hour left
    if (key === 's' && timeLeft.d === 0 && timeLeft.h === 0) return true;
    return false;
  });

  return (
    <HUXStack className="gap-2 items-center" props={{ focusable: isTV ? false : undefined }}>
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

export default AnimatedCountdown;
