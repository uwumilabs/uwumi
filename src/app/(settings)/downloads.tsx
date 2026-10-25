import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import {
  ThemedView,
  List,
  HUXStack,
  HUYStack,
  Progress,
  IconTitle,
  IoniconsIcon,
  RippleButton,
  type IoniconProps,
} from '@/components';
import { EpisodeDownload, useDownloadStore, usePureBlackBackground } from '@/hooks';
import { formatTime } from '@/constants/utils';
import { ActivityIndicator, Text } from 'react-native';
import { Separator, Dialog, Card, cn } from 'heroui-native';
import { Button } from '@/components/Button';
import { MaterialIconsIcon } from '@/components/Icons';

// Sample downloads in every state, for working on this screen. __DEV__ keeps them out of release builds even if
// this is left on.
const SHOW_PREVIEW_DOWNLOADS = false;
const PREVIEW_DOWNLOADS: EpisodeDownload[] = (
  [
    // Downloading
    {
      id: 'dummy-1',
      name: 'Attack on Titan',
      showName: 'Shingeki no Kyojin',
      episode: 15,
      season: 4,
      status: 'downloading',
      progress: {
        percentage: 45,
        currentTime: 540,
        totalDuration: 1200,
        speed: 2048000,
        bitrate: 5000000,
        size: 150000000,
      },
      fileSize: 350000000,
      createdAt: Date.now() - 600000,
    },
    {
      id: 'dummy-2',
      name: 'Demon Slayer Movie',
      showName: 'Kimetsu no Yaiba',
      episode: 1,
      status: 'downloading',
      progress: {
        percentage: 78,
        currentTime: 3600,
        totalDuration: 4620,
        speed: 5242880,
        bitrate: 8000000,
        size: 520000000,
      },
      fileSize: 720000000,
      createdAt: Date.now() - 1800000,
    },
    // Pending
    {
      id: 'dummy-3',
      name: 'One Piece',
      showName: 'One Piece',
      episode: 1050,
      status: 'pending',
      createdAt: Date.now() - 300000,
    },
    {
      id: 'dummy-4',
      name: 'Jujutsu Kaisen',
      showName: 'JJK',
      episode: 24,
      season: 2,
      status: 'pending',
      createdAt: Date.now() - 150000,
    },
    // Completed
    {
      id: 'dummy-5',
      name: 'Naruto Shippuden',
      showName: 'Naruto',
      episode: 500,
      season: 1,
      status: 'completed',
      fileSize: 450000000,
      outputFile: '/storage/downloads/Naruto_S1_E500.mp4',
      createdAt: Date.now() - 7200000,
      completedAt: Date.now() - 3600000,
    },
    {
      id: 'dummy-6',
      name: 'My Hero Academia',
      showName: 'Boku no Hero Academia',
      episode: 12,
      season: 6,
      status: 'completed',
      fileSize: 380000000,
      outputFile: '/storage/downloads/MHA_S6_E12.mp4',
      createdAt: Date.now() - 86400000,
      completedAt: Date.now() - 82800000,
    },
    {
      id: 'dummy-7',
      name: 'Chainsaw Man',
      episode: 8,
      season: 1,
      status: 'completed',
      fileSize: 420000000,
      outputFile: '/storage/downloads/Chainsaw_Man_S1_E8.mp4',
      createdAt: Date.now() - 172800000,
      completedAt: Date.now() - 169200000,
    },
    // Failed
    {
      id: 'dummy-8',
      name: 'Tokyo Revengers',
      showName: 'Tokyo Revengers',
      episode: 7,
      season: 2,
      status: 'failed',
      error: 'Network connection lost',
      createdAt: Date.now() - 43200000,
    },
    {
      id: 'dummy-9',
      name: 'Spy x Family',
      episode: 3,
      season: 2,
      status: 'cancelled',
      createdAt: Date.now() - 21600000,
    },
    {
      id: 'dummy-10',
      name: 'Bleach TYBW',
      showName: 'Bleach: Thousand-Year Blood War',
      episode: 5,
      status: 'failed',
      error: 'Insufficient storage space',
      createdAt: Date.now() - 10800000,
    },
  ] satisfies Omit<EpisodeDownload, 'url'>[]
).map((download) => ({ ...download, url: '' }));

type DownloadStatus = EpisodeDownload['status'];
type DownloadListItem =
  | { type: 'header'; title: string; count: number }
  | { type: 'item'; id: string; status: DownloadStatus };

