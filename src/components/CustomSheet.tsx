import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { View, type ViewProps } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentTheme, useSheetColor } from '@/hooks';

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

  /** Optional props passed to BottomSheetModal. */
  modalProps?: Omit<BottomSheetModalProps, 'children' | 'snapPoints' | 'onDismiss'>;

  /** Extra props for the outer content wrapper. */
  contentContainerProps?: ViewProps;
};

export const CustomSheet = forwardRef<CustomSheetRef, CustomSheetProps>(
  ({ open, onOpenChange, snapPoints, header, children, scrollable = true, modalProps, contentContainerProps }, ref) => {
    const insets = useSafeAreaInsets();
    const theme = useCurrentTheme();
    const sheetColor = useSheetColor();
    const modalRef = useRef<BottomSheetModal>(null);

    const resolvedSnapPoints = useMemo(() => snapPoints ?? ['55%'], [snapPoints]);

    const present = useCallback(() => {
      modalRef.current?.present();
    }, []);

    const dismiss = useCallback(() => {
      modalRef.current?.dismiss();
    }, []);

    useImperativeHandle(ref, () => ({ present, dismiss }), [present, dismiss]);

    useEffect(() => {
      if (open) present();
      else dismiss();
    }, [open, present, dismiss]);

    const handleDismiss = useCallback(() => {
      onOpenChange(false);
    }, [onOpenChange]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={resolvedSnapPoints}
        enablePanDownToClose
        onDismiss={handleDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: sheetColor }}
        handleIndicatorStyle={{ backgroundColor: theme?.divider }}
        topInset={insets.top}
        detached
        {...modalProps}>
        <BottomSheetView style={{ flex: 1 }}>
          {!!header && <View>{header}</View>}

          {scrollable ? (
            <BottomSheetScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
              {...(contentContainerProps as any)}>
              {children}
            </BottomSheetScrollView>
          ) : (
            <View style={{ flex: 1 }} {...contentContainerProps}>
              {children}
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

CustomSheet.displayName = 'CustomSheet';

export const CustomSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BottomSheetModalProvider>{children}</BottomSheetModalProvider>;
};
