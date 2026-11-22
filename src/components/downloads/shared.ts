// Shared by DownloadList.android/ios; it can't live in DownloadList.tsx, which those files would resolve back to themselves
import type React from 'react';
import type { IoniconProps } from '../Icons';
import { INSET, RADIUS } from '../native/list/shared';
import { innerRadius } from '@/utils/layout';

export interface DownloadAction {
  testID: string;
  icon: IoniconProps['name'];
  label: string;
  onPress: () => void;
}

export interface DownloadItemProps {
  /** On the row, for e2e tests */
  testID?: string;
  /** Above the title, such as the show */
  overline?: string;
  title: string;
  /** Under the title, after `status` */
  description?: string;
  /** RN content before the description, such as a Chip */
  status?: React.ReactElement;
  /** RN content at the start, such as the thumbnail */
  leading?: React.ReactElement;
  /** A native bar, with `caption` under it and `detail` at its end */
  progress?: { value: number; indeterminate?: boolean; caption: string; detail?: string };
  /** Icon buttons at the end of the row; on TV each is its own focus stop with the app's focus ring */
  actions: DownloadAction[];
}

export interface DownloadListProps {
  /** `DownloadList.Item`s */
  children: React.ReactNode;
}

/** The corner for `leading`, concentric with the card's */
export const LEADING_RADIUS = innerRadius(RADIUS, INSET);
