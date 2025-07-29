import React, { memo, useState } from 'react';
import { Check, ChevronDown, X } from '@tamagui/lucide-icons';
import { Adapt, Select, Sheet } from 'tamagui';
import { usePureBlackBackground } from '@/hooks';
import RippleButton from './RippleButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SelectOption = {
  name: string;
  value: string;
};

const CustomSelect = ({
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
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const bgColor = pureBlackBackground ? '$color3' : 'black';
  const [openSelect, setOpenSelect] = useState(false);
  const insets = useSafeAreaInsets();

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);
    setOpenSelect(false);
  };

  return (
    <Select open={openSelect} value={value} onValueChange={handleValueChange} onOpenChange={setOpenSelect}>
      <Select.Trigger backgroundColor={bgColor} width={150} iconAfter={ChevronDown}>
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
          <Sheet.Overlay backgroundColor="transparent" />
          <Sheet.Frame paddingBottom={insets.bottom} backgroundColor={bgColor}>
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
            <Select.Label backgroundColor={bgColor} width={'100%'}>
              {SelectLabel}{' '}
              <RippleButton onPress={() => setOpenSelect(false)}>
                <X />
              </RippleButton>
            </Select.Label>

            {SelectItem.map((item, index) => (
              <Select.Item backgroundColor={bgColor} key={item.value} index={index} value={item.value}>
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