const previewById: Record<string, EpisodeDownload> | undefined =
  __DEV__ && SHOW_PREVIEW_DOWNLOADS ? Object.fromEntries(PREVIEW_DOWNLOADS.map((d) => [d.id, d])) : undefined;

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const STATUS_ICONS: Record<DownloadStatus, IoniconProps['name']> = {
  downloading: 'download-outline',
  completed: 'checkmark-circle-outline',
  failed: 'close-circle-outline',
  cancelled: 'close-circle-outline',
  pending: 'time-outline',
};

const getStatusColor = (status: DownloadStatus) => {
  switch (status) {
    case 'completed':
      return 'green';
    case 'failed':
    case 'cancelled':
      return 'red';
    default:
      return '$color1';
  }
};

const completedDateFormat = new Intl.DateTimeFormat();

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
}: ConfirmDialogProps) => (
  <Dialog isOpen={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="bg-black/50" />
      <Dialog.Content className="rounded-3xl bg-background p-4">
        <Dialog.Close className="absolute right-3 top-3" />
        <HUYStack className="gap-3">
          <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
          <Dialog.Description className="text-base text-foreground/80">{description}</Dialog.Description>
          <HUXStack className="flex-row justify-end gap-3">
            <Button onPress={() => onOpenChange(false)} variant="ghost" isIconOnly={false} className="min-w-25">
              {cancelText}
            </Button>
            <Button onPress={onConfirm} className="min-w-25" variant="danger">
              {confirmText}
            </Button>
          </HUXStack>
        </HUYStack>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog>
);

// Only the progress part re-renders on the download's ticks
const DownloadProgressInfo = memo(({ id, onCancel }: { id: string; onCancel: (id: string) => void }) => {
  const progress = useDownloadStore((state) => (previewById?.[id] ?? state.downloads[id])?.progress);
  const percent = Math.round(progress?.percentage || 0);

  return (
    <HUYStack className="mt-2 gap-2">
      <Progress value={percent} />
      <HUXStack className="flex-row items-center justify-between">
        <HUXStack className="flex-row items-center gap-3">
          <Text className="text-sm font-semibold text-foreground">{percent}%</Text>
          {!!progress?.speed && <Text className="text-xs text-foreground">{formatBytes(progress.speed)}/s</Text>}
        </HUXStack>
        {!!progress?.currentTime && !!progress?.totalDuration && (
          <Text className="text-sm text-foreground">
            {formatTime(progress.currentTime)} / {formatTime(progress.totalDuration)}
          </Text>
        )}
      </HUXStack>
      <RippleButton className="mt-2 items-center justify-center gap-2 rounded-xl p-3" onPress={() => onCancel(id)}>
        <IconTitle iconName="pause-circle-outline" text="Cancel" />
      </RippleButton>
    </HUYStack>
  );
});
DownloadProgressInfo.displayName = 'DownloadProgressInfo';

const DownloadCard = memo(
  ({
    id,
    onRemove,
    onCancel,
  }: {
    id: string;
    onRemove: (id: string, status: DownloadStatus) => void;
    onCancel: (id: string) => void;
  }) => {
    const download = useDownloadStore(
      useShallow((state) => {
        const d = previewById?.[id] ?? state.downloads[id];
        return {
          name: d?.name,
          showName: d?.showName,
          season: d?.season,
          episode: d?.episode,
          fileSize: d?.fileSize,
          status: d?.status ?? 'pending',
          error: d?.error,
          completedAt: d?.completedAt,
        };
      }),
    );
    const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
    const { status } = download;

    return (
      <Card className={cn('m-2 rounded-2xl bg-background border border-default', pureBlackBackground && 'bg-black')}>
        <Card.Header>
          <HUXStack className="mb-2 flex-row items-start justify-between">
            <HUYStack className="flex-1 gap-1">
              {download.showName && (
                <Text className="text-sm text-foreground/60" numberOfLines={1}>
                  {download.showName}
                </Text>
              )}
              <Card.Title className="w-[90%]" numberOfLines={1}>
                {download.name}
              </Card.Title>
              <HUXStack className="flex-row items-center gap-2">
                <Text className="text-sm text-foreground/70">
                  {download.season ? `S${download.season} ` : ''}
                  {`E${download.episode}`}
                </Text>
                {!!download.fileSize && (
                  <>
                    <Text className="text-sm text-foreground/50">•</Text>
                    <Text className="text-sm text-foreground/70">{formatBytes(download.fileSize)}</Text>
                  </>
                )}
              </HUXStack>
            </HUYStack>

            <HUXStack className="flex-row items-center gap-2">
              <IoniconsIcon name={STATUS_ICONS[status]} size={20} />
              <RippleButton onPress={() => onRemove(id, status)}>
                <IoniconsIcon name="trash-outline" size={20} />
              </RippleButton>
            </HUXStack>
          </HUXStack>
        </Card.Header>
        <Card.Body>{status === 'downloading' && <DownloadProgressInfo id={id} onCancel={onCancel} />}</Card.Body>

        <Card.Footer>
          {status !== 'downloading' && (
            <HUXStack className="mt-2 flex-row items-center gap-2">
              <Text className="text-sm font-medium" style={{ color: getStatusColor(status) }}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
              {download.error && (
                <>
                  <Text className="text-sm text-foreground/50">•</Text>
                  <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                    {download.error}
                  </Text>
                </>
              )}
              {!!download.completedAt && (
                <>
                  <Text className="text-sm text-foreground/50">•</Text>
                  <Text className="text-sm text-foreground/70">
                    {completedDateFormat.format(new Date(download.completedAt))}
                  </Text>
                </>
              )}
            </HUXStack>
          )}
        </Card.Footer>
      </Card>
    );
  },
);
DownloadCard.displayName = 'DownloadCard';

const SectionHeader = memo(({ title, count }: { title: string; count: number }) => {
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  return (
    <HUXStack
      className="flex-row items-center justify-between px-4 py-3"
      style={{ backgroundColor: pureBlackBackground ? '#000' : undefined }}>
      <Text className="text-lg font-semibold text-foreground">
        {title} ({count})
      </Text>
    </HUXStack>
  );
});
SectionHeader.displayName = 'SectionHeader';

const EmptyState = () => (
  <HUYStack className="flex-1 items-center justify-center gap-4 p-8">
    <IoniconsIcon name="folder-outline" size={64} className="text-foreground" />
    <Text className="text-center text-2xl font-semibold text-foreground/50">No Downloads</Text>
    <Text className="max-w-75 text-center text-base text-foreground/40">
      Downloaded episodes will appear here. Long press an episode to access download options.
    </Text>
  </HUYStack>
);

const SECTIONS: { title: string; statuses: DownloadStatus[] }[] = [
  { title: 'Downloading', statuses: ['downloading'] },
  { title: 'Pending', statuses: ['pending'] },
  { title: 'Completed', statuses: ['completed'] },
  { title: 'Failed', statuses: ['failed', 'cancelled'] },
];

const Downloads = () => {
  const isInitialized = useDownloadStore((state) => state.isInitialized);
  // Ids and statuses only: progress ticks change neither, so they don't re-render the screen or the list
  const layoutKey = useDownloadStore((state) =>
    Object.values(previewById ?? state.downloads)
      .map(({ id, status }) => `${status}\t${id}`)
      .join('\n'),
  );
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  // Alert dialog states
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [clearCompletedDialogOpen, setClearCompletedDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [selectedDownloadId, setSelectedDownloadId] = useState<string | null>(null);
  const [selectedDownloadStatus, setSelectedDownloadStatus] = useState<string>('');

  useEffect(() => {
    useDownloadStore.getState().initialize();
  }, []);

  const entries = useMemo(
    () =>
      layoutKey
        ? layoutKey.split('\n').map((line) => {
            const tab = line.indexOf('\t');
            return { status: line.slice(0, tab) as DownloadStatus, id: line.slice(tab + 1) };
          })
        : [],
    [layoutKey],
  );
  const completedIds = useMemo(
    () => entries.filter(({ status }) => status === 'completed').map(({ id }) => id),
    [entries],
  );

  // Only completed downloads change what's on disk, so progress ticks don't re-scan the folder
  const completedKey = useMemo(() => [...completedIds].sort().join(','), [completedIds]);
  const { data: storageInfo = { downloadsSize: 0, totalDownloads: 0 } } = useQuery({
    queryKey: ['downloads', 'storage', completedKey],
    queryFn: () => useDownloadStore.getState().getStorageInfo(),
    enabled: isInitialized,
    placeholderData: keepPreviousData,
  });

  const listData = useMemo<DownloadListItem[]>(
    () =>
      SECTIONS.flatMap(({ title, statuses }) => {
        const items = entries.filter(({ status }) => statuses.includes(status));
        if (!items.length) return [];
        return [
          { type: 'header' as const, title, count: items.length },
          ...items.map(({ id, status }) => ({ type: 'item' as const, id, status })),
        ];
      }),
    [entries],
  );

  const handleRemoveDownload = useCallback((downloadId: string, status: string) => {
    setSelectedDownloadId(downloadId);
    setSelectedDownloadStatus(status);
    setRemoveDialogOpen(true);
  }, []);

  const confirmRemoveDownload = useCallback(async () => {
    if (selectedDownloadId) {
      await useDownloadStore.getState().removeDownload(selectedDownloadId);
      setRemoveDialogOpen(false);
      setSelectedDownloadId(null);
    }
  }, [selectedDownloadId]);

  const handleCancelDownload = useCallback((downloadId: string) => {
    setSelectedDownloadId(downloadId);
    setCancelDialogOpen(true);
  }, []);

  const confirmCancelDownload = useCallback(async () => {
    if (selectedDownloadId) {
      await useDownloadStore.getState().cancelDownload(selectedDownloadId);
      setCancelDialogOpen(false);
      setSelectedDownloadId(null);
    }
  }, [selectedDownloadId]);

  const handleClearCompleted = useCallback(() => {
    if (completedIds.length === 0) return;
    setClearCompletedDialogOpen(true);
  }, [completedIds.length]);

  const confirmClearCompleted = useCallback(async () => {
    await useDownloadStore.getState().clearCompleted();
    setClearCompletedDialogOpen(false);
  }, []);

  const handleClearAll = useCallback(() => {
    if (entries.length === 0) return;
    setClearAllDialogOpen(true);
  }, [entries.length]);

  const confirmClearAll = useCallback(async () => {
    await useDownloadStore.getState().clearAll();
    setClearAllDialogOpen(false);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: DownloadListItem }) =>
      item.type === 'header' ? (
        <SectionHeader title={item.title} count={item.count} />
      ) : (
        <DownloadCard id={item.id} onRemove={handleRemoveDownload} onCancel={handleCancelDownload} />
      ),
    [handleRemoveDownload, handleCancelDownload],
  );

  if (!isInitialized) {
    return (
      <ThemedView>
        <HUYStack className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="$color" />
          <Text className="mt-4 text-xl text-foreground/70">Initializing downloads...</Text>
        </HUYStack>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      {/* Storage Info Header */}
      <HUYStack className="gap-3 p-4" style={{ backgroundColor: pureBlackBackground ? '#000' : undefined }}>
        <HUXStack className="flex-row items-center justify-between">
          <HUXStack className="flex-row items-center gap-2">
            <MaterialIconsIcon name="sd-card" className="text-foreground" />
            <Text className="text-base text-foreground/70">Storage Used</Text>
          </HUXStack>
          <Text className="text-lg font-semibold text-foreground">{formatBytes(storageInfo.downloadsSize)}</Text>
        </HUXStack>
        <HUXStack className="flex-row items-center justify-between">
          <HUXStack className="flex-row items-center gap-2">
            <IoniconsIcon name="folder-outline" className="text-foreground" />
            <Text className="text-base text-foreground/70">Total Downloads</Text>
          </HUXStack>
          <Text className="text-lg font-semibold text-foreground">{storageInfo.totalDownloads}</Text>
        </HUXStack>

        {/* Action Buttons */}
        {entries.length > 0 && (
          <HUXStack className="mt-2 flex-row gap-2">
            {completedIds.length > 0 && (
              <RippleButton
                onPress={handleClearCompleted}
                style={{ flex: 1 }}
                containerStyle={{ backgroundColor: '$color4' }}
                className="flex-1 items-center justify-center gap-2 rounded-xl p-3">
                <IconTitle iconName="trash-outline" text="Clear Completed" />
              </RippleButton>
            )}
            <RippleButton
              onPress={handleClearAll}
              style={{ flex: 1 }}
              className="flex-1 items-center justify-center gap-2 rounded-xl p-3">
              <IconTitle iconName="trash-outline" text="Clear All" />
            </RippleButton>
          </HUXStack>
        )}
      </HUYStack>

      <Separator />

      {/* Downloads List */}
      <List<DownloadListItem>
        data={listData}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyExtractor={(item) => (item.type === 'header' ? `header-${item.title}` : `item-${item.id}`)}
        getItemType={(item) => item.type}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyState />}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        title="Remove Download"
        description={
          selectedDownloadStatus === 'completed'
            ? 'This will delete the downloaded file. Continue?'
            : 'Remove this download from the list?'
        }
        confirmText="Remove"
        onConfirm={confirmRemoveDownload}
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Download"
        description="Stop downloading this episode?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={confirmCancelDownload}
      />

      <ConfirmDialog
        open={clearCompletedDialogOpen}
        onOpenChange={setClearCompletedDialogOpen}
        title="Clear Completed"
        description={`Remove ${completedIds.length} completed download${completedIds.length > 1 ? 's' : ''}?`}
        confirmText="Clear"
        onConfirm={confirmClearCompleted}
      />

      <ConfirmDialog
        open={clearAllDialogOpen}
        onOpenChange={setClearAllDialogOpen}
        title="Clear All Downloads"
        description="This will remove all downloads from the list and delete downloaded files. This cannot be undone."
        confirmText="Clear All"
        onConfirm={confirmClearAll}
      />
    </ThemedView>
  );
};

export default Downloads;
