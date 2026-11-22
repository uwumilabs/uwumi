import React, { useEffect, useState } from 'react';
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
import { DownloadList } from '@/components/downloads/DownloadList';
import { DownloadThumbnail } from '@/components/downloads/DownloadThumbnail';
import { Separator } from '@/components/native/separator/Separator';
import {
  downloadedFileUri,
  useDownloadEntries,
  useDownloadStore,
  useDownloadsSize,
} from '@/downloads/useDownloadStore';
import { downloadLabels, downloadProgressText, downloadSection, type DownloadSection } from '@/downloads/model';
import { formatBytes, formatShortDate, joinDetails } from '@/utils/format';
import { openVideoInOtherApp } from '@/utils/share';
import { Chip, useToast } from '@/components/heroui';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const PAGE_GUTTER = 16;

type Entry = ReturnType<typeof useDownloadEntries>[number];

/** Progress ticks change none of these fields, so they don't re-render the row */
const useDownloadRow = (id: string) =>
  useDownloadStore(
    useShallow((state) => {
      const d = state.downloads[id];
      return {
        name: d?.name,
        showName: d?.showName,
        season: d?.season,
        episode: d?.episode,
        uniqueId: d?.uniqueId,
        watchParams: d?.watchParams,
        fileSize: d?.fileSize,
        status: d?.status,
        error: d?.error,
        completedAt: d?.completedAt,
      };
    }),
  );

interface RowProps {
  id: string;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
}

const removeAction = (title: string, onRemove: () => void) => ({
  testID: 'download-card-remove',
  icon: 'trash-outline' as const,
  label: `Remove ${title}`,
  onPress: onRemove,
});

// The only rows that re-render on progress ticks
const ActiveRow = ({ id, onRemove, onCancel }: RowProps) => {
  const download = useDownloadRow(id);
  const progress = useDownloadStore((state) => state.downloads[id]?.progress);
  const labels = downloadLabels(download);
  const text = downloadProgressText({ status: download.status, progress });
  return (
    <DownloadList.Item
      testID="download-card"
      overline={labels.show}
      title={labels.title}
      description={labels.number}
      leading={<DownloadThumbnail size="large" image={download.watchParams?.poster} uniqueId={download.uniqueId} />}
      progress={{
        value: progress?.percentage ?? 0,
        indeterminate: text.preparing,
        caption: text.caption,
        detail: text.detail,
      }}
      actions={[
        {
          testID: 'download-card-cancel',
          icon: download.status === 'pending' ? 'close-circle-outline' : 'stop-circle-outline',
          label: `Cancel ${labels.title}`,
          onPress: () => onCancel(id),
        },
        removeAction(labels.title, () => onRemove(id)),
      ]}
    />
  );
};

const CompletedRow = ({ id, onRemove }: RowProps) => {
  const download = useDownloadRow(id);
  const labels = downloadLabels(download);
  const router = useRouter();
  const { toast } = useToast();
  const title = labels.show ?? labels.title;
  const { watchParams } = download;

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
        download.completedAt ? formatShortDate(download.completedAt) : undefined,
      )}
      leading={
        <DownloadThumbnail size="small" image={download.watchParams?.poster} uniqueId={download.uniqueId}>
          <IoniconsIcon name="checkmark-circle" size={18} className="absolute bottom-1 right-1 text-success" />
        </DownloadThumbnail>
      }
      actions={[
        ...(watchParams
          ? [
              {
                testID: 'download-card-play',
                icon: 'play' as const,
                label: `Play ${title}`,
                onPress: () => router.push(watchHref(watchParams)),
              },
            ]
          : []),
        {
          testID: 'download-card-open',
          icon: 'open-outline',
          label: `Open ${title} in another app`,
          onPress: openElsewhere,
        },
        removeAction(title, () => onRemove(id)),
      ]}
    />
  );
};

const FailedRow = ({ id, onRemove }: RowProps) => {
  const download = useDownloadRow(id);
  const labels = downloadLabels(download);
  return (
    <DownloadList.Item
      testID="download-card"
      overline={labels.show}
      title={labels.title}
      status={
        <Chip size="sm" color="danger">
          <Chip.Label>{download.status === 'cancelled' ? 'Cancelled' : 'Failed'}</Chip.Label>
        </Chip>
      }
      description={joinDetails(labels.number, download.error)}
      leading={<DownloadThumbnail size="small" image={download.watchParams?.poster} uniqueId={download.uniqueId} />}
      actions={[
        {
          testID: 'download-card-retry',
          icon: 'refresh',
          label: `Retry ${labels.title}`,
          onPress: () => useDownloadStore.getState().retryDownload(id),
        },
        removeAction(labels.title, () => onRemove(id)),
      ]}
    />
  );
};

