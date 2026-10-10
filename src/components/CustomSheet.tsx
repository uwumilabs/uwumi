import React, { forwardRef, useCallback, useImperativeHandle } from 'react';
import { Platform, ScrollView, View, useWindowDimensions, type ViewProps } from 'react-native';
import { BottomSheet, RNHostView, type SnapPoint } from '@expo/ui';
import { useCurrentTheme, useSheetColor } from '@/hooks';

export type CustomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export type CustomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /** `'80%'` → fraction of screen height, number → fixed height. Omit to size to content. */
  snapPoints?: (string | number)[];

  header?: React.ReactNode;
  children: React.ReactNode;

  /** If true, wraps content in a ScrollView. */
  scrollable?: boolean;

  /** Optional props passed to HeroUI BottomSheet.Content (forwarded to underlying sheet). */
  modalProps?: Record<string, any>;

  /** Extra props for the outer content wrapper. */
  contentContainerProps?: ViewProps;
};

function toSnapPoint(point: string | number): SnapPoint {
  if (typeof point === 'string' && point.endsWith('%')) {
    return { fraction: parseFloat(point) / 100 };
  }
  return { height: Number(point) };
}

export const CustomSheet = forwardRef<CustomSheetRef, CustomSheetProps>(
  ({ open, onOpenChange, snapPoints, header, children, scrollable = true, contentContainerProps }, ref) => {
    const theme = useCurrentTheme();
    const sheetColor = useSheetColor();
    const { width: windowWidth } = useWindowDimensions();
    const sheetWidth = Platform.OS === 'android' ? Math.min(windowWidth, 640) : windowWidth;

    const present = useCallback(() => onOpenChange(true), [onOpenChange]);
    const dismiss = useCallback(() => onOpenChange(false), [onOpenChange]);

    useImperativeHandle(ref, () => ({ present, dismiss }), [present, dismiss]);

    return (
      <BottomSheet
        isPresented={open}
        onDismiss={dismiss}
        snapPoints={snapPoints?.map(toSnapPoint)}
        contentPadding={0}
        containerColor={sheetColor}
        contentColor={theme?.foreground}>
        {/* matchContents lets content-sized sheets (no snapPoints) measure the RN content. */}
        <RNHostView matchContents>
          <View style={{ width: sheetWidth }}>
            {/* Header stays outside scroll area */}
            {!!header && <View>{header}</View>}

            {scrollable ? (
              <ScrollView
                style={{ maxHeight: 500 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
                {...(contentContainerProps as any)}>
                {children}
              </ScrollView>
            ) : (
              <View {...contentContainerProps}>{children}</View>
            )}
          </View>
        </RNHostView>
      </BottomSheet>
    );
  },
);

CustomSheet.displayName = 'CustomSheet';

export const CustomSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
