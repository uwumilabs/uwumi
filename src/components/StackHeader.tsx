import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentTheme, usePureBlackBackground } from '@/hooks';
import { HUXStack, RippleButton } from './ui-primitives';
import { IoniconsIcon } from './Icons';

interface StackHeaderProps {
  title?: string;
  /** Shows the back button when provided. */
  onBack?: () => void;
}

// Custom header because the default Expo Router header has edge-to-edge issues; pads for the status bar itself.
export const StackHeader: React.FC<StackHeaderProps> = ({ title, onBack }) => {
  const currentTheme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ backgroundColor: pureBlackBackground ? '#000' : currentTheme?.background, paddingTop: insets.top }}
      className="z-1000">
      <HUXStack className="items-center px-4">
        <View className="w-12 items-start">
          {onBack && (
            <RippleButton onPress={onBack}>
              <IoniconsIcon name="chevron-back" size={24} color={currentTheme?.foreground} />
            </RippleButton>
          )}
        </View>
        <Text className="flex-1 text-foreground text-xl font-semibold text-center" numberOfLines={1}>
          {title}
        </Text>
        <View className="w-12" />
      </HUXStack>
    </View>
  );
};

export default StackHeader;
