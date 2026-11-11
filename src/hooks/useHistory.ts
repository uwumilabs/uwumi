import { useMemo } from 'react';
import type { useRouter } from 'expo-router';
import { useContinueWatchingStore, type ContinueWatchingEntry } from '@/hooks/stores/useContinueWatchingStore';
import {
  parseMangaProgressKey,
  resumePage,
  useMangaProgressStore,
  type MangaProgress,
} from '@/hooks/stores/useMangaProgressStore';
import { isMovieType } from '@/utils/media';
import { readerHref } from '@/utils/routes';

/** Empties History and Continue watching/reading; episode progress and read chapters stay */
export const clearWatchHistory = () => {
  useContinueWatchingStore.getState().clearAll();
  useMangaProgressStore.getState().hideAll();
};

// A finished episode opens the show, where "Continue" points at the next one
export const openContinueWatchingEntry = (
  router: ReturnType<typeof useRouter>,
  entry: ContinueWatchingEntry,
  isCompleted: boolean,
) =>
  router.push(
    isCompleted
      ? { pathname: '/info/[mediaType]', params: { ...entry.infoParams, mediaType: entry.mediaType } }
      : { pathname: '/watch/[mediaType]', params: { ...entry.watchParams, mediaType: entry.mediaType } },
  );

export const continueWatchingEpisodeLabel = ({ watchParams }: ContinueWatchingEntry) =>
  isMovieType(watchParams.type)
    ? 'Movie'
    : [
        watchParams.seasonNumber && `S${watchParams.seasonNumber}`,
        watchParams.episodeNumber && `EP ${watchParams.episodeNumber}`,
      ]
        .filter(Boolean)
        .join(' · ');

export type MangaHistoryEntry = { key: string; progress: MangaProgress };

/** Reopens the last chapter read, at the page it was left on */
export const openMangaProgress = (router: ReturnType<typeof useRouter>, { key, progress }: MangaHistoryEntry) => {
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
