import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { HorizontalTabs, HUXStack, HUYStack, IoniconsIcon, type IoniconProps, ThemedView } from '@/components';
import {
  useContinueWatchingStore,
  useCurrentTheme,
  useDownloadStore,
  useFavoriteStore,
  useMangaProgressStore,
  useWatchProgressStore,
} from '@/hooks';
import { MediaType } from '@/constants/types';
import { getProviders } from '@/constants/provider';

type Stat = { label: string; value: string | number; icon?: IoniconProps['name'] };
type Section = { title: string; stats: Stat[] };

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return 'None';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

// Watch progress and downloads are keyed by episode: `${anilistId}$ep=…` for anime, `${tmdbId}-${type}-s…-e…` for
// TMDB movies and shows
const ANIME_EPISODE = /^(\d+)\$ep=/;
const TMDB_EPISODE = /^(\d+)-(\w+)-s\d+-e\d+$/;

/** The title an episode belongs to, read from its uniqueId */
const titleOf = (uniqueId: string) => {
  const anime = ANIME_EPISODE.exec(uniqueId);
  if (anime) return { mediaType: MediaType.ANIME, key: anime[1] };
  const tmdb = TMDB_EPISODE.exec(uniqueId);
  return tmdb ? { mediaType: MediaType.MOVIE, key: `${tmdb[2]}:${tmdb[1]}` } : undefined;
};

const countDistinct = (keys: (string | undefined)[]) => new Set(keys.filter(Boolean)).size;

const favoritesOf = (mediaType: MediaType) =>
  useFavoriteStore.getState().favorites.filter((item) => item.mediaType === mediaType).length;

// The stores as they are on opening; nothing here changes while the screen is up
const watchSections = (mediaType: MediaType.ANIME | MediaType.MOVIE): Section[] => {
  const progresses = Object.entries(useWatchProgressStore.getState().progresses).filter(
    ([uniqueId]) => titleOf(uniqueId)?.mediaType === mediaType,
  );
  const watched = progresses.filter(([, progress]) => progress.isCompleted);
  const downloads = Object.values(useDownloadStore.getState().downloads).filter(
    (download) =>
      download.status === 'completed' && (download.mediaType ?? titleOf(download.id)?.mediaType) === mediaType,
  );
  const history = useContinueWatchingStore.getState().entries.filter((entry) => entry.mediaType === mediaType);
  const watchedSeconds = progresses.reduce(
    (total, [, progress]) =>
      total + (progress.isCompleted ? progress.duration || progress.currentTime : progress.currentTime),
    0,
  );

  return [
    {
      title: 'Overview',
      stats: [
        { label: 'In favorites', value: favoritesOf(mediaType), icon: 'heart-outline' },
        { label: 'Watched duration', value: formatDuration(watchedSeconds), icon: 'time-outline' },
        {
          label: 'Titles watched',
          value: countDistinct(watched.map(([uniqueId]) => titleOf(uniqueId)?.key)),
          icon: 'checkmark-done-outline',
        },
      ],
    },
    {
      title: 'Titles',
      stats: [
        { label: 'Started', value: countDistinct(progresses.map(([uniqueId]) => titleOf(uniqueId)?.key)) },
        { label: 'In history', value: history.length },
        {
          label: 'Downloaded',
          value: countDistinct(downloads.map((download) => titleOf(download.id)?.key ?? download.showName)),
        },
      ],
    },
    {
      title: 'Episodes',
      stats: [
        { label: 'Started', value: progresses.length },
        { label: 'Watched', value: watched.length },
        { label: 'Downloaded', value: downloads.length },
      ],
    },
    {
      title: 'Sources',
      stats: [
        { label: 'Providers', value: getProviders()[mediaType].length },
        { label: 'Used', value: countDistinct(history.map((entry) => entry.watchParams.provider)) },
      ],
    },
  ];
};

const mangaSections = (): Section[] => {
  // Keyed `${anilistId}|${provider}`
  const progress = Object.entries(useMangaProgressStore.getState().progress).map(([key, value]) => {
    const [anilistId, provider] = key.split('|');
    return { anilistId, provider, read: value.read.length };
  });

  return [
    {
      title: 'Overview',
      stats: [
        { label: 'In favorites', value: favoritesOf(MediaType.MANGA), icon: 'heart-outline' },
        { label: 'Chapters read', value: progress.reduce((total, { read }) => total + read, 0), icon: 'book-outline' },
        {
          label: 'Titles started',
          value: countDistinct(progress.map(({ anilistId }) => anilistId)),
          icon: 'library-outline',
        },
      ],
    },
    {
      title: 'Sources',
      stats: [
        { label: 'Providers', value: getProviders()[MediaType.MANGA].length },
        { label: 'Used', value: countDistinct(progress.map(({ provider }) => provider)) },
      ],
    },
  ];
};

const StatSection = ({ title, stats, large }: Section & { large?: boolean }) => {
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

const TabContent = ({ sections }: { sections: Section[] }) => (
  <ScrollView contentContainerClassName="gap-6 p-4 pb-12">
    {sections.map((section, index) => (
      <StatSection key={section.title} {...section} large={index === 0} />
    ))}
  </ScrollView>
);

const Statistics = () => {
  const [tabs] = useState(() => [
    { key: 'anime', label: 'Anime', content: <TabContent sections={watchSections(MediaType.ANIME)} /> },
    { key: 'manga', label: 'Manga', content: <TabContent sections={mangaSections()} /> },
    { key: 'movies', label: 'Movies', content: <TabContent sections={watchSections(MediaType.MOVIE)} /> },
  ]);

  return (
    <ThemedView>
      <HorizontalTabs items={tabs} initialTab="anime" />
    </ThemedView>
  );
};

export default Statistics;
