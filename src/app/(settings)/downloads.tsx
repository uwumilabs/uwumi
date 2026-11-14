import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { isTV } from '@/utils/tv';
import { watchHref } from '@/utils/routes';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { useShallow } from 'zustand/react/shallow';
import { ThemedView, HUXStack, HUYStack, IconTitle, RippleButton } from '@/components/ui-primitives';
import { List } from '@/components/List';
import { Progress } from '@/components/native/progress/Progress';
import { IoniconsIcon, type IoniconProps } from '@/components/Icons';
import { Separator } from '@/components/native/separator/Separator';
import { downloadedFileUri, useDownloadStore, useDownloadsSize } from '@/downloads/useDownloadStore';
import { downloadBytesPerSecond, isActive, isPreparing, type DownloadStatus } from '@/downloads/model';
import { formatBytes, formatTime } from '@/utils/format';
import { openVideoInOtherApp } from '@/utils/share';
import { ActivityIndicator, Text } from 'react-native';
import { Card, cn, useToast } from '@/components/heroui';
import { useRouter } from 'expo-router';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MaterialIconsIcon } from '@/components/Icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DownloadListItem =
  | { type: 'header'; title: string; count: number }
  | { type: 'item'; id: string; status: DownloadStatus };

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
      return undefined;
  }
};

const completedDateFormat = new Intl.DateTimeFormat();

// Only the progress part re-renders on the download's ticks
const DownloadProgressInfo = memo(({ id, onCancel }: { id: string; onCancel: (id: string) => void }) => {
  const progress = useDownloadStore((state) => state.downloads[id]?.progress);
  const preparing = useDownloadStore((state) => isPreparing(state.downloads[id]));
  const percent = Math.round(progress?.percentage || 0);
  const bytesPerSecond = progress ? downloadBytesPerSecond(progress) : 0;

  return (
    <HUYStack className="mt-2 gap-2">
      <Progress value={percent} indeterminate={preparing} />
      <HUXStack className="flex-row items-center justify-between">
        <HUXStack className="flex-row items-center gap-3">
          <Text className="text-sm font-semibold text-foreground">{preparing ? 'Getting ready…' : `${percent}%`}</Text>
          {!!bytesPerSecond && <Text className="text-xs text-foreground">{formatBytes(bytesPerSecond)}/s</Text>}
        </HUXStack>
        {!!progress?.currentTime && !!progress?.totalDuration && (
          <Text className="text-sm text-foreground">
            {formatTime(progress.currentTime)} / {formatTime(progress.totalDuration)}
          </Text>
        )}
      </HUXStack>
      <RippleButton
        testID="download-card-cancel"
        className="mt-2 items-center justify-center gap-2 rounded-xl p-3"
        onPress={() => onCancel(id)}>
        <IconTitle iconName="pause-circle-outline" text="Cancel" />
      </RippleButton>
    </HUYStack>
  );
});
DownloadProgressInfo.displayName = 'DownloadProgressInfo';

