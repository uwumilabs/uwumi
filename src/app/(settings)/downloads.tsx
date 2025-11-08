import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemedView, CustomFlashlist } from '@/components';
import { Text, YStack, XStack, Progress, Spinner, Separator, styled, AlertDialog, Button } from 'tamagui';
import { useDownloadStore, usePureBlackBackground, useSheetColor } from '@/hooks';
import { Download, CheckCircle2, XCircle, Trash2, PauseCircle, Folder, HardDrive, Clock } from '@tamagui/lucide-icons';
import { formatTime } from '@/constants/utils';
import { IconTitle, RippleButton } from '@/components/ui-primitives';
// import * as Haptics from 'expo-haptics';

const StyledText = styled(Text, {
  fontWeight: '500',
  color: '$color1',
  fontSize: '$2.5',
  opacity: 0.7,
});

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.5)"
        />
        <AlertDialog.Content
          bordered
          elevate
          key="content"
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          x={0}
          scale={1}
          opacity={1}
          y={0}
          backgroundColor={sheetColor}>
          <YStack gap="$3">
            <AlertDialog.Title fontWeight="700" color="$color">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description color="$color1" opacity={0.8}>
              {description}
            </AlertDialog.Description>

            <XStack gap="$3" justifyContent="flex-end">
              <AlertDialog.Cancel asChild>
                <Button backgroundColor="$color4" color="$color" pressStyle={{ opacity: 0.8 }}>
                  {cancelText}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button backgroundColor="$color" color="$color2" onPress={onConfirm}>
                  {confirmText}
                </Button>
              </AlertDialog.Action>
            </XStack>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
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
        return <Download size={20} />;
      case 'completed':
        return <CheckCircle2 size={20} />;
      case 'failed':
      case 'cancelled':
        return <XCircle size={20} />;
      case 'pending':
        return <Clock size={20} />;
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
        <YStack
          padding="$4"
          marginVertical="$2"
          borderRadius="$4"
          backgroundColor={pureBlackBackground ? '#000' : '$color3'}
          borderWidth={1}
          borderColor="$color4">
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$2">
            <YStack flex={1} gap="$1">
              {item.showName && (
                <Text fontSize="$2.5" color="$color1" opacity={0.6} numberOfLines={1}>
                  {item.showName}
                </Text>
              )}
              <Text fontSize="$4" fontWeight="600" color="$color" width={'90%'} numberOfLines={1}>
                {item.name}
              </Text>
              <XStack gap="$2" alignItems="center">
                <Text fontSize="$2.5" color="$color1" opacity={0.7}>
                  {item.season ? `S${item.season} ` : ''}
                  {`E${item.episode}`}
                </Text>
                {item.fileSize && (
                  <>
                    <Text fontSize="$2.5" color="$color1" opacity={0.5}>
                      •
                    </Text>
                    <Text fontSize="$2.5" color="$color1" opacity={0.7}>
                      {formatBytes(item.fileSize)}
                    </Text>
                  </>
                )}
              </XStack>
            </YStack>

            <XStack gap="$2" alignItems="center">
              {getStatusIcon(item.status)}
              <RippleButton onPress={() => handleRemoveDownload(item.id, item.status)}>
                <Trash2 size={20} color="$color" />
              </RippleButton>
            </XStack>
          </XStack>

          {/* Progress Bar for Downloading */}
          {item.status === 'downloading' && (
            <YStack gap="$2" marginTop="$2">
              <Progress size="$1" backgroundColor="$color4" value={Math.round(progress)} max={100} borderRadius="$2">
                <Progress.Indicator animation="bouncy" backgroundColor="$color" />
              </Progress>
              <XStack justifyContent="space-between" alignItems="center">
                <XStack gap="$3" alignItems="center">
                  <Text fontSize="$2.5" fontWeight="600">
                    {Math.round(progress)}%
                  </Text>
                  {item.progress?.speed && <StyledText>{formatBytes(item.progress.speed)}/s</StyledText>}
                </XStack>
                {item.progress?.currentTime && item.progress?.totalDuration && (
                  <StyledText>
                    {formatTime(item.progress.currentTime)} / {formatTime(item.progress.totalDuration)}
                  </StyledText>
                )}
              </XStack>
              <RippleButton
                containerStyle={{
                  gap: '$2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '$2',
                  borderRadius: '$2',
                  backgroundColor: '$color4',
                }}
                onPress={() => handleCancelDownload(item.id)}>
                <IconTitle icon={PauseCircle} text="Cancel" />
              </RippleButton>
            </YStack>
          )}

          {/* Status Info */}
          {item.status !== 'downloading' && (
            <XStack marginTop="$2" gap="$2" alignItems="center">
              <Text fontSize="$2.5" color={getStatusColor(item.status)} fontWeight="500">
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
              {item.error && (
                <>
                  <Text fontSize="$2.5" color="$color1" opacity={0.5}>
                    •
                  </Text>
                  <Text fontSize="$2.5" numberOfLines={1} flex={1}>
                    {item.error}
                  </Text>
                </>
              )}
              {item.completedAt && (
                <>
                  <Text fontSize="$2.5" color="$color1" opacity={0.5}>
                    •
                  </Text>
                  <Text fontSize="$2.5" color="$color1" opacity={0.7}>
                    {new Date(item.completedAt).toLocaleDateString()}
                  </Text>
                </>
              )}
            </XStack>
          )}
        </YStack>
      );
    },
    [pureBlackBackground, handleRemoveDownload, handleCancelDownload, formatBytes, getStatusIcon, getStatusColor],
  );

  const renderSectionHeader = useCallback(
    (title: string, count: number, action?: () => void, actionText?: string) => {
      if (count === 0) return null;
      return (
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$3"
          justifyContent="space-between"
          alignItems="center"
          backgroundColor={pureBlackBackground ? '#000' : '$color2'}>
          <Text fontSize="$4" fontWeight="600" color="$color">
            {title} ({count})
          </Text>
          {action && actionText && (
            <RippleButton onPress={action}>
              <Text fontSize="$3" fontWeight="500">
                {actionText}
              </Text>
            </RippleButton>
          )}
        </XStack>
      );
    },
    [pureBlackBackground],
  );

  const renderEmptyState = () => (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$8" gap="$4">
      <Folder size={64} color="$color1" opacity={0.3} />
      <Text fontSize="$5" fontWeight="600" color="$color1" opacity={0.5} textAlign="center">
        No Downloads
      </Text>
      <Text fontSize="$3" color="$color1" opacity={0.4} textAlign="center" maxWidth={300}>
        Downloaded episodes will appear here. Long press an episode to access download options.
      </Text>
    </YStack>
  );

  if (!isInitialized) {
    return (
      <ThemedView>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" color="$color" />
          <Text fontSize="$4" color="$color1" marginTop="$4">
            Initializing downloads...
          </Text>
        </YStack>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      {/* Storage Info Header */}
      <YStack backgroundColor={pureBlackBackground ? '#000' : '$color2'} padding="$4" gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center">
            <HardDrive size={20} color="$color1" opacity={0.7} />
            <Text fontSize="$3" color="$color1" opacity={0.7}>
              Storage Used
            </Text>
          </XStack>
          <Text fontSize="$4" fontWeight="600" color="$color">
            {formatBytes(storageInfo.downloadsSize)}
          </Text>
        </XStack>
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center">
            <Folder size={20} color="$color1" opacity={0.7} />
            <Text fontSize="$3" color="$color1" opacity={0.7}>
              Total Downloads
            </Text>
          </XStack>
          <Text fontSize="$4" fontWeight="600" color="$color">
            {storageInfo.totalDownloads}
          </Text>
        </XStack>

        {/* Action Buttons */}
        {downloadList.length > 0 && (
          <XStack gap="$2" marginTop="$2">
            {groupedDownloads.completed.length > 0 && (
              <RippleButton
                onPress={handleClearCompleted}
                style={{ flex: 1 }}
                containerStyle={{
                  gap: '$2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '$3',
                  borderRadius: '$3',
                  backgroundColor: '$color4',
                }}>
                <IconTitle icon={Trash2} text="Clear Completed" />
              </RippleButton>
            )}
            <RippleButton
              onPress={handleClearAll}
              style={{ flex: 1 }}
              containerStyle={{
                gap: '$2',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '$3',
                borderRadius: '$3',
              }}>
              <IconTitle icon={Trash2} text="Clear All" />
            </RippleButton>
          </XStack>
        )}
      </YStack>

      <Separator borderColor="$color3" />

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
