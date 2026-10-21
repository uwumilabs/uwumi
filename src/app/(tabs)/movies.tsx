import { ThemedView, MediaBrowser, LazyTab } from '@/components';
import React from 'react';
import { MediaType } from '@/constants/types';
import { PerfProfiler } from '@/perf/perfHarness';

const Movies = () => {
  return (
    <PerfProfiler id="movies tab">
      <ThemedView>
        <LazyTab>
          <MediaBrowser mediaType={MediaType.MOVIE} />
        </LazyTab>
      </ThemedView>
    </PerfProfiler>
  );
};

export default Movies;