const SECTIONS: {
  key: DownloadSection;
  title: string;
  icon: IoniconProps['name'];
  tone: string;
  Row: React.ComponentType<RowProps>;
}[] = [
  { key: 'downloading', title: 'Downloading', icon: 'cloud-download', tone: 'text-accent', Row: ActiveRow },
  { key: 'pending', title: 'Pending', icon: 'time-outline', tone: 'text-accent', Row: ActiveRow },
  { key: 'completed', title: 'Completed', icon: 'checkmark-circle', tone: 'text-success', Row: CompletedRow },
  { key: 'failed', title: 'Failed', icon: 'warning', tone: 'text-danger', Row: FailedRow },
];
type Section = (typeof SECTIONS)[number];

const SectionHeader = ({ section, count }: { section: Section; count: number }) => (
  <HUXStack className="items-center gap-2.5 pb-2 pt-4">
    <IoniconsIcon name={section.icon} size={22} className={section.tone} />
    <Text className="text-lg font-bold text-foreground">
      {section.title} ({count})
    </Text>
  </HUXStack>
);

const Metric = ({ icon, label, value }: { icon: IoniconProps['name']; label: string; value: string }) => (
  <HUXStack className="flex-1 items-center gap-2.5">
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
  const theme = useCurrentTheme();
  const isInitialized = useDownloadStore((state) => state.isInitialized);
  const entries = useDownloadEntries();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [clearCompletedDialogOpen, setClearCompletedDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [selectedDownloadId, setSelectedDownloadId] = useState<string | null>(null);
  const removingFile = useDownloadStore(
    (state) => !!selectedDownloadId && state.downloads[selectedDownloadId]?.status === 'completed',
  );
  const insets = useSafeAreaInsets();
  const downloadsSize = useDownloadsSize();

  useEffect(() => {
    useDownloadStore.getState().initialize();
  }, []);

  const sectionItems = Object.fromEntries(
    SECTIONS.map(({ key }) => [key, entries.filter(({ status }) => downloadSection(status) === key)]),
  ) as Record<DownloadSection, Entry[]>;
  const completedCount = sectionItems.completed.length;

  const askRemove = (id: string) => {
    setSelectedDownloadId(id);
    setRemoveDialogOpen(true);
  };
  const askCancel = (id: string) => {
    setSelectedDownloadId(id);
    setCancelDialogOpen(true);
  };

  const confirmRemoveDownload = async () => {
    if (!selectedDownloadId) return;
    await useDownloadStore.getState().removeDownload(selectedDownloadId);
    setRemoveDialogOpen(false);
    setSelectedDownloadId(null);
  };

  const confirmCancelDownload = async () => {
    if (!selectedDownloadId) return;
    await useDownloadStore.getState().cancelDownload(selectedDownloadId);
    setCancelDialogOpen(false);
    setSelectedDownloadId(null);
  };

  const confirmClearCompleted = async () => {
    await useDownloadStore.getState().clearCompleted();
    setClearCompletedDialogOpen(false);
  };

  const confirmClearAll = async () => {
    await useDownloadStore.getState().clearAll();
    setClearAllDialogOpen(false);
  };

  const renderCard = ({ key, Row }: Section) => (
    <DownloadList>
      {sectionItems[key].map(({ id }) => (
        <Row key={id} id={id} onRemove={askRemove} onCancel={askCancel} />
      ))}
    </DownloadList>
  );

  // A status's tab only shows while it has downloads
  const sections = SECTIONS.filter(({ key }) => sectionItems[key].length);
  const tabs = [
    {
      key: 'all',
      label: `All ${entries.length}`,
      content: sections.map((section) => (
        <View key={section.key}>
          <SectionHeader section={section} count={sectionItems[section.key].length} />
          {renderCard(section)}
        </View>
      )),
    },
    ...sections.map((section) => ({
      key: section.key,
      label: `${section.title} ${sectionItems[section.key].length}`,
      content: <View className="pt-3">{renderCard(section)}</View>,
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
      <HUYStack className="gap-3 py-3" style={{ paddingHorizontal: PAGE_GUTTER }}>
        <HUXStack
          className="items-center gap-3 rounded-2xl border border-separator/60 p-4"
          style={{ backgroundColor: theme.surface }}>
          <Metric icon="server" label="Storage Used" value={formatBytes(downloadsSize ?? 0)} />
          <Separator orientation="vertical" />
          <Metric icon="download-outline" label="Total Downloads" value={String(completedCount)} />
        </HUXStack>

        {entries.length > 0 && (
          <HUXStack className="gap-2.5">
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
                contentContainerStyle={{ paddingHorizontal: PAGE_GUTTER, paddingBottom: 32 + insets.bottom }}>
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
          removingFile ? 'This will delete the downloaded file. Continue?' : 'Remove this download from the list?'
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
