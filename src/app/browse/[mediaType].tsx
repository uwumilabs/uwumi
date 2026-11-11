import React from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { CardList } from '@/components/CardList';
import { ThemedView } from '@/components/ui-primitives';
import { useNativeHeaderOptions } from '@/hooks/useNativeHeaderOptions';
import { MediaFeedType, MediaType } from '@/constants/types';

const Browse = () => {
  const headerOptions = useNativeHeaderOptions();
  const { mediaType, feed, title } = useLocalSearchParams<{
    mediaType: MediaType;
    feed: MediaFeedType;
    title: string;
  }>();

  return (
    <ThemedView>
      <Stack.Screen options={{ ...headerOptions, headerShown: true, title }} />
      <View className="flex-1">
        <CardList mediaFeedType={feed} mediaType={mediaType} />
      </View>
    </ThemedView>
  );
};

export default Browse;
