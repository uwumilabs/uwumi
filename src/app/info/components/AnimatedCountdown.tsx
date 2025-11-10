import { Text, View, XStack } from 'tamagui';
import React, { useEffect, useState } from 'react';

type CountdownProps = {
  targetDate: number | string;
};

export const AnimatedCountdown: React.FC<CountdownProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    d: 0,
    h: 0,
    m: 0,
    s: 0,
  });

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
    <XStack gap="$2" alignItems="center">
      {unitsToShow.map(([key, value]) => (
        <XStack key={key} alignItems="center" gap="$1">
          <View>
            <Text color="$color" fontSize="$3" fontWeight="700">
              {value.toString().padStart(2, '0')}
            </Text>
          </View>
          <Text color="$color1" fontSize="$3" fontWeight="700">
            {key}
          </Text>
        </XStack>
      ))}
    </XStack>
  );
};

export default AnimatedCountdown;
