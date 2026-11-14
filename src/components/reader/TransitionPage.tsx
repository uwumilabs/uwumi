import React from 'react';
import { Text, View } from 'react-native';
import type { IMangaChapter } from 'react-native-consumet';
import { Button } from '@/components/Button';
import { HUYStack } from '@/components/ui-primitives';
import { chapterTitle } from '@/utils/manga';

interface TransitionPageProps {
  kind: 'start' | 'end';
  current?: IMangaChapter;
  target?: IMangaChapter;
  onOpen: (chapter: IMangaChapter) => void;
  width: number;
  height: number;
}

/** Mihon's chapter transition, a page of its own in the paged modes: the chapter before this one, or after it */
export const TransitionPage = ({ kind, current, target, onOpen, width, height }: TransitionPageProps) => {
  const start = kind === 'start';
  return (
    <View style={{ width, height }} className="items-center justify-center px-8">
      <HUYStack className="w-full max-w-md gap-4 rounded-3xl bg-surface p-6">
        <HUYStack className="gap-1">
          <Text className="text-sm text-foreground/60">{start ? 'Current' : 'Finished'}</Text>
          <Text className="text-lg font-semibold text-foreground">{chapterTitle(current)}</Text>
        </HUYStack>
        <HUYStack className="gap-1">
          <Text className="text-sm text-foreground/60">
            {target ? (start ? 'Previous' : 'Next') : start ? "There's no previous chapter" : "There's no next chapter"}
          </Text>
          {target && <Text className="text-lg font-semibold text-foreground">{chapterTitle(target)}</Text>}
        </HUYStack>
        {target && (
          <Button
            testID={start ? 'reader-previous-chapter' : 'reader-next-chapter'}
            size="sm"
            onPress={() => onOpen(target)}>
            <Button.Label>{start ? 'Previous chapter' : 'Next chapter'}</Button.Label>
          </Button>
        )}
      </HUYStack>
    </View>
  );
};
