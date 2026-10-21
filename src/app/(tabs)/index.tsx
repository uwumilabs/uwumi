import { ThemedView, MediaBrowser, LazyTab } from '@/components';
import React from 'react';
import { MediaType } from '@/constants/types';
import { PerfProfiler } from '@/perf/perfHarness';

const Anime = () => {
  return (
    <PerfProfiler id="anime tab">
      <ThemedView>
        <LazyTab>
          <MediaBrowser mediaType={MediaType.ANIME} />
        </LazyTab>
      </ThemedView>
    </PerfProfiler>
  );
};

export default Anime;
