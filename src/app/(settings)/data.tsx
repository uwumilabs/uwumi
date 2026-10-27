import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { ConfirmDialog, HUYStack, NativeList, Progress, ThemedView } from '@/components';
import { useToast } from '@/components/heroui';
import { useContinueWatchingStore, useDownloadStore, useRecentSearchesStore, useWatchProgressStore } from '@/hooks';
import { MediaType } from '@/constants/types';
import { formatBytes } from '@/constants/utils';

type ClearTarget = 'history' | 'progress' | 'searches';

const CLEAR: Record<ClearTarget, { title: string; description: string; done: string; clear: () => void }> = {
  history: {
    title: 'Clear watch history?',
    description: 'Empties History and Continue watching. Episode progress stays.',
    done: 'Watch history cleared',
    clear: () => useContinueWatchingStore.getState().clearAll(),
  },
  progress: {
    title: 'Clear watch progress?',
    description: 'Every episode loses its resume point and watched mark.',
    done: 'Watch progress cleared',
    clear: () => useWatchProgressStore.getState().clearAll(),
  },
  searches: {
    title: 'Clear search history?',
    description: 'Removes recent searches for anime, manga and movies.',
    done: 'Search history cleared',
    clear: () => Object.values(MediaType).forEach(useRecentSearchesStore.getState().clearRecentSearches),
  },
};

const SectionTitle = ({ children }: { children: string }) => (
  <Text className="px-4 pb-1 pt-5 text-sm font-semibold text-accent">{children}</Text>
);

const DataAndStorage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState<ClearTarget | null>(null);
  const [clearingTemp, setClearingTemp] = useState(false);

  const { data: storage, refetch } = useQuery({
    queryKey: ['storage', 'overview'],
    queryFn: async () => {
      const [{ totalSpace, freeSpace }, { downloadsSize }] = await Promise.all([
        RNFS.getFSInfo(),
        useDownloadStore.getState().getStorageInfo(),
      ]);
      return { totalSpace, freeSpace, downloadsSize };
    },
  });

  const clearImageCache = async () => {
    await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()]);
    toast.show({ variant: 'success', label: 'Image cache cleared' });
  };

  const clearTempFiles = async () => {
    setClearingTemp(true);
    try {
      await useDownloadStore.getState().cleanupTempFiles();
      await refetch();
      toast.show({ variant: 'success', label: 'Temporary files cleared' });
    } finally {
      setClearingTemp(false);
    }
  };

  const pending = confirm ? CLEAR[confirm] : null;
  const usedPercent = storage ? ((storage.totalSpace - storage.freeSpace) / storage.totalSpace) * 100 : 0;

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <SectionTitle>Storage usage</SectionTitle>
        <HUYStack className="gap-2 px-4 py-2">
          <Text className="text-base font-medium text-foreground">Device storage</Text>
          <Progress value={usedPercent} />
          <Text className="text-sm text-foreground/60">
            {storage
              ? `Available: ${formatBytes(storage.freeSpace)} / Total: ${formatBytes(storage.totalSpace)}`
              : 'Checking…'}
          </Text>
        </HUYStack>
        <NativeList variant="flat">
          <NativeList.Item
            icon="download-outline"
            title="Downloads"
            trailing={storage ? formatBytes(storage.downloadsSize) : undefined}
            trailingLoading={!storage}
            onPress={() => router.push('/(settings)/downloads')}
          />
          <NativeList.Item
            icon="images-outline"
            title="Clear image cache"
            description="Posters and thumbnails download again as you browse"
            onPress={clearImageCache}
          />
          <NativeList.Item
            icon="trash-outline"
            title="Clear temporary download files"
            description="Leftovers from cancelled or failed downloads"
            trailingLoading={clearingTemp}
            onPress={clearingTemp ? undefined : clearTempFiles}
          />
        </NativeList>

        <SectionTitle>History</SectionTitle>
        <NativeList variant="flat">
          <NativeList.Item icon="time-outline" title="Clear watch history" onPress={() => setConfirm('history')} />
          <NativeList.Item
            icon="play-skip-back-outline"
            title="Clear watch progress"
            onPress={() => setConfirm('progress')}
          />
          <NativeList.Item icon="search-outline" title="Clear search history" onPress={() => setConfirm('searches')} />
        </NativeList>
      </ScrollView>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={pending?.title ?? ''}
        description={pending?.description ?? ''}
        confirmText="Clear"
        onConfirm={() => {
          if (!pending) return;
          pending.clear();
          setConfirm(null);
          toast.show({ variant: 'success', label: pending.done });
        }}
      />
    </ThemedView>
  );
};

export default DataAndStorage;
