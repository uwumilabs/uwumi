import { InfoHeader, InfoRecommendations, InfoToolbar } from '@/components/info/InfoHeader';
import EpisodeList from '@/components/episode-list/EpisodeList';
import { ThemedView } from '@/components/ui-primitives';
import { useMediaInfo } from '@/hooks/queries/infoQueries';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { MediaType } from '@/constants/types';
import { isTV } from '@/utils/tv';
import Chapters from '@/components/info/Chapters';

const Info = () => {
  const { mediaType } = useLocalSearchParams<{ mediaType: MediaType }>();
  const { data } = useMediaInfo();

  // Episodes scroll in their own window inside the page, with "More like this" after it. Manga chapters are still
  // one scrolling list with everything above it as its header.
  const isManga = mediaType === MediaType.MANGA;
  const header = <InfoHeader data={data} withRecommendations={isManga} />;

  return (
    <ThemedView useSafeArea focusable={isTV ? false : undefined}>
      <InfoToolbar data={data} />
      {isManga ? (
        <Chapters header={header} />
      ) : (
        <EpisodeList header={header} footer={<InfoRecommendations data={data} />} />
      )}
    </ThemedView>
  );
};

export default Info;
