import React, { memo, useCallback, useMemo, useState } from 'react';
import { Button } from './heroui';
import { Text, View } from 'react-native';
import { useBackHandler } from '@/hooks/useBackHandler';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { IoniconsIcon } from './Icons';
import { isTV, tvFocusRingStyle } from '@/utils/tv';
import { BottomSheet } from './native/BottomSheet';
import { RippleButton } from './ui-primitives';

type SelectOption = {
  name: string;
  value: string;
};

const SelectView = ({
  SelectItem,
  SelectLabel,
  value,
  onValueChange,
  size,
  testID,
}: {
  SelectItem: SelectOption[];
  SelectLabel: string;
  value: string;
  onValueChange: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
}) => {
  const selectedOption = useMemo(() => SelectItem.find((item) => item.value === value), [SelectItem, value]);
  const currentTheme = useCurrentTheme();
  const [isOpen, setIsOpen] = useState(false);

  useBackHandler(
    isTV && isOpen,
    useCallback(() => {
      setIsOpen(false);
      return true;
    }, []),
  );

  const handleValueChange = useCallback(
    (option: SelectOption) => {
      onValueChange(option.value);
      setIsOpen(false);
    },
    [onValueChange],
  );

  return (
    <View>
      <Button
        testID={testID}
        variant="primary"
        size={size}
        onPress={() => setIsOpen(true)}
        // The press-scale animated style sits on the same view and stops the ring's :focus styles from applying
        isAnimatedStyleActive={!isTV}
        style={isTV ? tvFocusRingStyle({ color: currentTheme.accentForeground, borderWidth: 5 }) : undefined}>
        {selectedOption ? (
          <Button.Label>{selectedOption.name}</Button.Label>
        ) : (
          <Button.Label className="text-foreground">{SelectLabel}</Button.Label>
        )}
        <IoniconsIcon name="chevron-down" size={size === 'sm' ? 16 : 20} className="text-accent-foreground" />
      </Button>

      <BottomSheet open={isOpen} onOpenChange={setIsOpen}>
        <View className="flex-1 gap-1">
          {SelectItem.map((item) => {
            const isSelected = item.value === selectedOption?.value;
            return (
              <RippleButton
                key={item.value}
                testID={testID && `${testID}-option`}
                onPress={() => handleValueChange(item)}
                hasTVPreferredFocus={isSelected}
                focusScale={1}>
                <View className="flex-row items-center gap-3 flex-1 py-3 px-4">
                  <Text className="text-base text-foreground flex-1">{item.name}</Text>
                  {isSelected && <IoniconsIcon name="checkmark" size={20} className="text-accent" />}
                </View>
              </RippleButton>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
};

export const Select = memo(SelectView);
Select.displayName = 'Select';
