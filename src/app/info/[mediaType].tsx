import { InfoHeader, InfoRecommendations } from './components';
import { EpisodeList, ThemedView } from '@/components';
import { useMediaInfo } from '@/hooks';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { MediaType } from '@/constants/types';
import { isTV } from '@/constants/utils';
import Chapters from './Chapters';

const Info = () => {
  const { mediaType } = useLocalSearchParams<{ mediaType: MediaType }>();
  const { data } = useMediaInfo();

  // Episodes scroll in their own window inside the page, with "More like this" after it. Manga chapters are still
  // one scrolling list with everything above it as its header.
  const isManga = mediaType === MediaType.MANGA;
  const header = <InfoHeader data={data} withRecommendations={isManga} />;

  return (
    <ThemedView useSafeArea focusable={isTV ? false : undefined}>
      {isManga ? (
        <Chapters header={header} />
      ) : (
        <EpisodeList header={header} footer={<InfoRecommendations data={data} />} autoScrollToCurrent={false} />
      )}
    </ThemedView>
  );
};

export default Info;
