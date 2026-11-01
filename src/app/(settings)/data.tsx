import React, { useState } from 'react';
import { Platform, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Paths } from 'expo-file-system';
import {
  ChoiceDialog,
  choiceLabel,
  ConfirmDialog,
  HUXStack,
  HUYStack,
  NativeList,
  Progress,
  SectionTitle,
  ThemedView,
} from '@/components';
import { Dialog, Input, useToast } from '@/components/heroui';
import { Button } from '@/components/Button';
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
import {
  type Backup,
  backupFileName,
  backupFolderLabel,
  cleanBackupName,
  isPickerCancelled,
  missingExtensions,
  pickBackup,
  pickBackupFolder,
  restoreBackup,
  saveBackup,
  supportsBackupFolder,
} from '@/utils/backup';

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

const AUTO_BACKUP_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: 'Daily', value: 1 },
  { label: 'Every 2 days', value: 2 },
  { label: 'Weekly', value: 7 },
];

const AUTO_BACKUP_INFO = [
  'uwumi makes one when you open it and one is due. It keeps the newest 5 and deletes older automatic ones; backups you create yourself are never deleted.',
  'They are named uwumi_auto_<date>_<time>.json.',
  supportsBackupFolder()
    ? 'They go to the backup location, which stays when uwumi is deleted. After reinstalling, use Restore backup; search "uwumi" in the picker if you can\'t find them.'
    : "They stay in uwumi's own storage, which is deleted with the app: use Create backup and save it to Files to keep one safe.",
].join('\n\n');

