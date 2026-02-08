import React, { memo, useCallback, useMemo } from 'react';
import { Button, Select } from 'heroui-native';
import { ScrollView, Text, View } from 'react-native';
import { useSheetColor } from '@/hooks';
import { IoniconsIcon } from './Icons';

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
  const handleValueChange = useCallback(
    (option?: { value: string }) => {
      if (option?.value) {
        onValueChange(option.value);
      }
    },
    [onValueChange],
  );

  return (
    <Select value={selectedOption} onValueChange={handleValueChange} presentation="bottom-sheet">
      <Select.Trigger asChild>
        <Button>
          {selectedOption ? (
            <View className="flex-row items-center gap-2">
              <Button.Label>{selectedOption.label}</Button.Label>
            </View>
          ) : (
            <Button.Label className="text-foreground">{SelectLabel}</Button.Label>
          )}
          <IoniconsIcon name="chevron-down" size={20} className="text-accent-foreground" />
        </Button>
      </Select.Trigger>
      <Select.Portal>
        <Select.Overlay />
        <Select.Content detached backgroundStyle={{ backgroundColor: sheetColor }} presentation="bottom-sheet">
          <ScrollView>
            {selectOptions.map((item) => (
              <Select.Item key={item.value} value={item.value} label={item.label}>
                <View className="flex-row items-center gap-3 flex-1">
                  <Text className="text-base text-foreground flex-1">{item.label}</Text>
                </View>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </ScrollView>
        </Select.Content>
      </Select.Portal>
    </Select>
  );
};

export default memo(CustomSelect);