// A finished download: watch it here, or hand the file to another player
const DownloadedActions = memo(({ id, canPlay }: { id: string; canPlay: boolean }) => {
  const router = useRouter();
  const { toast } = useToast();

  const play = () => {
    const params = useDownloadStore.getState().downloads[id]?.watchParams;
    if (params) router.push(watchHref(params));
  };

  const openElsewhere = async () => {
    const download = useDownloadStore.getState().downloads[id];
    const uri = downloadedFileUri(download);
    if (!uri) return;
    try {
      await openVideoInOtherApp(uri, download?.name);
    } catch (e) {
      toast.show({ variant: 'danger', label: "Couldn't open the download", description: String((e as Error).message) });
    }
  };

  return (
    <HUXStack className="mt-2 gap-2">
      {canPlay && (
        <RippleButton
          testID="download-card-play"
          className="flex-1 items-center justify-center rounded-xl p-3"
          onPress={play}>
          <IconTitle iconName="play-outline" text="Play" />
        </RippleButton>
      )}
      <RippleButton
        testID="download-card-open"
        className="flex-1 items-center justify-center rounded-xl p-3"
        onPress={openElsewhere}>
        <IconTitle iconName="open-outline" text="Open in another app" />
      </RippleButton>
    </HUXStack>
  );
});
DownloadedActions.displayName = 'DownloadedActions';

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
        const d = state.downloads[id];
        return {
          name: d?.name,
          showName: d?.showName,
          season: d?.season,
          episode: d?.episode,
          fileSize: d?.fileSize,
          status: d?.status ?? 'pending',
          error: d?.error,
          completedAt: d?.completedAt,
          canPlay: !!d?.watchParams,
        };
      }),
    );
    const pureBlackBackground = useCurrentTheme().isPureBlack;
    const { status } = download;

    return (
      <Card
        testID="download-card"
        className={cn('m-2 rounded-2xl bg-background border border-default', pureBlackBackground && 'bg-black')}>
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
              <RippleButton
                testID="download-card-remove"
                onPress={() => onRemove(id, status)}
                accessibilityLabel={`Remove ${download.name}`}>
                <IoniconsIcon name="trash-outline" size={20} />
              </RippleButton>
            </HUXStack>
          </HUXStack>
        </Card.Header>
        <Card.Body>
          {isActive(status) && <DownloadProgressInfo id={id} onCancel={onCancel} />}
          {status === 'completed' && <DownloadedActions id={id} canPlay={download.canPlay} />}
        </Card.Body>

        <Card.Footer>
          {!isActive(status) && (
            <HUXStack className="mt-2 flex-row items-center gap-2">
              <Text className="text-sm font-medium text-foreground" style={{ color: getStatusColor(status) }}>
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
  const pureBlackBackground = useCurrentTheme().isPureBlack;
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
  <HUYStack testID="downloads-empty" className="flex-1 items-center justify-center gap-4 p-8">
    <IoniconsIcon name="folder-outline" size={64} className="text-foreground" />
    <Text className="text-center text-2xl font-semibold text-foreground/50">No Downloads</Text>
    <Text className="max-w-75 text-center text-base text-foreground/40">
      {`Downloaded episodes will appear here. ${isTV ? 'Hold OK on' : 'Long press'} an episode to access download options.`}
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
    Object.values(state.downloads)
      .map(({ id, status }) => `${status}\t${id}`)
      .join('\n'),
  );
  const pureBlackBackground = useCurrentTheme().isPureBlack;
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [clearCompletedDialogOpen, setClearCompletedDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [selectedDownloadId, setSelectedDownloadId] = useState<string | null>(null);
  const [selectedDownloadStatus, setSelectedDownloadStatus] = useState<string>('');
  const insets = useSafeAreaInsets();

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

  const downloadsSize = useDownloadsSize();

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
      <ThemedView testID="downloads-screen">
        <HUYStack testID="downloads-loading" className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-xl text-foreground/70">Initializing downloads...</Text>
        </HUYStack>
      </ThemedView>
    );
  }

  return (
    <ThemedView testID="downloads-screen">
      <HUYStack className="gap-3 p-4" style={{ backgroundColor: pureBlackBackground ? '#000' : undefined }}>
        <HUXStack className="flex-row items-center justify-between">
          <HUXStack className="flex-row items-center gap-2">
            <MaterialIconsIcon name="sd-card" className="text-foreground" />
            <Text className="text-base text-foreground/70">Storage Used</Text>
          </HUXStack>
          <Text className="text-lg font-semibold text-foreground">{formatBytes(downloadsSize ?? 0)}</Text>
        </HUXStack>
        <HUXStack className="flex-row items-center justify-between">
          <HUXStack className="flex-row items-center gap-2">
            <IoniconsIcon name="folder-outline" className="text-foreground" />
            <Text className="text-base text-foreground/70">Total Downloads</Text>
          </HUXStack>
          <Text className="text-lg font-semibold text-foreground">{completedIds.length}</Text>
        </HUXStack>

        {entries.length > 0 && (
          <HUXStack className="mt-2 flex-row gap-2">
            {completedIds.length > 0 && (
              <RippleButton
                testID="downloads-clear-completed"
                onPress={handleClearCompleted}
                style={{ flex: 1 }}
                className="flex-1 items-center justify-center gap-2 rounded-xl p-3">
                <IconTitle iconName="trash-outline" text="Clear Completed" />
              </RippleButton>
            )}
            <RippleButton
              testID="downloads-clear-all"
              onPress={handleClearAll}
              style={{ flex: 1 }}
              className="flex-1 items-center justify-center gap-2 rounded-xl p-3">
              <IconTitle iconName="trash-outline" text="Clear All" />
            </RippleButton>
          </HUXStack>
        )}
      </HUYStack>

      <Separator />

      <List<DownloadListItem>
        testID="downloads-list"
        data={listData}
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
        keyExtractor={(item) => (item.type === 'header' ? `header-${item.title}` : `item-${item.id}`)}
        getItemType={(item) => item.type}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyState />}
      />

      <ConfirmDialog
        testID="downloads-remove-dialog"
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
        testID="downloads-cancel-dialog"
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Download"
        description="Stop downloading this episode?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={confirmCancelDownload}
      />

      <ConfirmDialog
        testID="downloads-clear-completed-dialog"
        open={clearCompletedDialogOpen}
        onOpenChange={setClearCompletedDialogOpen}
        title="Clear Completed"
        description={`Remove ${completedIds.length} completed download${completedIds.length > 1 ? 's' : ''}?`}
        confirmText="Clear"
        onConfirm={confirmClearCompleted}
      />

      <ConfirmDialog
        testID="downloads-clear-all-dialog"
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
