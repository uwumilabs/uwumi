import { ThemedView, MediaBrowser, LazyTab } from '@/components';
import { MediaType } from '@/constants/types';
import { PerfProfiler } from '@/perf/perfHarness';
import React from 'react';

const manga = () => {
  return (
    <PerfProfiler id="manga tab">
      <ThemedView>
        <LazyTab>
          <MediaBrowser mediaType={MediaType.MANGA} />
        </LazyTab>
      </ThemedView>
    </PerfProfiler>
  );
};

export default manga;
