import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { ScrollView, View, type ViewProps } from 'react-native';
import { useCurrentTheme, useSheetColor } from '@/hooks';
import { Host, ModalBottomSheet as NativeSheet, Column, RNHostView } from '@expo/ui/jetpack-compose';

// Import ModalBottomSheetRef type for Android
type NativeSheetRef = { hide: () => Promise<void> };

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
  ({ open, onOpenChange, header, children, scrollable = true, contentContainerProps }, ref) => {
    const theme = useCurrentTheme();
    const sheetColor = useSheetColor();
    const nativeRef = useRef<NativeSheetRef>(null);
    const [visible, setVisible] = useState(open);

    // Sync visibility when `open` prop changes
    useEffect(() => {
      if (open) {
        setVisible(true);
      } else if (visible) {
        // Animate out, then unmount
        nativeRef.current
          ?.hide()
          .then(() => setVisible(false))
          .catch(() => setVisible(false));
      }
    }, [open]);

    const present = useCallback(() => onOpenChange(true), [onOpenChange]);
    const dismiss = useCallback(() => onOpenChange(false), [onOpenChange]);

    useImperativeHandle(ref, () => ({ present, dismiss }), [present, dismiss]);

    const handleDismiss = useCallback(() => {
      setVisible(false);
      onOpenChange(false);
    }, [onOpenChange]);

    if (!visible) return null;

    return (
      <Host matchContents style={{ position: 'absolute', zIndex: 9999 }}>
        <NativeSheet
          ref={nativeRef}
          onDismissRequest={handleDismiss}
          containerColor={sheetColor}
          contentColor={theme?.foreground}
          skipPartiallyExpanded={false}
          showDragHandle>
          <Column>
            <RNHostView>
              <View style={{ width: '100%' }}>
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
          </Column>
        </NativeSheet>
      </Host>
    );
  },
);

CustomSheet.displayName = 'CustomSheet';

export const CustomSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
