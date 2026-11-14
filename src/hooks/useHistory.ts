import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWatchProgressStore } from '@/hooks/stores/useWatchProgressStore';
import { router } from 'expo-router';
import { useContinueWatchingStore, type ContinueWatchingEntry } from '@/hooks/stores/useContinueWatchingStore';
import {
  parseMangaProgressKey,
  resumePage,
  useMangaProgressStore,
  type MangaProgress,
} from '@/hooks/stores/useMangaProgressStore';
import { isMovieType } from '@/utils/media';
import { MediaType } from '@/constants/types';
import { useDownloadedOnlyFilter } from '@/downloads/useDownloadStore';
import { seasonEpisodeLabel } from '@/utils/episodes';
import { infoHref, readerHref, watchHref } from '@/utils/routes';

/** Empties History and Continue watching/reading; episode progress and read chapters stay */
export const clearWatchHistory = () => {
  useContinueWatchingStore.getState().clearAll();
  useMangaProgressStore.getState().hideAll();
};

// A finished episode opens the show, where "Continue" points at the next one
export const openContinueWatchingEntry = (entry: ContinueWatchingEntry, isCompleted: boolean) =>
  router.push(
    isCompleted
      ? infoHref({ ...entry.infoParams, mediaType: entry.mediaType })
      : watchHref({ ...entry.watchParams, mediaType: entry.mediaType }),
  );

/** One media type's watch history, most recent first, as "Downloaded only" allows */
export const useWatchHistory = (mediaType: MediaType) => {
  const entries = useContinueWatchingStore((state) => state.entries);
  const downloadedOnly = useDownloadedOnlyFilter();
  return useMemo(
    () =>
      entries.filter(
        (entry) => entry.mediaType === mediaType && (!downloadedOnly || downloadedOnly(entry.showId, entry.showTitle)),
      ),
    [entries, mediaType, downloadedOnly],
  );
};

/** An episode's progress as history shows it, rounded, so the saves every 5 s while watching rarely re-render */
export const useEntryProgress = (uniqueId: string) =>
  useWatchProgressStore(
    useShallow((state) => {
      const progress = state.progresses[uniqueId];
      const isCompleted = !!progress?.isCompleted;
      const percent = Math.round(progress?.progress ?? 0);
      return {
        isCompleted,
        /** Unset when there's no bar to show */
        percent: percent > 0 && !isCompleted ? percent : undefined,
        minutesLeft:
          progress?.duration && !isCompleted
            ? Math.max(1, Math.round((progress.duration - progress.currentTime) / 60))
            : null,
      };
    }),
  );

export const continueWatchingEpisodeLabel = ({ watchParams }: ContinueWatchingEntry) =>
  isMovieType(watchParams.type)
    ? 'Movie'
    : watchParams.episodeNumber
      ? seasonEpisodeLabel(watchParams.seasonNumber, watchParams.episodeNumber)
      : watchParams.seasonNumber && `S${watchParams.seasonNumber}`;

export type MangaHistoryEntry = { key: string; progress: MangaProgress };

/** Reopens the last chapter read, at the page it was left on */
export const openMangaProgress = ({ key, progress }: MangaHistoryEntry) => {
  const { anilistId, provider } = parseMangaProgressKey(key);
  router.push(
    readerHref({
      id: anilistId,
      chapter: progress.lastChapterId,
      provider,
      title: progress.title,
      image: progress.image,
    }),
  );
};

export const mangaPageLabel = (progress: MangaProgress) => {
  const page = resumePage(progress, progress.lastChapterId);
  return page > 1 ? `Page ${page}${progress.pageCount ? ` of ${progress.pageCount}` : ''}` : undefined;
};

/** Manga read, most recent first; ones read before their title was kept are left out, having nothing to show */
export const useMangaHistory = () => {
  const progress = useMangaProgressStore((state) => state.progress);
  return useMemo(
    () =>
      Object.entries(progress)
        .filter(([, value]) => value.title && !value.hidden)
        .map(([key, value]) => ({ key, progress: value }))
        .sort((a, b) => b.progress.updatedAt - a.progress.updatedAt),
    [progress],
  );
};
