import { Text, XStack } from 'tamagui';
import React, { useEffect, useState } from 'react';
import { MotiView } from 'moti';

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

  return (
    <XStack gap="$2" alignItems="center">
      {Object.entries(timeLeft).map(([key, value]) => (
        <XStack key={key} alignItems="center" gap="$1">
          <MotiView
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300 }}>
            <Text color="$color" fontSize="$3" fontWeight="700">
              {value.toString().padStart(2, '0')}
            </Text>
          </MotiView>
          <Text color="$color1" fontSize="$3" fontWeight="700">
            {key}
          </Text>
        </XStack>
      ))}
    </XStack>
  );
};

export default AnimatedCountdown;
