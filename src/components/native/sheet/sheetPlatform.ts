import type { ComponentProps } from 'react';
import type { DimensionValue } from 'react-native';
import type { BottomSheet, RNHostView } from '@expo/ui';

export interface SheetLayout {
  /** No snap points: the sheet is as tall as its content */
  fitsContent: boolean;
  showHandle: boolean;
}

/** Compose's sheet keeps its content at the top and gives the handle a row of its own */
export const sheetPlatformProps = (
  _layout: SheetLayout,
): Pick<ComponentProps<typeof BottomSheet>, 'contentPadding' | 'modifiers'> => ({ contentPadding: 0 });

/** Compose sizes its sheet to the content (up to Material's max width), so the content sets its own width */
export const sheetContentLayout = (
  maxWidth: number,
): { matchContents: ComponentProps<typeof RNHostView>['matchContents']; width: DimensionValue } => ({
  matchContents: true,
  width: maxWidth,
});
