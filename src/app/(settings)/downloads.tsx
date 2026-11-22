import React, { memo, useCallback, useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { isTV } from '@/utils/tv';
import { watchHref } from '@/utils/routes';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { ThemedView, HUXStack, HUYStack } from '@/components/ui-primitives';
import { HorizontalTabs } from '@/components/HorizontalTabs';
import { Button } from '@/components/Button';
import { IoniconsIcon, type IoniconProps } from '@/components/Icons';
import { EpisodeThumbnail } from '@/components/episode-list/EpisodeThumbnail';
import { DownloadList, LEADING_RADIUS } from '@/components/downloads/DownloadList';
import { Separator } from '@/components/native/separator/Separator';
import { downloadedFileUri, useDownloadStore, useDownloadsSize } from '@/downloads/useDownloadStore';
import { downloadBytesPerSecond, downloadLabels, isPreparing, type DownloadStatus } from '@/downloads/model';
import { formatBytes, formatTime } from '@/utils/format';
import { openVideoInOtherApp } from '@/utils/share';
import { Chip, cn, useToast } from '@/components/heroui';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type SectionKey = 'downloading' | 'pending' | 'completed' | 'failed';

const SECTIONS: {
  key: SectionKey;
  title: string;
  statuses: DownloadStatus[];
  icon: IoniconProps['name'];
  tone: string;
}[] = [
  { key: 'downloading', title: 'Downloading', statuses: ['downloading'], icon: 'cloud-download', tone: 'text-accent' },
  { key: 'pending', title: 'Pending', statuses: ['pending'], icon: 'time-outline', tone: 'text-accent' },
  { key: 'completed', title: 'Completed', statuses: ['completed'], icon: 'checkmark-circle', tone: 'text-success' },
  { key: 'failed', title: 'Failed', statuses: ['failed', 'cancelled'], icon: 'warning', tone: 'text-danger' },
];

type Entry = { id: string; status: DownloadStatus };

const getStatusColor = (status: DownloadStatus): ComponentProps<typeof Chip>['color'] => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
};

const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const longDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
// The year only when it isn't this one, to keep the compact rows' details short
const formatCompletedDate = (time: number) =>
  (new Date(time).getFullYear() === new Date().getFullYear() ? shortDate : longDate).format(time);
const joinDetails = (...details: (string | undefined)[]) => details.filter(Boolean).join('  •  ');

/** The fields a row shows. Progress ticks change none of them, so they don't re-render the row */
const useDownloadRow = (id: string) =>
  useDownloadStore(
    useShallow((state) => {
      const d = state.downloads[id];
      return {
        name: d?.name,
        showName: d?.showName,
        season: d?.season,
        episode: d?.episode,
        image: d?.image ?? d?.watchParams?.poster,
        uniqueId: d?.uniqueId,
        watchParams: d?.watchParams,
        fileSize: d?.fileSize,
        status: d?.status ?? 'pending',
        error: d?.error,
        completedAt: d?.completedAt,
      };
    }),
  );

const SUMMARY_RADIUS = 16;

const Surface = ({ className, children }: { className?: string; children: ReactNode }) => {
  const { barBackground } = useCurrentTheme();
  return (
    <View
      className={cn('border border-separator/60 p-4', className)}
      style={{ backgroundColor: barBackground, borderRadius: SUMMARY_RADIUS }}>
      {children}
    </View>
  );
};

interface RowProps {
  id: string;
  onRemove: (id: string, status: DownloadStatus) => void;
  onCancel: (id: string) => void;
}

// Downloading or queued: the progress, with Cancel and Remove. The only rows that re-render on progress ticks
const ActiveRow = ({ id, onRemove, onCancel }: RowProps) => {
  const download = useDownloadRow(id);
  const progress = useDownloadStore((state) => state.downloads[id]?.progress);
  const preparing = useDownloadStore((state) => isPreparing(state.downloads[id]));
  const labels = downloadLabels(download);
  const queued = download.status === 'pending';
  const percent = Math.round(progress?.percentage || 0);
  const bytesPerSecond = progress ? downloadBytesPerSecond(progress) : 0;
  return (
    <DownloadList.Item
      testID="download-card"
      overline={labels.show}
      title={labels.title}
      description={labels.number}
      leading={
        <EpisodeThumbnail
          image={download.image}
          uniqueId={download.uniqueId}
          width={96}
          height={60}
          radius={LEADING_RADIUS}
        />
      }
      progress={{
        value: percent,
        indeterminate: preparing,
        caption: preparing
          ? 'Getting ready…'
          : joinDetails(`${percent}%`, bytesPerSecond ? `${formatBytes(bytesPerSecond)}/s` : undefined),
        detail:
          progress?.currentTime && progress.totalDuration
            ? `${formatTime(progress.currentTime)} / ${formatTime(progress.totalDuration)}`
            : undefined,
      }}
      actions={[
        {
          testID: 'download-card-cancel',
          icon: queued ? 'close-circle-outline' : 'stop-circle-outline',
          label: `Cancel ${labels.title}`,
          onPress: () => onCancel(id),
        },
        {
          testID: 'download-card-remove',
          icon: 'trash-outline',
          label: `Remove ${labels.title}`,
          onPress: () => onRemove(id, download.status),
        },
      ]}
    />
  );
};

