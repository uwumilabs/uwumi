import type React from 'react';
import type { DownloadItemProps, DownloadListProps } from './shared';

export type { DownloadAction, DownloadItemProps, DownloadListProps } from './shared';
export { LEADING_RADIUS } from './shared';

// Platforms other than Android and iOS have no native list
const Item: React.FC<DownloadItemProps> = () => null;
export const DownloadList = Object.assign((() => null) as React.FC<DownloadListProps>, { Item });
