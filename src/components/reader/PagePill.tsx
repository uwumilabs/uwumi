import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

// The page on screen, per chapter, so only the pill re-renders as the strip scrolls
const usePageStore = create<{ chapterId: string; page: number }>(() => ({ chapterId: '', page: 0 }));

export const setPillPage = (chapterId: string, page: number) => usePageStore.setState({ chapterId, page });

/** The reader's "page / total" pill, once a page of this chapter is on screen */
export const PagePill = ({ chapterId, total }: { chapterId: string; total: number }) => {
  const insets = useSafeAreaInsets();
  const page = usePageStore((state) => (state.chapterId === chapterId ? state.page : 0));
  if (!page) return null;
  return (
    <View pointerEvents="none" className="absolute inset-x-0 items-center" style={{ bottom: insets.bottom + 12 }}>
      <Text className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">{`${page} / ${total}`}</Text>
    </View>
  );
};
