import React from 'react';
import { Text } from 'react-native';
import { ThemedView } from '@/components/ui-primitives';

export default function NotFoundScreen() {
  return (
    <ThemedView testID="not-found-screen">
      <Text>This screen doesn't exist.</Text>
    </ThemedView>
  );
}