// A finished download: Play, another player, or Remove
const CompletedRow = ({ id, onRemove }: Omit<RowProps, 'onCancel'>) => {
  const download = useDownloadRow(id);
  const labels = downloadLabels(download);
  const router = useRouter();
  const { toast } = useToast();
  const title = labels.show ?? labels.title;

  const openElsewhere = async () => {
    const uri = downloadedFileUri(useDownloadStore.getState().downloads[id]);
    if (!uri) return;
    try {
      await openVideoInOtherApp(uri, download.name);
    } catch (e) {
      toast.show({ variant: 'danger', label: "Couldn't open the download", description: String((e as Error).message) });
    }
  };

  return (
    <DownloadList.Item
      testID="download-card"
      title={title}
      description={joinDetails(
        labels.number,
        download.fileSize ? formatBytes(download.fileSize, 1) : undefined,
        download.completedAt ? formatCompletedDate(download.completedAt) : undefined,
      )}
      leading={
        <EpisodeThumbnail
          image={download.image}
          uniqueId={download.uniqueId}
          width={80}
          height={50}
          radius={LEADING_RADIUS}>
          <IoniconsIcon name="checkmark-circle" size={18} className="absolute bottom-1 right-1 text-success" />
        </EpisodeThumbnail>
      }
      actions={[
        ...(download.watchParams
          ? [
              {
                testID: 'download-card-play',
                icon: 'play' as const,
                label: `Play ${title}`,
                onPress: () => download.watchParams && router.push(watchHref(download.watchParams)),
              },
            ]
          : []),
        {
          testID: 'download-card-open',
          icon: 'open-outline',
          label: `Open ${title} in another app`,
          onPress: openElsewhere,
        },
        {
          testID: 'download-card-remove',
          icon: 'trash-outline',
          label: `Remove ${title}`,
          onPress: () => onRemove(id, download.status),
        },
      ]}
    />
  );
};

// Failed or cancelled: why, with Retry and Remove
const FailedRow = ({ id, onRemove }: Omit<RowProps, 'onCancel'>) => {
  const download = useDownloadRow(id);
  const labels = downloadLabels(download);
  return (
    <DownloadList.Item
      testID="download-card"
      overline={labels.show}
      title={labels.title}
      status={
        <Chip size="sm" color={getStatusColor(download.status)}>
          <Chip.Label>{download.status === 'cancelled' ? 'Cancelled' : 'Failed'}</Chip.Label>
        </Chip>
      }
      description={joinDetails(labels.number, download.error)}
      leading={
        <EpisodeThumbnail
          image={download.image}
          uniqueId={download.uniqueId}
          width={80}
          height={50}
          radius={LEADING_RADIUS}
        />
      }
      actions={[
        {
          testID: 'download-card-retry',
          icon: 'refresh',
          label: `Retry ${labels.title}`,
          onPress: () => useDownloadStore.getState().retryDownload(id),
        },
        {
          testID: 'download-card-remove',
          icon: 'trash-outline',
          label: `Remove ${labels.title}`,
          onPress: () => onRemove(id, download.status),
        },
      ]}
    />
  );
};

const SectionHeader = memo(({ section, count }: { section: SectionKey; count: number }) => {
  const { title, icon, tone } = SECTIONS.find(({ key }) => key === section)!;
  return (
    <HUXStack className="flex-row items-center gap-2.5 pb-2 pt-4">
      <IoniconsIcon name={icon} size={22} className={tone} />
      <Text className="text-lg font-bold text-foreground">
        {title} ({count})
      </Text>
    </HUXStack>
  );
});
SectionHeader.displayName = 'SectionHeader';

const Metric = ({ icon, label, value }: { icon: IoniconProps['name']; label: string; value: string }) => (
  <HUXStack className="flex-1 flex-row items-center gap-2.5">
    <View className="rounded-xl bg-accent/15 p-1.5">
      <IoniconsIcon name={icon} size={20} className="text-accent" />
    </View>
    <HUYStack className="flex-1">
      <Text className="text-[13px] text-foreground/60" numberOfLines={1}>
        {label}
      </Text>
      <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
        {value}
      </Text>
    </HUYStack>
  </HUXStack>
);

