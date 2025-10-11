import { useThemeStore } from '@/hooks';
import React, { FC } from 'react';
import { TouchableWithoutFeedbackProps } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { View } from 'tamagui';

interface RippleButtonProps extends TouchableWithoutFeedbackProps {
  onPress: () => void;
  children?: React.ReactNode;
}

const RippleButton: FC<RippleButtonProps> = ({ onPress, children, ...props }) => {
  const themeName = useThemeStore((state) => state.themeName);
  return (
    <Ripple
      onPress={(e) => {
        setTimeout(() => onPress(), 300);
        // e.preventDefault();
        // e.stopPropagation();
      }}
      rippleColor={themeName === 'light' ? 'black' : 'white'}
      rippleDuration={300}
      rippleContainerBorderRadius={50}
      rippleOpacity={1}
      {...props}>
      <View padding={10}>{children}</View>
    </Ripple>
  );
};

export default RippleButton;
