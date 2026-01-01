import React, { useCallback } from 'react';
import { ThemedView, NoResults, CustomImage } from '@/components';
import { useLocalSearchParams } from 'expo-router';
import { useMangaChapterRead } from '@/hooks';
import { FlashList } from '@shopify/flash-list';
import { Dimensions, View, ActivityIndicator } from 'react-native';
import { MediaType } from '@/constants/types';
import { useProviderStore } from '@/constants/provider';

const Read = () => {
  const { width } = Dimensions.get('window');
  const { mediaType, id } = useLocalSearchParams<{
    mediaType: MediaType;
    id: string;
  }>();
  const { getProvider } = useProviderStore();
  const { data, isLoading } = useMangaChapterRead({ id: id, provider: getProvider(mediaType) });

  const renderItem = useCallback(
    ({ item }: { item: { img: string } }) => (
      <View className="my-2">
        <CustomImage
          source={{ uri: item?.img }}
          style={{
            width: width,
            height: width * 1.4,
          }}
          contentFit="contain"
        />
      </View>
    ),
    [width],
  );

  const keyExtractor = useCallback((item: { img: string }) => item?.img, []);

  if (isLoading) {
    return (
      <ThemedView>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <FlashList
        data={data}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          paddingVertical: 8,
        }}
        ListEmptyComponent={<NoResults />}
        showsVerticalScrollIndicator={true}
        renderItem={renderItem}
      />
    </ThemedView>
  );
};

export default Read;
