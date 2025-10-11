import { Link } from 'expo-router';
import React from 'react';
import { Text, YStack } from 'tamagui';

const KAOMOJI = [
  'Σ(ಠ_ಠ)',
  '(´･_･`)',
  '(╥﹏╥)',
  '(；一_一)',
  '(┬┬﹏┬┬)',
  '(－‸ლ)',
  '(｡•́︿•̀｡)',
  '(╯°□°）╯',
  '(⊙_⊙;)',
  'ヽ(°〇°)ﾉ',
];

const NoResults = () => {
  const randomKaomoji = KAOMOJI[Math.floor(Math.random() * KAOMOJI.length)];

  return (
    <YStack padding="$4" alignItems="center" justifyContent="center" gap="$4">
      <Text fontSize={46} fontWeight={500} textAlign="center" color="$color1">
        {randomKaomoji}
      </Text>
      <Text fontSize={16} color="$color">
        No results found
      </Text>
      <Text fontSize={14} color="$color1" textAlign="center">
        Haven't installed extensions yet? Install them from{' '}
        <Link href="/(settings)/extensions">
          <Text fontSize={14} color="$color" textDecorationLine="underline">
            here
          </Text>
        </Link>
      </Text>
    </YStack>
  );
};

export default NoResults;
