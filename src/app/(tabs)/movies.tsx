import { ThemedView, MediaBrowser } from '@/components';
import React from 'react';
import { MediaType } from '@/constants/types';

const Movies = () => {
  return (
    <ThemedView>
      <MediaBrowser mediaType={MediaType.MOVIE} />
    </ThemedView>
  );
};

export default Movies;
