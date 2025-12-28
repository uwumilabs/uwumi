import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ThemedView,
  CustomFlashlist,
  HUXStack,
  HUYStack,
  Progress,
  IconTitle,
  IoniconsIcon,
  RippleButton,
} from '@/components';
import { useDownloadStore, usePureBlackBackground, useSheetColor, useCurrentTheme } from '@/hooks';
import { formatTime } from '@/constants/utils';
import { ActivityIndicator, Text } from 'react-native';
import { Divider, Dialog, Button, Card, cn } from 'heroui-native';
import { MaterialIconsIcon } from '@/components/Icons';

// Reusable Confirm Dialog Component
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
}

const Downloads = () => {
  const {
    downloads,
    initialize,
    isInitialized,
    removeDownload,
    cancelDownload,
    clearCompleted,
    clearAll,
    getStorageInfo,
  } = useDownloadStore();

  const [storageInfo, setStorageInfo] = useState({ downloadsSize: 0, totalDownloads: 0 });
  const sheetColor = useSheetColor();
  const currentTheme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground();
  // Alert dialog states
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [clearCompletedDialogOpen, setClearCompletedDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [selectedDownloadId, setSelectedDownloadId] = useState<string | null>(null);
  const [selectedDownloadStatus, setSelectedDownloadStatus] = useState<string>('');

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized) {
      // getStorageInfo is now async
      getStorageInfo().then((info) => {
        setStorageInfo({ downloadsSize: info.downloadsSize, totalDownloads: info.totalDownloads });
      });
    }
  }, [isInitialized, downloads, getStorageInfo]);

  const downloadList = useMemo(() => Object.values(downloads), [downloads]);

  // Dummy data for testing - uncomment to preview UI with sample downloads
  // const downloadList = useMemo(
  //   () => [
  //     // Downloading
  //     {
  //       id: 'dummy-1',
  //       name: 'Attack on Titan',
  //       showName: 'Shingeki no Kyojin',
  //       episode: 15,
  //       season: 4,
  //       status: 'downloading',
  //       progress: {
  //         percentage: 45,
  //         currentTime: 540,
  //         totalDuration: 1200,
  //         speed: 2048000,
  //         bitrate: 5000000,
  //         size: 150000000,
  //       },
  //       fileSize: 350000000,
  //       createdAt: Date.now() - 600000,
  //     },
  //     {
  //       id: 'dummy-2',
  //       name: 'Demon Slayer Movie',
  //       showName: 'Kimetsu no Yaiba',
  //       episode: 1,
  //       status: 'downloading',
  //       progress: {
  //         percentage: 78,
  //         currentTime: 3600,
  //         totalDuration: 4620,
  //         speed: 5242880,
  //         bitrate: 8000000,
  //         size: 520000000,
  //       },
  //       fileSize: 720000000,
  //       createdAt: Date.now() - 1800000,
  //     },
  //     // Pending
  //     {
  //       id: 'dummy-3',
  //       name: 'One Piece',
  //       showName: 'One Piece',
  //       episode: 1050,
  //       status: 'pending',
  //       createdAt: Date.now() - 300000,
  //     },
  //     {
  //       id: 'dummy-4',
  //       name: 'Jujutsu Kaisen',
  //       showName: 'JJK',
  //       episode: 24,
  //       season: 2,
  //       status: 'pending',
  //       createdAt: Date.now() - 150000,
  //     },
  //     // Completed
  //     {
  //       id: 'dummy-5',
  //       name: 'Naruto Shippuden',
  //       showName: 'Naruto',
  //       episode: 500,
  //       season: 1,
  //       status: 'completed',
  //       fileSize: 450000000,
  //       outputFile: '/storage/downloads/Naruto_S1_E500.mp4',
  //       createdAt: Date.now() - 7200000,
  //       completedAt: Date.now() - 3600000,
  //     },
  //     {
  //       id: 'dummy-6',
  //       name: 'My Hero Academia',
  //       showName: 'Boku no Hero Academia',
  //       episode: 12,
  //       season: 6,
  //       status: 'completed',
  //       fileSize: 380000000,
  //       outputFile: '/storage/downloads/MHA_S6_E12.mp4',
  //       createdAt: Date.now() - 86400000,
  //       completedAt: Date.now() - 82800000,
  //     },
  //     {
  //       id: 'dummy-7',
  //       name: 'Chainsaw Man',
  //       episode: 8,
  //       season: 1,
  //       status: 'completed',
  //       fileSize: 420000000,
  //       outputFile: '/storage/downloads/Chainsaw_Man_S1_E8.mp4',
  //       createdAt: Date.now() - 172800000,
  //       completedAt: Date.now() - 169200000,
  //     },
  //     // Failed
  //     {
  //       id: 'dummy-8',
  //       name: 'Tokyo Revengers',
  //       showName: 'Tokyo Revengers',
  //       episode: 7,
  //       season: 2,
  //       status: 'failed',
  //       error: 'Network connection lost',
  //       createdAt: Date.now() - 43200000,
  //     },
  //     {
  //       id: 'dummy-9',
  //       name: 'Spy x Family',
  //       episode: 3,
  //       season: 2,
  //       status: 'cancelled',
  //       createdAt: Date.now() - 21600000,
  //     },
  //     {
  //       id: 'dummy-10',
  //       name: 'Bleach TYBW',
  //       showName: 'Bleach: Thousand-Year Blood War',
  //       episode: 5,
  //       status: 'failed',
  //       error: 'Insufficient storage space',
  //       createdAt: Date.now() - 10800000,
  //     },
  //   ],
  //   [],
  // );

  const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    onOpenChange,
    title,
    description,
    confirmText,
    cancelText = 'Cancel',
    onConfirm,
  }) => (
    <Dialog isOpen={open} onOpenChange={onOpenChange} closeDelay={200}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50" />
        <Dialog.Content className="rounded-3xl bg-background p-4">
          <Dialog.Close className="absolute right-3 top-3" />
          <HUYStack className="gap-3">
            <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
            <Dialog.Description className="text-base text-foreground/80">{description}</Dialog.Description>
            <HUXStack className="flex-row justify-end gap-3">
              <Dialog.Close asChild>
                <Button variant="ghost" className="min-w-[100px]">
                  {cancelText}
                </Button>
              </Dialog.Close>
              <Button onPress={onConfirm} className="min-w-[100px]" variant="primary">
                {confirmText}
              </Button>
            </HUXStack>
          </HUYStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
  // Group downloads by status
  const groupedDownloads = useMemo(() => {
    const downloading = downloadList.filter((d) => d.status === 'downloading');
    const pending = downloadList.filter((d) => d.status === 'pending');
    const completed = downloadList.filter((d) => d.status === 'completed');
    const failed = downloadList.filter((d) => d.status === 'failed' || d.status === 'cancelled');

    return { downloading, pending, completed, failed };
  }, [downloadList]);

  const handleRemoveDownload = useCallback((downloadId: string, status: string) => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedDownloadId(downloadId);
    setSelectedDownloadStatus(status);
    setRemoveDialogOpen(true);
  }, []);

  const confirmRemoveDownload = useCallback(async () => {
    if (selectedDownloadId) {
      await removeDownload(selectedDownloadId);
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRemoveDialogOpen(false);
      setSelectedDownloadId(null);
    }
  }, [selectedDownloadId, removeDownload]);

  const handleCancelDownload = useCallback((downloadId: string) => {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedDownloadId(downloadId);
    setCancelDialogOpen(true);
  }, []);

  const confirmCancelDownload = useCallback(async () => {
    if (selectedDownloadId) {
      await cancelDownload(selectedDownloadId);
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCancelDialogOpen(false);
      setSelectedDownloadId(null);
    }
  }, [selectedDownloadId, cancelDownload]);

  const handleClearCompleted = useCallback(() => {
    if (groupedDownloads.completed.length === 0) return;
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setClearCompletedDialogOpen(true);
  }, [groupedDownloads.completed.length]);

  const confirmClearCompleted = useCallback(async () => {
    await clearCompleted();
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setClearCompletedDialogOpen(false);
  }, [clearCompleted]);

  const handleClearAll = useCallback(() => {
    if (downloadList.length === 0) return;
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setClearAllDialogOpen(true);
  }, [downloadList.length]);

  const confirmClearAll = useCallback(async () => {
    await clearAll();
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setClearAllDialogOpen(false);
  }, [clearAll]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'downloading':
        return <IoniconsIcon name="download-outline" size={20} />;
      case 'completed':
        return <IoniconsIcon name="checkmark-circle-outline" size={20} />;
      case 'failed':
      case 'cancelled':
        return <IoniconsIcon name="close-circle-outline" size={20} />;
      case 'pending':
        return <IoniconsIcon name="time-outline" size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading':
        return '$color1';
      case 'completed':
        return 'green';
      case 'failed':
      case 'cancelled':
        return 'red';
      case 'pending':
        return '$color1';
      default:
        return '$color1';
    }
  };

  const renderDownloadItem = useCallback(
    ({ item }: { item: any }) => {
      const progress = item.progress?.percentage || 0;

      return (
        <Card className={cn('m-2 rounded-2xl bg-background border border-default', pureBlackBackground && 'bg-black')}>
          {/* Header */}
          <Card.Header>
            <HUXStack className="mb-2 flex-row items-start justify-between">
              <HUYStack className="flex-1 gap-1">
                {item.showName && (
                  <Text className="text-sm text-foreground/60" numberOfLines={1}>
                    {item.showName}
                  </Text>
                )}
                <Card.Title className="w-[90%]" numberOfLines={1}>
                  {item.name}
                </Card.Title>
                <HUXStack className="flex-row items-center gap-2">
                  <Text className="text-sm text-foreground/70">
                    {item.season ? `S${item.season} ` : ''}
                    {`E${item.episode}`}
                  </Text>
                  {item.fileSize && (
                    <>
                      <Text className="text-sm text-foreground/50">•</Text>
                      <Text className="text-sm text-foreground/70">{formatBytes(item.fileSize)}</Text>
                    </>
                  )}
                </HUXStack>
              </HUYStack>

              <HUXStack className="flex-row items-center gap-2">
                {getStatusIcon(item.status)}
                <RippleButton onPress={() => handleRemoveDownload(item.id, item.status)}>
                  <IoniconsIcon name="trash-outline" size={20} />
                </RippleButton>
              </HUXStack>
            </HUXStack>
          </Card.Header>
          <Card.Body>
            {/* Progress Bar for Downloading */}
            {item.status === 'downloading' && (
              <HUYStack className="mt-2 gap-2">
                <Progress value={Math.round(progress)} />
                <HUXStack className="flex-row items-center justify-between">
                  <HUXStack className="flex-row items-center gap-3">
                    <Text className="text-sm font-semibold text-foreground">{Math.round(progress)}%</Text>
                    {item.progress?.speed && (
                      <Text className="text-xs text-foreground">{formatBytes(item.progress.speed)}/s</Text>
                    )}
                  </HUXStack>
                  {item.progress?.currentTime && item.progress?.totalDuration && (
                    <Text className="text-sm text-foreground">
                      {formatTime(item.progress.currentTime)} / {formatTime(item.progress.totalDuration)}
                    </Text>
                  )}
                </HUXStack>
                <RippleButton
                  className="mt-2 items-center justify-center gap-2 rounded-xl p-3"
                  onPress={() => handleCancelDownload(item.id)}>
                  <IconTitle iconName="pause-circle-outline" text="Cancel" />
                </RippleButton>
              </HUYStack>
            )}
          </Card.Body>

          {/* Status Info */}
          <Card.Footer>
            {item.status !== 'downloading' && (
              <HUXStack className="mt-2 flex-row items-center gap-2">
                <Text className="text-sm font-medium" style={{ color: getStatusColor(item.status) }}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
                {item.error && (
                  <>
                    <Text className="text-sm text-foreground/50">•</Text>
                    <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                      {item.error}
                    </Text>
                  </>
                )}
                {item.completedAt && (
                  <>
                    <Text className="text-sm text-foreground/50">•</Text>
                    <Text className="text-sm text-foreground/70">
                      {new Date(item.completedAt).toLocaleDateString()}
                    </Text>
                  </>
                )}
              </HUXStack>
            )}
          </Card.Footer>
        </Card>
      );
    },
    [pureBlackBackground, handleRemoveDownload, handleCancelDownload, formatBytes, getStatusIcon, getStatusColor],
  );

  const renderSectionHeader = useCallback(
    (title: string, count: number, action?: () => void, actionText?: string) => {
      if (count === 0) return null;
      return (
        <HUXStack
          className="flex-row items-center justify-between px-4 py-3"
          style={{ backgroundColor: pureBlackBackground ? '#000' : undefined }}>
          <Text className="text-lg font-semibold text-foreground">
            {title} ({count})
          </Text>
          {action && actionText && (
            <RippleButton onPress={action}>
              <Text className="text-base font-medium text-foreground">{actionText}</Text>
            </RippleButton>
          )}
        </HUXStack>
      );
    },
    [pureBlackBackground],
  );

  const renderEmptyState = () => (
    <HUYStack className="flex-1 items-center justify-center gap-4 p-8">
      <IoniconsIcon name="folder-outline" size={64} className="text-foreground" />
      <Text className="text-center text-2xl font-semibold text-foreground/50">No Downloads</Text>
      <Text className="max-w-[300px] text-center text-base text-foreground/40">
        Downloaded episodes will appear here. Long press an episode to access download options.
      </Text>
    </HUYStack>
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
        {downloadList.length > 0 && (
          <HUXStack className="mt-2 flex-row gap-2">
            {groupedDownloads.completed.length > 0 && (
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

      <Divider />

      {/* Downloads List */}
      <CustomFlashlist
        data={[
          ...(groupedDownloads.downloading.length > 0
            ? [{ type: 'header' as const, title: 'Downloading', count: groupedDownloads.downloading.length }]
            : []),
          ...groupedDownloads.downloading.map((d) => ({ type: 'item' as const, data: d })),

          ...(groupedDownloads.pending.length > 0
            ? [{ type: 'header' as const, title: 'Pending', count: groupedDownloads.pending.length }]
            : []),
          ...groupedDownloads.pending.map((d) => ({ type: 'item' as const, data: d })),

          ...(groupedDownloads.completed.length > 0
            ? [{ type: 'header' as const, title: 'Completed', count: groupedDownloads.completed.length }]
            : []),
          ...groupedDownloads.completed.map((d) => ({ type: 'item' as const, data: d })),

          ...(groupedDownloads.failed.length > 0
            ? [{ type: 'header' as const, title: 'Failed', count: groupedDownloads.failed.length }]
            : []),
          ...groupedDownloads.failed.map((d) => ({ type: 'item' as const, data: d })),
        ]}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyExtractor={(item: any, index) => (item.type === 'header' ? `header-${item.title}` : `item-${item.data.id}`)}
        renderItem={({ item }: any) => {
          if (item.type === 'header') {
            return renderSectionHeader(item.title, item.count);
          }
          return renderDownloadItem({ item: item.data });
        }}
        ListEmptyComponent={renderEmptyState()}
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
        description={`Remove ${groupedDownloads.completed.length} completed download${groupedDownloads.completed.length > 1 ? 's' : ''}?`}
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
