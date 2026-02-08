import React, { forwardRef, useCallback, useImperativeHandle, useMemo } from 'react';
import { ScrollView, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentTheme, useSheetColor } from '@/hooks';
import { BottomSheet } from 'heroui-native';

export type CustomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export type CustomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  snapPoints?: (string | number)[];

  header?: React.ReactNode;
  children: React.ReactNode;

  /** If true, wraps content in a BottomSheetScrollView. */
  scrollable?: boolean;

  /** Optional props passed to HeroUI BottomSheet.Content (forwarded to underlying sheet). */
  modalProps?: Record<string, any>;

  /** Extra props for the outer content wrapper. */
  contentContainerProps?: ViewProps;
};

export const CustomSheet = forwardRef<CustomSheetRef, CustomSheetProps>(
  ({ open, onOpenChange, snapPoints, header, children, scrollable = true, modalProps, contentContainerProps }, ref) => {
    const insets = useSafeAreaInsets();
    const theme = useCurrentTheme();
    const sheetColor = useSheetColor();

    const resolvedSnapPoints = useMemo(() => snapPoints ?? ['55%'], [snapPoints]);

    const present = useCallback(() => onOpenChange(true), [onOpenChange]);
    const dismiss = useCallback(() => onOpenChange(false), [onOpenChange]);

    useImperativeHandle(ref, () => ({ present, dismiss }), [present, dismiss]);

    return (
      <BottomSheet isOpen={open} onOpenChange={onOpenChange}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            snapPoints={resolvedSnapPoints}
            // Keep parity with prior styling.
            backgroundStyle={{ backgroundColor: sheetColor }}
            handleIndicatorStyle={{ backgroundColor: theme?.separator }}
            topInset={insets.top}
            detached
            {...(modalProps as any)}>
            {/* Header must stay outside scrollable area to avoid gesture/tap conflicts on Android */}
            {!!header && <View>{header}</View>}

            {scrollable ? (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
                {...(contentContainerProps as any)}>
                {children}
              </ScrollView>
            ) : (
              <View style={{ flex: 1 }} {...contentContainerProps}>
                {children}
              </View>
            )}
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    );
  },
);

CustomSheet.displayName = 'CustomSheet';

export const CustomSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // HeroUI BottomSheet uses an internal portal; no provider needed here.
  return <>{children}</>;
};
