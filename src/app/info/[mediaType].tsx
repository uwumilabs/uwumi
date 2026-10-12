import { InfoHeader } from './components';
import { EpisodeList, ThemedView } from '@/components';
import { useInfo, useMediaInfoStore } from '@/hooks';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { MediaType, MetaProvider } from '@/constants/types';
import { isTV } from '@/constants/utils';
import Chapters from './Chapters';
import { MediaFormat, TvType } from 'react-native-consumet';
import { useActiveProvider } from '@/constants/provider';

const Info = () => {
  const { mediaType, metaProvider, type, id } = useLocalSearchParams<{
    mediaType: MediaType;
    metaProvider: MetaProvider;
    type: MediaFormat | TvType;
    provider: string;
    id: string;
    image: string;
    title?: string;
    /** Set by carousel cards, whose tags include the row so duplicates across rows stay unique. */
    sharedTag?: string;
  }>();
  const currentProvider = useActiveProvider(mediaType);
  const { setMediaInfo, clearMediaInfo } = useMediaInfoStore();
  const { data } = useInfo({ mediaType, id, metaProvider, type, provider: currentProvider });

  // Update store when data changes
  useEffect(() => {
    if (data && id) {
      setMediaInfo(data, id);
    }

    // Clear store on unmount
    return () => {
      clearMediaInfo();
    };
  }, [data, mediaType, id, metaProvider, setMediaInfo, clearMediaInfo]);

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
