import { useQuery } from '@tanstack/react-query';
import { META, type IMangaChapter, type IMangaChapterPage } from 'react-native-consumet';
import { getMangaProvider } from '@/constants/provider';

/**
 * An AniList manga's chapters on a provider, in reading order (first chapter first). Empty when the provider
 * doesn't have the title, or has no readable chapters for it (MangaDex links licensed titles out to the
 * publisher; AsuraScans hides early-access chapters until they unlock).
 */
export function useMangaChapters({ id, provider }: { id: string; provider: string }) {
  return useQuery<IMangaChapter[]>({
    queryKey: ['manga', 'chapters', id, provider],
    enabled: !!id,
    queryFn: async () => (await new META.Anilist.Manga(getMangaProvider(provider)).fetchMangaInfo(id)).chapters ?? [],
  });
}

/** A chapter's pages, numbered from 1, each with the headers its image host needs (when it needs any). */
export function useChapterPages({ chapterId, provider }: { chapterId: string; provider: string }) {
  return useQuery<IMangaChapterPage[]>({
    queryKey: ['manga', 'pages', provider, chapterId],
    enabled: !!chapterId,
    // Some hosts sign page links for a limited time (MangaHere's expire), so they aren't kept long
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: () => getMangaProvider(provider).fetchChapterPages(chapterId),
  });
}
