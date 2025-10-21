import React, { memo, useState } from 'react';
import { Check, ChevronDown, X } from '@tamagui/lucide-icons';
import { Adapt, Select, Sheet } from 'tamagui';
import { RippleButton } from './ui-primitives';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSheetColor } from '@/hooks';

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
  const [openSelect, setOpenSelect] = useState(false);
  const insets = useSafeAreaInsets();
  const sheetColor = useSheetColor();

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);
    setOpenSelect(false);
  };

  return (
    <Select open={openSelect} value={value} onValueChange={handleValueChange} onOpenChange={setOpenSelect}>
      <Select.Trigger backgroundColor={sheetColor} width={150} iconAfter={ChevronDown}>
        <Select.Value width={90}>{SelectItem.find((opt) => opt.value === value)?.name || SelectLabel}</Select.Value>
      </Select.Trigger>

      <Adapt platform="touch">
        <Sheet
          modal
          open={openSelect}
          onOpenChange={setOpenSelect}
          snapPoints={[40]}
          dismissOnSnapToBottom
          animation="quick">
          <Sheet.Overlay
            backgroundColor="rgba(0,0,0,0.5)"
            animation="quick"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Sheet.Frame paddingBottom={insets.bottom} backgroundColor={sheetColor}>
            <Sheet.ScrollView showsVerticalScrollIndicator>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
        </Sheet>
      </Adapt>

      <Select.Content zIndex={200000}>
        <Select.Viewport
          animation="quick"
          animateOnly={['transform', 'opacity']}
          enterStyle={{ x: 0, y: -10 }}
          exitStyle={{ x: 0, y: 10 }}
          minWidth={200}>
          <Select.Group>
            <Select.Label backgroundColor={sheetColor} width={'100%'}>
              {SelectLabel}{' '}
              <RippleButton onPress={() => setOpenSelect(false)}>
                <X />
              </RippleButton>
            </Select.Label>

            {SelectItem.map((item, index) => (
              <Select.Item backgroundColor={sheetColor} key={item.value} index={index} value={item.value}>
                <Select.ItemText>{item.name}</Select.ItemText>
                <Select.ItemIndicator marginLeft="auto">
                  <Check size={16} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Group>
        </Select.Viewport>
      </Select.Content>
    </Select>
  );
};

export default memo(CustomSelect);
