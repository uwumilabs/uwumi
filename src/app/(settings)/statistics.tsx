import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { HUXStack, HUYStack, IoniconsIcon, type IoniconProps, ThemedView } from '@/components';
import {
  useContinueWatchingStore,
  useCurrentTheme,
  useDownloadStore,
  useExtensionStore,
  useFavoriteStore,
  useWatchProgressStore,
} from '@/hooks';
import { MediaType } from '@/constants/types';

type Stat = { label: string; value: string | number; icon?: IoniconProps['name'] };

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return 'None';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

// The stores as they are on opening; nothing here changes while the screen is up
const readStats = () => {
  const favorites = useFavoriteStore.getState().favorites;
  const progresses = Object.values(useWatchProgressStore.getState().progresses);
  const downloads = Object.values(useDownloadStore.getState().downloads);
  const extensions = useExtensionStore.getState().getInstalledExtensions();
  const countFavorites = (mediaType: MediaType) => favorites.filter((item) => item.mediaType === mediaType).length;
  const watched = progresses.filter((progress) => progress.isCompleted);
  const watchedSeconds = progresses.reduce(
    (total, progress) =>
      total + (progress.isCompleted ? progress.duration || progress.currentTime : progress.currentTime),
    0,
  );

  return {
    overview: [
      { label: 'Favorites', value: favorites.length, icon: 'heart-outline' },
      { label: 'Watched time', value: formatDuration(watchedSeconds), icon: 'time-outline' },
      { label: 'Shows watched', value: useContinueWatchingStore.getState().entries.length, icon: 'tv-outline' },
    ],
    favorites: [
      { label: 'Anime', value: countFavorites(MediaType.ANIME) },
      { label: 'Manga', value: countFavorites(MediaType.MANGA) },
      { label: 'Movies', value: countFavorites(MediaType.MOVIE) },
    ],
    episodes: [
      { label: 'Started', value: progresses.length },
      { label: 'Watched', value: watched.length },
      { label: 'Downloaded', value: downloads.filter(({ status }) => status === 'completed').length },
    ],
    extensions: [
      { label: 'Anime', value: extensions.filter(({ category }) => category === 'anime').length },
      { label: 'Movies', value: extensions.filter(({ category }) => category === 'movies').length },
    ],
  } satisfies Record<string, Stat[]>;
};

const StatSection = ({ title, stats, large }: { title: string; stats: Stat[]; large?: boolean }) => {
  const theme = useCurrentTheme();
  return (
    <HUYStack className="gap-2">
      <Text className="px-2 text-base font-semibold text-foreground">{title}</Text>
      <HUXStack className="rounded-3xl bg-surface px-2 py-5">
        {stats.map(({ label, value, icon }) => (
          <HUYStack key={label} className="flex-1 items-center gap-1">
            <Text className={`${large ? 'text-3xl' : 'text-xl'} font-bold text-foreground`} numberOfLines={1}>
              {value}
            </Text>
            <Text className="text-center text-sm text-foreground/70" numberOfLines={1}>
              {label}
            </Text>
            {icon && <IoniconsIcon name={icon} size={24} color={theme.accent} />}
          </HUYStack>
        ))}
      </HUXStack>
    </HUYStack>
  );
};

const Statistics = () => {
  const [stats] = useState(readStats);

  return (
    <ThemedView>
      <ScrollView contentContainerClassName="gap-6 p-4 pb-12">
        <StatSection title="Overview" stats={stats.overview} large />
        <StatSection title="Favorites" stats={stats.favorites} />
        <StatSection title="Episodes" stats={stats.episodes} />
        <StatSection title="Extensions" stats={stats.extensions} />
      </ScrollView>
    </ThemedView>
  );
};

export default Statistics;
