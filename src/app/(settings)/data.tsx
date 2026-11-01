import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Paths } from 'expo-file-system';
import { ConfirmDialog, HUYStack, NativeList, Progress, SectionTitle, ThemedView } from '@/components';
import { useToast } from '@/components/heroui';
import {
  useContinueWatchingStore,
  useDownloadStore,
  usePreferencesStore,
  useRecentSearchesStore,
  useWatchProgressStore,
} from '@/hooks';
import { MediaType } from '@/constants/types';
import { formatBytes } from '@/constants/utils';
import { cacheSize, clearCache } from '@/utils/cache';

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

const DataAndStorage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState<ClearTarget | null>(null);
  const [clearing, setClearing] = useState(false);
  const clearOnLaunch = usePreferencesStore((state) => state.clearCacheOnLaunch);
  const setClearOnLaunch = usePreferencesStore((state) => state.setClearCacheOnLaunch);

  // Re-measures when a download finishes, as the Downloads screen does
  const completedKey = useDownloadStore((state) =>
    Object.values(state.downloads)
      .filter(({ status }) => status === 'completed')
      .map(({ id }) => id)
      .sort()
      .join(','),
  );
  const { data: storage, refetch } = useQuery({
    queryKey: ['storage', 'overview', completedKey],
    // Playback fills the video cache behind React Query's back, so each visit measures again
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { downloadsSize } = await useDownloadStore.getState().getStorageInfo();
      const cache = cacheSize();
      return {
        totalSpace: Paths.totalDiskSpace,
        freeSpace: Paths.availableDiskSpace,
        appSize: (Paths.document.size ?? 0) + cache,
        downloadsSize,
        cacheSize: cache,
      };
    },
  });

  const clear = async () => {
    setClearing(true);
    try {
      const before = cacheSize();
      await clearCache();
      await refetch();
      toast.show({
        variant: 'success',
        label: `Cache cleared, ${formatBytes(Math.max(0, before - cacheSize()))} freed`,
      });
    } finally {
      setClearing(false);
    }
  };

  const pending = confirm ? CLEAR[confirm] : null;

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <SectionTitle>Storage usage</SectionTitle>
        <HUYStack className="gap-2.5 px-4 py-2">
          <Text className="text-base font-medium text-foreground">Internal storage</Text>
          <Progress value={storage ? (storage.appSize / storage.totalSpace) * 100 : 0} />
          <Text className="text-sm text-foreground/60">
            {storage
              ? `uwumi: ${formatBytes(storage.appSize)} · Available: ${formatBytes(storage.freeSpace)} / Total: ${formatBytes(storage.totalSpace)}`
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
            title="Clear cache"
            description={storage ? `Used: ${formatBytes(storage.cacheSize)}` : 'Checking…'}
            trailingLoading={clearing}
            onPress={clearing ? undefined : clear}
          />
          <NativeList.Item
            title="Clear cache on app launch"
            toggle={{ value: clearOnLaunch, onValueChange: setClearOnLaunch }}
          />
        </NativeList>

        <SectionTitle>History</SectionTitle>
        <NativeList variant="flat">
          <NativeList.Item title="Clear watch history" onPress={() => setConfirm('history')} />
          <NativeList.Item title="Clear watch progress" onPress={() => setConfirm('progress')} />
          <NativeList.Item title="Clear search history" onPress={() => setConfirm('searches')} />
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
