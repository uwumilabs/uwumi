import { memo } from 'react';
import { useWatchProgressStore } from '@/hooks/stores/useWatchProgressStore';
import Progress from '../native/progress/Progress';

/** How much of the episode was watched, along the bottom of its thumbnail */
export const ThumbnailProgress = memo(({ uniqueId }: { uniqueId?: string }) => {
  const percent = useWatchProgressStore((state) => (uniqueId ? state.progresses[uniqueId]?.progress : undefined));
  if (percent === undefined) return null;
  return <Progress className="absolute inset-x-1 bottom-0.5" value={percent || 0} />;
});
ThumbnailProgress.displayName = 'ThumbnailProgress';
