import { IconTitle, RippleButton, CustomSelect, CustomFlashlist } from '@/components';
import { PROVIDERS, useProviderStore } from '@/constants/provider';
import { MediaType } from '@/constants/types';
import { useMangaChapters, usePureBlackBackground } from '@/hooks';
import { Album, Library, ScrollText } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Spinner, Text, XStack, YStack } from 'tamagui';

const Chapters = () => {
  const { mediaType, provider, id } = useLocalSearchParams<{
    mediaType: MediaType;
    provider: string;
    id: string;
  }>();
  const { getProvider, setProvider } = useProviderStore();
  const { data, isLoading } = useMangaChapters({ id, provider: getProvider(mediaType) });
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const IconProps = {
    size: 20,
    color: '$color1',
    opacity: 0.7,
  };
  const router = useRouter();

  const handleProviderChange = useCallback(
    (value: string) => {
      setProvider(mediaType, value);
    },
    [mediaType, setProvider],
  );
  if (isLoading) {
    return (
      <YStack justifyContent="center" alignItems="center" minHeight={300}>
        <Spinner size="large" color="$color" />
      </YStack>
    );
  }
  return (
    //<YStack flex={1}>
    <CustomFlashlist
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
      ListHeaderComponent={
        <XStack paddingHorizontal={16} padding={8} gap="$5" alignItems="center" justifyContent="center">
          <CustomSelect
            SelectItem={PROVIDERS.manga}
            SelectLabel="Provider"
            value={getProvider(mediaType)}
            onValueChange={handleProviderChange}
          />
        </XStack>
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
          <YStack gap={'$4'} padding={2} backgroundColor={pureBlackBackground ? '#000' : 'transparent'}>
            <XStack gap={'$4'}>
              <YStack padding={2} flex={1} justifyContent="space-between">
                <YStack>
                  <XStack alignItems="center" justifyContent="space-between" gap={2}>
                    <Text fontSize="$3" fontWeight="700" numberOfLines={1} flex={1} color="$color">
                      {item.title}
                    </Text>
                    <XStack alignItems="center" gap={2}>
                      <IconTitle text={item.volumeNumber} icon={Library} iconProps={IconProps} />
                    </XStack>
                  </XStack>
                </YStack>
                <XStack justifyContent="space-between" alignItems="center">
                  <IconTitle text={item.chapterNumber} icon={Album} iconProps={IconProps} />
                  <IconTitle text={item.pages} icon={ScrollText} iconProps={IconProps} />
                </XStack>
              </YStack>
            </XStack>
          </YStack>
        </RippleButton>
      )}
    />
    //</YStack>
  );
};

export default Chapters;
