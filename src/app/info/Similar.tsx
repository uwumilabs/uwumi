import React from 'react';
import { MediaType, MetaProvider } from '@/constants/types';
import { CardList } from '@/components';
import { useLocalSearchParams } from 'expo-router';
import { useMediaInfoStore } from '@/hooks';
import { View } from 'react-native';

const Similar = () => {
  const data = useMediaInfoStore((state) => state.mediaInfo);
  const { mediaType, metaProvider } = useLocalSearchParams<{
    mediaType: MediaType;
    metaProvider: MetaProvider;
  }>();
  return (
    <View className="h-full">
      {/* @ts-ignore */}
      <CardList staticData={data?.recommendations} mediaType={mediaType} metaProvider={metaProvider} />
    </View>
  );
};

export default Similar;
