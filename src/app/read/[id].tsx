import React from 'react';
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

  if (isLoading) {
    return (
      <ThemedView>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="$color" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      <FlashList
        data={data}
        keyExtractor={(item) => item?.img}
        contentContainerStyle={{
          paddingVertical: 8,
        }}
        ListEmptyComponent={<NoResults />}
        showsVerticalScrollIndicator={true}
        renderItem={({ item }) => (
          <View className="my-2">
            <CustomImage
              source={{ uri: item?.img }}
              style={{
                width: width,
                height: width * 1.4,
              }}
              resizeMode="contain"
            />
          </View>
        )}
      />
    </ThemedView>
  );
};

export default Read;
