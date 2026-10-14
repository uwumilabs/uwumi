import { InfoHeader } from './components';
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

  // One scrolling page: the episode/chapter list is the scroller and everything above it is its header,
  // which keeps long series virtualized.
  const header = <InfoHeader data={data} />;

  return (
    <ThemedView useSafeArea focusable={isTV ? false : undefined}>
      {mediaType === MediaType.MANGA ? (
        <Chapters header={header} />
      ) : (
        <EpisodeList header={header} autoScrollToCurrent={false} />
      )}
    </ThemedView>
  );
};

export default Info;
