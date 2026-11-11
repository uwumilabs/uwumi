import { ThemedView } from '@/components/ui-primitives';
import { MediaBrowser } from '@/components/MediaBrowser';
import { LazyTab } from '@/components/LazyTab';
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
