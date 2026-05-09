import React, { memo, useCallback, useMemo, useState } from 'react';
import { Button } from 'heroui-native';
import { Text, View } from 'react-native';
import { useCustomBackHandler, useCurrentTheme, useSheetColor } from '@/hooks';
import { IoniconsIcon } from './Icons';
import { isTV } from '@/constants/utils';
import { CustomSheet } from './CustomSheet';
import { RippleButton } from './ui-primitives';

type SelectOption = {
  name: string;
  value: string;
};

export const CustomSelect = ({
  SelectItem,
  SelectLabel,
  value,
  onValueChange,
}: {
  SelectItem: SelectOption[];
  SelectLabel: string;
  value: string;
  onValueChange: (value: string) => void;
}) => {
  const selectOptions = useMemo(
    () =>
      SelectItem.map((item) => ({
        value: item.value,
        label: item.name,
      })),
    [SelectItem],
  );

  const selectedOption = useMemo(() => selectOptions.find((item) => item.value === value), [selectOptions, value]);
  const sheetColor = useSheetColor();
  const currentTheme = useCurrentTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  useCustomBackHandler(
    isTV && isOpen,
    useCallback(() => {
      handleOpenChange(false);
      return true;
    }, []),
  );

  const handleValueChange = useCallback(
    (option: { value: string; label: string }) => {
      onValueChange(option.value);
      setIsOpen(false);
    },
    [onValueChange],
  );

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  return (
    <View>
      <Button
        variant="primary"
        onPress={() => setIsOpen(true)}
        onFocus={isTV ? handleFocus : undefined}
        onBlur={isTV ? handleBlur : undefined}
        style={
          isTV
            ? {
                borderWidth: 5,
                borderColor: isFocused ? currentTheme?.accentForeground : 'transparent',
                transform: [{ scale: isFocused ? 1.05 : 1 }],
              }
            : undefined
        }>
        {selectedOption ? (
          <View className="flex-row items-center gap-2">
            <Button.Label>{selectedOption.label}</Button.Label>
          </View>
        ) : (
          <Button.Label className="text-foreground">{SelectLabel}</Button.Label>
        )}
        <IoniconsIcon name="chevron-down" size={20} className="text-accent-foreground" />
      </Button>

      <CustomSheet open={isOpen} onOpenChange={handleOpenChange} scrollable>
        <View className="flex-1 gap-1">
          {selectOptions.map((item) => {
            const isSelected = item.value === selectedOption?.value;
            return (
              <RippleButton key={item.value} onPress={() => handleValueChange(item)}>
                <View className="flex-row items-center gap-3 flex-1 py-3 px-4">
                  <Text className="text-base text-foreground flex-1">{item.label}</Text>
                  {isSelected && <IoniconsIcon name="checkmark" size={20} className="text-accent" />}
                </View>
              </RippleButton>
            );
          })}
        </View>
      </CustomSheet>
    </View>
  );
};

export default memo(CustomSelect);
