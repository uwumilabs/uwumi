import { InfoHeader, InfoRecommendations, InfoToolbar } from '@/components/info/InfoHeader';
import { useShowParams } from '@/utils/routes';
import { EpisodeList } from '@/components/episode-list/EpisodeList';
import { ThemedView } from '@/components/ui-primitives';
import React from 'react';
import { MediaType } from '@/constants/types';
import { isTV } from '@/utils/tv';
import Chapters from '@/components/info/Chapters';

const Info = () => {
  const { mediaType } = useShowParams();

  // Episodes scroll in their own window inside the page, with "More like this" after it. Manga chapters are still
  // one scrolling list with everything above it as its header.
  const isManga = mediaType === MediaType.MANGA;
  const header = <InfoHeader withRecommendations={isManga} />;

  return (
    <ThemedView testID="info-screen" useSafeArea focusable={isTV ? false : undefined}>
      <InfoToolbar />
      {isManga ? <Chapters header={header} /> : <EpisodeList header={header} footer={<InfoRecommendations />} />}
    </ThemedView>
  );
};

export default Info;
