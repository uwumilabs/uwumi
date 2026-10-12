import {
  IconTitle,
  RippleButton,
  Select,
  List,
  HUXStack,
  HUYStack,
  ListJumpBar,
  ProviderEmptyState,
} from '@/components';
import LinearGradient from '@/components/LinearGradient';
import { useProviders, useProviderStore, useActiveProvider } from '@/constants/provider';
import { MediaType } from '@/constants/types';
import { LIST_SHADOW_SIZE, useCurrentTheme, useListJump, useMangaChapters, usePureBlackBackground } from '@/hooks';
import type { FlashListRef } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { cn, ScrollShadow } from 'heroui-native';
import React, { ReactNode, useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { IMangaChapter } from 'react-native-consumet';

interface ChaptersProps {
  header?: ReactNode;
}

const Chapters = ({ header }: ChaptersProps) => {
  const { mediaType, id } = useLocalSearchParams<{
    mediaType: MediaType;
    id: string;
  }>();
  const setProvider = useProviderStore((state) => state.setProvider);
  const currentProvider = useActiveProvider(mediaType);
  const providers = useProviders();
  const { data, isLoading, error, refetch } = useMangaChapters({ id, provider: currentProvider });
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const currentTheme = useCurrentTheme();
  const router = useRouter();
  const listRef = useRef<FlashListRef<IMangaChapter>>(null);
  const chapters = useMemo(() => data ?? [], [data]);

  const chapterRangeLabel = useCallback(
    (start: number, end: number) => {
      const label = (index: number) => String(chapters[index].chapterNumber ?? index + 1);
      return `CH ${label(start)}–${label(end)}`;
    },
    [chapters],
  );
  const { listProps, ranges, rangeValue, jumpToRange, jumpBar } = useListJump({
    items: chapters,
    listRef,
    rangeLabel: chapterRangeLabel,
  });

  const handleProviderChange = useCallback(
    (value: string) => {
      setProvider(mediaType, value);
    },
    [mediaType, setProvider],
  );
  return (
    <View className="flex-1">
      <ScrollShadow
        className="flex-1"
        size={LIST_SHADOW_SIZE}
        color={pureBlackBackground ? '#000000' : currentTheme?.background}
        LinearGradientComponent={LinearGradient}>
        <List
          ref={listRef}
          {...listProps}
          data={isLoading ? [] : chapters}
          // Rendered inside the list so `header` stays visible
          ListEmptyComponent={
            isLoading ? (
              <HUYStack className="justify-center items-center min-h-75">
                <ActivityIndicator size="large" />
              </HUYStack>
            ) : (
              <ProviderEmptyState
                providers={providers.manga}
                provider={currentProvider}
                error={error}
                onRetry={() => refetch()}
                onProviderChange={handleProviderChange}
                itemsLabel="chapters"
              />
            )
          }
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
          ListHeaderComponent={
            <>
              {header}
              <HUXStack className="flex-wrap px-4 p-2 gap-1.5 items-center justify-center">
                <Select
                  SelectItem={providers.manga}
                  SelectLabel="Provider"
                  value={currentProvider}
                  onValueChange={handleProviderChange}
                />
                {ranges.length > 0 && (
                  <Select SelectItem={ranges} SelectLabel="Chapters" value={rangeValue} onValueChange={jumpToRange} />
                )}
              </HUXStack>
            </>
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
      </ScrollShadow>
      <ListJumpBar {...jumpBar} rangesLabel="Chapters" />
    </View>
  );
};

export default Chapters;
