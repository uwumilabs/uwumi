import { Stack } from 'expo-router';

import { ThemedView } from '@/components/ui-primitives';
import { Text } from 'react-native';
import React from 'react';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView>
        <Text>This screen doesn't exist.</Text>
      </ThemedView>
    </>
  );
}
