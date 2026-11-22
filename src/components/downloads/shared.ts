// Shared by DownloadList.android/ios; it can't live in DownloadList.tsx, which those files would resolve back to themselves
import type React from 'react';
import type { IoniconProps } from '../Icons';
import { innerRadius } from '@/utils/layout';
import { INSET, RADIUS } from '../native/card/card';

interface DownloadAction {
  testID: string;
  icon: IoniconProps['name'];
  label: string;
  onPress: () => void;
}

export interface DownloadItemProps {
  testID?: string;
  /** Above the title, such as the show */
  overline?: string;
  title: string;
  /** Under the title, after `status` */
  description?: string;
  /** RN content before the description, such as a Chip */
  status?: React.ReactElement;
  /** RN content at the start: a DownloadThumbnail */
  leading?: React.ReactElement;
  /** A native bar, with `caption` under it and `detail` at its end */
  progress?: { value: number; indeterminate?: boolean; caption: string; detail?: string };
  /** Icon buttons at the end of the row; on TV each is its own focus stop */
  actions: DownloadAction[];
}

export interface DownloadListProps {
  children: React.ReactNode;
}

/** The rows' layout on both platforms */
export const ROW = {
  paddingStart: INSET,
  paddingVertical: 12,
  gap: 12,
  textGap: 3,
  statusGap: 6,
  progressGap: 4,
  overlineSize: 12,
  titleSize: 16,
  descriptionSize: 13,
  captionSize: 12,
  iconSize: 20,
} as const;

/** The thumbnail's corner, concentric with the card's across the row's start padding */
export const THUMBNAIL_RADIUS = innerRadius(RADIUS, ROW.paddingStart);
