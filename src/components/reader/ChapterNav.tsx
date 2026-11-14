import React from 'react';
import type { IMangaChapter } from 'react-native-consumet';
import { Button } from '@/components/Button';
import { IoniconsIcon } from '@/components/Icons';
import { HUXStack } from '@/components/ui-primitives';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';

interface ChapterNavProps {
  previous?: IMangaChapter;
  next?: IMangaChapter;
  onOpen: (chapter: IMangaChapter) => void;
}

/** Previous and next chapter buttons, at the long strip's ends and under a chapter that didn't load */
export const ChapterNav = ({ previous, next, onOpen }: ChapterNavProps) => {
  const theme = useCurrentTheme();
  if (!previous && !next) return null;
  return (
    <HUXStack className="justify-between gap-3 px-4 py-3">
      <Button
        testID="reader-previous-chapter"
        variant="secondary"
        size="sm"
        isDisabled={!previous}
        onPress={() => previous && onOpen(previous)}>
        <IoniconsIcon name="chevron-back" size={16} color={theme.foreground} />
        <Button.Label>Previous chapter</Button.Label>
      </Button>
      <Button
        testID="reader-next-chapter"
        variant="secondary"
        size="sm"
        isDisabled={!next}
        onPress={() => next && onOpen(next)}>
        <Button.Label>Next chapter</Button.Label>
        <IoniconsIcon name="chevron-forward" size={16} color={theme.foreground} />
      </Button>
    </HUXStack>
  );
};
