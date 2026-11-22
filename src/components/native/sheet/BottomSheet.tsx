import React, { useCallback, useState } from 'react';
import { ScrollView, View, useWindowDimensions, type ViewProps } from 'react-native';
import { BottomSheet as NativeBottomSheet, RNHostView, type SnapPoint } from '@expo/ui';
import { LayoutAnimationConfig } from 'react-native-reanimated';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { isTV } from '@/utils/tv';
import { SheetWidthLimit } from '@/modules/sheetWidth';
import { sheetContentLayout, sheetPlatformProps } from './sheetPlatform';

const SHEET_MAX_WIDTH = 640;
// TVs can't drag a sheet, and the handle would be the first thing the D-pad focuses
const showHandle = !isTV;

export type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /** `'80%'` → fraction of screen height, number → fixed height. Omit to size to content. */
  snapPoints?: (string | number)[];

  children: React.ReactNode;

  scrollable?: boolean;

  /** Spread on the ScrollView itself, or on the View when not scrollable */
  contentContainerProps?: ViewProps;

  testID?: string;
};

function toSnapPoint(point: string | number): SnapPoint {
  if (typeof point === 'string' && point.endsWith('%')) {
    return { fraction: parseFloat(point) / 100 };
  }
  return { height: Number(point) };
}

export const BottomSheet = ({
  open,
  onOpenChange,
  snapPoints,
  children,
  scrollable = true,
  contentContainerProps,
  testID = 'bottom-sheet',
}: BottomSheetProps) => {
  const theme = useCurrentTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const content = sheetContentLayout(Math.min(windowWidth, SHEET_MAX_WIDTH));
  const fitsContent = !snapPoints?.length;

  const dismiss = useCallback(() => onOpenChange(false), [onOpenChange]);

  // A closed sheet still mounts its native host and content, so wait for the first open (and keep it for closing)
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  if (!opened) return null;

  return (
    <NativeBottomSheet
      isPresented={open}
      onDismiss={dismiss}
      showDragIndicator={showHandle}
      snapPoints={fitsContent ? undefined : snapPoints.map(toSnapPoint)}
      {...sheetPlatformProps({ fitsContent, showHandle })}
      containerColor={theme.sheetBackground}
      contentColor={theme.foreground}>
      {/* matchContents lets content-sized sheets (no snapPoints) measure the RN content. */}
      <RNHostView matchContents={content.matchContents}>
        <LayoutAnimationConfig skipExiting>
          <View testID={testID} style={{ width: content.width }}>
            <SheetWidthLimit maxWidth={SHEET_MAX_WIDTH} />
            {scrollable ? (
              <ScrollView
                // TV: the sheet opens half-expanded and can't be dragged up, so content past half the screen
                // would sit below the edge; kept within it, this scroll view brings the focused row into view
                style={{ maxHeight: isTV ? windowHeight / 2 - 24 : Math.min(500, windowHeight * 0.75) }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
                {...(contentContainerProps as any)}>
                {children}
              </ScrollView>
            ) : (
              <View {...contentContainerProps}>{children}</View>
            )}
          </View>
        </LayoutAnimationConfig>
      </RNHostView>
    </NativeBottomSheet>
  );
};