const EmptyState = () => (
  <HUYStack testID="downloads-empty" className="flex-1 items-center justify-center gap-4 p-8">
    <IoniconsIcon name="folder-outline" size={64} className="text-foreground" />
    <Text className="text-center text-2xl font-semibold text-foreground/50">No Downloads</Text>
    <Text className="max-w-75 text-center text-base text-foreground/40">
      {`Downloaded episodes will appear here. ${isTV ? 'Hold OK on' : 'Long press'} an episode to access download options.`}
    </Text>
  </HUYStack>
);

const Downloads = () => {
  const isInitialized = useDownloadStore((state) => state.isInitialized);
  // Ids and statuses only: progress ticks change neither, so they don't re-render the screen or the lists
  const layoutKey = useDownloadStore((state) =>
    Object.values(state.downloads)
      .map(({ id, status }) => `${status}\t${id}`)
      .join('\n'),
  );
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

  const entries = useMemo<Entry[]>(
    () =>
      layoutKey
        ? layoutKey.split('\n').map((line) => {
            const tab = line.indexOf('\t');
            return { status: line.slice(0, tab) as DownloadStatus, id: line.slice(tab + 1) };
          })
        : [],
    [layoutKey],
  );
  const sectionItems = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map(({ key, statuses }) => [key, entries.filter(({ status }) => statuses.includes(status))]),
      ) as Record<SectionKey, Entry[]>,
    [entries],
  );
  const completedCount = sectionItems.completed.length;
  const downloadsSize = useDownloadsSize();

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

  const confirmClearCompleted = useCallback(async () => {
    await useDownloadStore.getState().clearCompleted();
    setClearCompletedDialogOpen(false);
  }, []);

  const confirmClearAll = useCallback(async () => {
    await useDownloadStore.getState().clearAll();
    setClearAllDialogOpen(false);
  }, []);

  /** One native card of rows */
  const renderCard = (items: Entry[]) => (
    <DownloadList>
      {items.map(({ id, status }) => {
        switch (status) {
          case 'completed':
            return <CompletedRow key={id} id={id} onRemove={handleRemoveDownload} />;
          case 'failed':
          case 'cancelled':
            return <FailedRow key={id} id={id} onRemove={handleRemoveDownload} />;
          default:
            return <ActiveRow key={id} id={id} onRemove={handleRemoveDownload} onCancel={handleCancelDownload} />;
        }
      })}
    </DownloadList>
  );

  // "All" has every section under its heading; each status's tab, with nothing in it, isn't shown
  const sections = SECTIONS.filter(({ key }) => sectionItems[key].length);
  const tabs = [
    {
      key: 'all',
      label: `All ${entries.length}`,
      content: sections.map(({ key }) => (
        <View key={key}>
          <SectionHeader section={key} count={sectionItems[key].length} />
          {renderCard(sectionItems[key])}
        </View>
      )),
    },
    ...sections.map(({ key, title }) => ({
      key,
      label: `${title} ${sectionItems[key].length}`,
      content: <View className="pt-3">{renderCard(sectionItems[key])}</View>,
    })),
  ];

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
      <HUYStack className="gap-3 px-4 py-3">
        <Surface className="flex-row items-center gap-3">
          <Metric icon="server" label="Storage Used" value={formatBytes(downloadsSize ?? 0)} />
          <Separator orientation="vertical" />
          <Metric icon="download-outline" label="Total Downloads" value={String(completedCount)} />
        </Surface>

        {entries.length > 0 && (
          <HUXStack className="flex-row gap-2.5">
            {completedCount > 0 && (
              <View className="flex-1">
                <Button
                  testID="downloads-clear-completed"
                  variant="secondary"
                  onPress={() => setClearCompletedDialogOpen(true)}>
                  <Button.Label>Clear Completed</Button.Label>
                </Button>
              </View>
            )}
            <View className="flex-1">
              <Button testID="downloads-clear-all" variant="danger" onPress={() => setClearAllDialogOpen(true)}>
                <Button.Label>Clear All</Button.Label>
              </Button>
            </View>
          </HUXStack>
        )}
      </HUYStack>

      {entries.length ? (
        <HorizontalTabs
          scrollable
          items={tabs.map(({ key, label, content }) => ({
            key,
            label,
            content: (
              <ScrollView
                testID="downloads-list"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 + insets.bottom }}>
                {content}
              </ScrollView>
            ),
          }))}
        />
      ) : (
        <EmptyState />
      )}

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
        description={`Remove ${completedCount} completed download${completedCount > 1 ? 's' : ''}?`}
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
