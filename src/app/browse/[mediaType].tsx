import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useBrowseParams } from '@/utils/routes';
import { CardList } from '@/components/CardList';
import { ThemedView } from '@/components/ui-primitives';
import { useNativeHeaderOptions } from '@/hooks/useNativeHeaderOptions';

const Browse = () => {
  const headerOptions = useNativeHeaderOptions();
  const { mediaType, feed, title } = useBrowseParams();

  return (
    <ThemedView testID="browse-screen">
      <Stack.Screen options={{ ...headerOptions, headerShown: true, title }} />
      <View testID="browse-list" className="flex-1">
        <CardList mediaFeedType={feed} mediaType={mediaType} />
      </View>
    </ThemedView>
  );
};

export default Browse;
