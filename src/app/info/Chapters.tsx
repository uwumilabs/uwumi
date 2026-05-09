import { IconTitle, RippleButton, CustomSelect, CustomFlashlist, HUXStack, HUYStack } from '@/components';
import { useProviders, useProviderStore } from '@/constants/provider';
import { MediaType } from '@/constants/types';
import { useMangaChapters, usePureBlackBackground } from '@/hooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { cn } from 'heroui-native';
import React, { useCallback } from 'react';
import { ActivityIndicator, Text } from 'react-native';

const Chapters = () => {
  const { mediaType, provider, id } = useLocalSearchParams<{
    mediaType: MediaType;
    provider: string;
    id: string;
  }>();
  const setProvider = useProviderStore((state) => state.setProvider);
  const currentProvider = useProviderStore((state) => state.providers[mediaType]);
  const providers = useProviders();
  const { data, isLoading } = useMangaChapters({ id, provider: currentProvider });
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const router = useRouter();

  const handleProviderChange = useCallback(
    (value: string) => {
      setProvider(mediaType, value);
    },
    [mediaType, setProvider],
  );
  if (isLoading) {
    return (
      <HUYStack className="justify-center items-center min-h-75">
        <ActivityIndicator size="large" />
      </HUYStack>
    );
  }
  return (
    <CustomFlashlist
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
      ListHeaderComponent={
        <HUXStack className="px-4 p-2 gap-1.5 items-center justify-center">
          <CustomSelect
            SelectItem={providers.manga}
            SelectLabel="Provider"
            value={currentProvider}
            onValueChange={handleProviderChange}
          />
        </HUXStack>
      }
      renderItem={({ item }) => (
        <RippleButton
          onPress={() => {
            router.push({
              pathname: '/read/[id]',
              params: {
                id: item?.id,
              },
            });
          }}>
          <HUYStack className={cn('gap-4 px-2 py-2', pureBlackBackground && 'bg-black')}>
            <HUXStack className="gap-4">
              <HUYStack className="flex-1 justify-between p-2">
                <HUYStack>
                  <HUXStack className="flex-row items-center justify-between gap-2">
                    <Text className="flex-1 text-base font-bold text-accent" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <HUXStack className="flex-row items-center gap-2">
                      <IconTitle text={item.volumeNumber} iconName="library-outline" />
                    </HUXStack>
                  </HUXStack>
                </HUYStack>
                <HUXStack className="flex-row items-center justify-between">
                  <IconTitle text={item.chapterNumber} iconName="albums-outline" />
                  <IconTitle text={item.pages} iconName="document-text-outline" />
                </HUXStack>
              </HUYStack>
            </HUXStack>
          </HUYStack>
        </RippleButton>
      )}
    />
  );
};

export default Chapters;
