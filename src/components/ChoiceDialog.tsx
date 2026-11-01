import React from 'react';
import { ScrollView, Text, useWindowDimensions } from 'react-native';
import { Checkbox, Dialog } from './heroui';
import TVFocusWrapper from './TVFocusWrapper';

export interface ChoiceOption<T> {
  label: string;
  value: T;
}

export interface ChoiceDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** The label of the option holding `value`, for a setting row's description */
export const choiceLabel = <T,>(options: ChoiceOption<T>[], value: T) =>
  options.find((option) => option.value === value)?.label;

/** Aniyomi's list setting: the options as radio rows; picking one saves it and closes the dialog */
export const ChoiceDialog = <T,>({ open, onOpenChange, title, options, value, onChange }: ChoiceDialogProps<T>) => {
  const { height } = useWindowDimensions();

  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50" />
        <Dialog.Content className="rounded-3xl bg-background px-2 py-4">
          <Dialog.Title className="px-4 pb-2 text-lg font-semibold text-foreground">{title}</Dialog.Title>
          <ScrollView style={{ maxHeight: height * 0.6 }}>
            {options.map((option) => {
              const selected = option.value === value;
              const pick = () => {
                onChange(option.value);
                onOpenChange(false);
              };
              return (
                <TVFocusWrapper
                  key={String(option.value)}
                  hasTVPreferredFocus={selected}
                  focusScale={1}
                  focusBorderRadius={12}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={pick}
                  className="flex-row items-center gap-4 rounded-[14px] px-4 py-3">
                  {/* The row is the control (and the D-pad's stop on TV); the checkbox shows which one is picked */}
                  <Checkbox
                    isSelected={selected}
                    onSelectedChange={pick}
                    focusable={false}
                    importantForAccessibility="no-hide-descendants"
                    accessibilityElementsHidden
                  />
                  <Text className="text-base text-foreground">{option.label}</Text>
                </TVFocusWrapper>
              );
            })}
          </ScrollView>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
};

export default ChoiceDialog;