const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const DataAndStorage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState<ClearTarget | null>(null);
  const [clearing, setClearing] = useState(false);
  const clearOnLaunch = usePreferencesStore((state) => state.clearCacheOnLaunch);
  const setClearOnLaunch = usePreferencesStore((state) => state.setClearCacheOnLaunch);
  const autoBackupDays = usePreferencesStore((state) => state.autoBackupDays);
  const setAutoBackupDays = usePreferencesStore((state) => state.setAutoBackupDays);
  const backupFolderUri = usePreferencesStore((state) => state.backupFolderUri);
  const lastAutoBackupAt = usePreferencesStore((state) => state.lastAutoBackupAt);
  const [backingUp, setBackingUp] = useState(false);
  // What the restore is doing, while it runs
  const [restoring, setRestoring] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<Backup | null>(null);
  const [autoBackupOpen, setAutoBackupOpen] = useState(false);

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

  // The name being typed for a new backup, while its dialog is open; it starts as the dated name, without `.json`
  const [backupName, setBackupName] = useState<string | null>(null);
  const openCreateBackup = () => setBackupName(backupFileName(new Date()).replace(/\.json$/, ''));

  const createBackup = async (name: string) => {
    setBackupName(null);
    setBackingUp(true);
    try {
      const saved = await saveBackup(cleanBackupName(name));
      if (!saved) return;
      toast.show(
        saved.where === 'app'
          ? {
              variant: 'warning',
              label: "Backup kept in uwumi's storage only",
              description: `${saved.name} goes if uwumi is deleted. ${
                Platform.OS === 'ios' ? 'Share it to Files' : 'Copy it'
              } to keep it safe`,
            }
          : { variant: 'success', label: 'Backup saved', description: saved.name },
      );
    } catch (error) {
      toast.show({ variant: 'danger', label: "Couldn't save the backup", description: (error as Error).message });
    } finally {
      setBackingUp(false);
    }
  };

  const chooseBackup = async () => {
    try {
      const backup = await pickBackup();
      if (backup) setPendingRestore(backup);
    } catch (error) {
      toast.show({ variant: 'danger', label: "Couldn't restore", description: (error as Error).message });
    }
  };

  const restore = async (backup: Backup) => {
    setPendingRestore(null);
    setRestoring('Restoring…');
    try {
      const result = await restoreBackup(backup, (done, total) => setRestoring(`Extensions ${done} / ${total}`));
      toast.show({
        variant: result.failedExtensions.length ? 'warning' : 'success',
        label: 'Backup restored',
        description: [
          `${result.favorites} favorites`,
          result.extensions && `${result.extensions} extensions installed`,
          result.failedExtensions.length && `${result.failedExtensions.length} couldn't install`,
        ]
          .filter(Boolean)
          .join(' · '),
      });
    } catch (error) {
      toast.show({ variant: 'danger', label: "Couldn't restore", description: (error as Error).message });
    } finally {
      setRestoring(null);
    }
  };

  const chooseFolder = async () => {
    try {
      await pickBackupFolder();
    } catch (error) {
      if (!isPickerCancelled(error)) toast.show({ variant: 'danger', label: "Couldn't open the folder picker" });
    }
  };

  const pending = confirm ? CLEAR[confirm] : null;
  const restoreExtensions = pendingRestore ? missingExtensions(pendingRestore).length : 0;

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <SectionTitle>Backup and restore</SectionTitle>
        <NativeList variant="flat">
          <NativeList.Item
            title="Create backup"
            description="Favorites, progress, history, settings and extensions"
            trailingLoading={backingUp}
            onPress={backingUp ? undefined : openCreateBackup}
          />
          <NativeList.Item
            title="Restore backup"
            description={restoring ?? 'Replaces your library and settings'}
            trailingLoading={!!restoring}
            onPress={restoring ? undefined : chooseBackup}
          />
          {supportsBackupFolder() && (
            <NativeList.Item
              title="Backup location"
              description={backupFolderLabel(backupFolderUri) ?? 'Not set'}
              onPress={chooseFolder}
            />
          )}
          <NativeList.Item
            title="Automatic backups"
            description={[
              choiceLabel(AUTO_BACKUP_OPTIONS, autoBackupDays),
              supportsBackupFolder() && autoBackupDays > 0 && !backupFolderUri
                ? 'Choose a backup location'
                : lastAutoBackupAt > 0 && `Last: ${dateTimeFormat.format(lastAutoBackupAt)}`,
            ]
              .filter(Boolean)
              .join(' · ')}
            onPress={() => setAutoBackupOpen(true)}
            info={{ title: 'Automatic backups', text: AUTO_BACKUP_INFO }}
          />
        </NativeList>
        <Text className="px-4 pt-1 text-sm text-foreground/60">Keep copies of your backups somewhere else too.</Text>

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
      <Dialog isOpen={backupName !== null} onOpenChange={(open) => !open && setBackupName(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/50" />
          <Dialog.Content className="rounded-3xl bg-background p-4">
            <HUYStack className="gap-3">
              <Dialog.Title className="text-lg font-semibold text-foreground">Create backup</Dialog.Title>
              <Input
                value={backupName ?? ''}
                onChangeText={setBackupName}
                placeholder="Backup name"
                autoFocus
                selectTextOnFocus
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => backupName !== null && createBackup(backupName)}
              />
              <Text className="text-sm text-foreground/60">Saved as a .json file</Text>
              <HUXStack className="flex-row justify-end gap-3">
                <Button variant="ghost" className="min-w-25" onPress={() => setBackupName(null)}>
                  Cancel
                </Button>
                <Button className="min-w-25" onPress={() => backupName !== null && createBackup(backupName)}>
                  Create
                </Button>
              </HUXStack>
            </HUYStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
      <ConfirmDialog
        open={!!pendingRestore}
        onOpenChange={(open) => !open && setPendingRestore(null)}
        title="Restore this backup?"
        description={`${
          pendingRestore?.createdAt ? `From ${dateTimeFormat.format(new Date(pendingRestore.createdAt))}. ` : ''
        }It replaces your library and settings${
          restoreExtensions ? ` and installs ${restoreExtensions} missing extensions` : ''
        }.`}
        confirmText="Restore"
        onConfirm={() => pendingRestore && restore(pendingRestore)}
      />
      <ChoiceDialog
        open={autoBackupOpen}
        onOpenChange={setAutoBackupOpen}
        title="Automatic backups"
        options={AUTO_BACKUP_OPTIONS}
        value={autoBackupDays}
        onChange={setAutoBackupDays}
      />
    </ThemedView>
  );
};

export default DataAndStorage;
