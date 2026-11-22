import type { ComponentProps } from 'react';
import type { DimensionValue } from 'react-native';
import type { BottomSheet, RNHostView } from '@expo/ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import type { SheetLayout } from './sheetPlatform';

const TOP_ALIGNED = [frame({ maxHeight: Infinity, alignment: 'top' })];

// SwiftUI centres the content of a sheet taller than it (snap points), and draws the handle over the content
export const sheetPlatformProps = ({
  fitsContent,
  showHandle,
}: SheetLayout): Pick<ComponentProps<typeof BottomSheet>, 'contentPadding' | 'modifiers'> => ({
  modifiers: fitsContent ? undefined : TOP_ALIGNED,
  contentPadding: showHandle ? { top: 16 } : 0,
});

// UIKit decides an iPhone sheet's width (SheetWidthLimit only asks for one), so the content takes the sheet's width
// rather than a fixed one that could overflow it
export const sheetContentLayout = (
  _maxWidth: number,
): { matchContents: ComponentProps<typeof RNHostView>['matchContents']; width: DimensionValue } => ({
  matchContents: { vertical: true },
  width: '100%',
});
