import { IconTitle, RippleButton, CustomSelect, CustomFlashlist, HUXStack, HUYStack } from '@/components';
import { PROVIDERS, useProviderStore } from '@/constants/provider';
import { MediaType } from '@/constants/types';
import { useMangaChapters, usePureBlackBackground } from '@/hooks';
import { Album, Library, ScrollText } from 'lucide-react-native';
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
  const { setProvider } = useProviderStore();
  const currentProvider = useProviderStore((state) => state.getProvider(mediaType));
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
        <ActivityIndicator size="large" color="$color" />
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
            SelectItem={PROVIDERS.manga}
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
                      <IconTitle text={item.volumeNumber} icon={Library} />
                    </HUXStack>
                  </HUXStack>
                </HUYStack>
                <HUXStack className="flex-row items-center justify-between">
                  <IconTitle text={item.chapterNumber} icon={Album} />
                  <IconTitle text={item.pages} icon={ScrollText} />
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
