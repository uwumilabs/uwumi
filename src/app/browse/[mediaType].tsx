import React from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { CardList, ThemedView } from '@/components';
import { useNativeHeaderOptions } from '@/hooks';
import { MediaFeedType, MediaType, MetaProvider } from '@/constants/types';

const Browse = () => {
  const headerOptions = useNativeHeaderOptions();
  const { mediaType, feed, metaProvider, title } = useLocalSearchParams<{
    mediaType: MediaType;
    feed: MediaFeedType;
    metaProvider: MetaProvider;
    title: string;
  }>();

  return (
    <ThemedView>
      <Stack.Screen options={{ ...headerOptions, headerShown: true, title }} />
      <View className="flex-1">
        <CardList mediaFeedType={feed} mediaType={mediaType} metaProvider={metaProvider} />
      </View>
    </ThemedView>
  );
};

export default Browse;
