import type { IMangaChapter } from 'react-native-consumet';

const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' });

export const chapterNumbers = (chapter?: IMangaChapter) =>
  [
    chapter?.volumeNumber !== undefined && `Vol ${chapter.volumeNumber}`,
    chapter?.chapterNumber !== undefined && `Ch ${chapter.chapterNumber}`,
  ]
    .filter(Boolean)
    .join(' · ');

export const chapterTitle = (chapter?: IMangaChapter) =>
  chapter?.title?.trim() || (chapter?.chapterNumber !== undefined ? `Chapter ${chapter.chapterNumber}` : 'Chapter');

/** An ISO date as "Oct 3, 2024"; anything else the site gave, as it is */
const releaseDateLabel = (value?: string) => {
  if (!value) return '';
  const time = /^\d{4}-\d{2}-\d{2}/.test(value) ? Date.parse(value) : NaN;
  return Number.isNaN(time) ? value : dateFormat.format(time);
};

export const chapterDetails = (chapter?: IMangaChapter) =>
  [chapter?.scanlator, chapter?.language, releaseDateLabel(chapter?.releaseDate)].filter(Boolean).join(' · ');

/** A chapter and the ones before and after it, with chapters in reading order (first chapter first) */
export const adjacentChapters = (chapters: IMangaChapter[], chapterId: string) => {
  const index = chapters.findIndex((chapter) => chapter.id === chapterId);
  return {
    index,
    current: index >= 0 ? chapters[index] : undefined,
    previous: index > 0 ? chapters[index - 1] : undefined,
    next: index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : undefined,
  };
};
