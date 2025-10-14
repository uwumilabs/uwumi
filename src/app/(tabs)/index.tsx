import { ThemedView, MediaBrowser } from '@/components';
import React from 'react';
import { MediaType } from '@/constants/types';

const Anime = () => {
  return (
    <ThemedView>
      <MediaBrowser mediaType={MediaType.ANIME} />
    </ThemedView>
  );
};

export default Anime;
