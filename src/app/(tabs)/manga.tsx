import { ThemedView, MediaBrowser } from '@/components';
import { MediaType } from '@/constants/types';
import React from 'react';

const manga = () => {
  return (
    <ThemedView>
      <MediaBrowser mediaType={MediaType.MANGA} />
    </ThemedView>
  );
};

export default manga;
