import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CardList, StackHeader, ThemedView } from '@/components';
import { MediaFeedType, MediaType, MetaProvider } from '@/constants/types';

const Browse = () => {
  const router = useRouter();
  const { mediaType, feed, metaProvider, title } = useLocalSearchParams<{
    mediaType: MediaType;
    feed: MediaFeedType;
    metaProvider: MetaProvider;
    title: string;
  }>();

  return (
    // useSafeArea skips ThemedView's top inset; StackHeader pads for the status bar
    <ThemedView useSafeArea>
      <StackHeader title={title} onBack={router.back} />
      <View className="flex-1">
        <CardList mediaFeedType={feed} mediaType={mediaType} metaProvider={metaProvider} />
      </View>
    </ThemedView>
  );
};

export default Browse;
