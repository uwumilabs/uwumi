import { InfoHeader, InfoRecommendations } from '@/components/info/InfoHeader';
import { InfoTopBar } from '@/components/info/InfoTopBar';
import { useShowParams } from '@/utils/routes';
import { EpisodeList } from '@/components/episode-list/EpisodeList';
import { ThemedView } from '@/components/ui-primitives';
import React from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { MediaType } from '@/constants/types';
import { isTV } from '@/utils/tv';
import Chapters from '@/components/info/Chapters';

const Info = () => {
  const { mediaType } = useShowParams();
  const scrollY = useSharedValue(0);
  const scrollMax = useSharedValue(0);

  // Episodes scroll in their own window inside the page, with "More like this" after it. Manga chapters are still
  // one scrolling list with everything above it as its header.
  const isManga = mediaType === MediaType.MANGA;
  const header = <InfoHeader withRecommendations={isManga} />;

  return (
    <ThemedView testID="info-screen" useSafeArea focusable={isTV ? false : undefined}>
      <InfoTopBar scrollY={scrollY} scrollMax={scrollMax}>
        {isManga ? (
          <Chapters header={header} scrollY={scrollY} scrollMax={scrollMax} />
        ) : (
          <EpisodeList header={header} footer={<InfoRecommendations />} scrollY={scrollY} scrollMax={scrollMax} />
        )}
      </InfoTopBar>
    </ThemedView>
  );
};

export default Info;
