import React, { type ReactNode } from 'react';
import { EpisodeThumbnail } from '../EpisodeThumbnail';
import { THUMBNAIL_RADIUS } from './shared';

const SIZES = { large: { width: 96, height: 60 }, small: { width: 80, height: 50 } };

/** A download row's thumbnail: large while it downloads, small once it's done or has failed */
export const DownloadThumbnail = ({
  size,
  image,
  uniqueId,
  children,
}: {
  size: keyof typeof SIZES;
  image?: string;
  uniqueId?: string;
  children?: ReactNode;
}) => (
  <EpisodeThumbnail image={image} uniqueId={uniqueId} radius={THUMBNAIL_RADIUS} {...SIZES[size]}>
    {children}
  </EpisodeThumbnail>
);
