/**
 * UI Primitives - Small reusable UI components consolidated into one file
 * This file contains lightweight, frequently-used components that don't warrant separate files
 */

import React, { FC } from 'react';
import { View, Theme, ViewProps, Text, XStack, YStack, styled, GetProps } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore, useAccentStore, useCurrentTheme, usePureBlackBackground } from '@/hooks';
import { StatusBar, StatusBarProps } from 'expo-status-bar';
import { TouchableWithoutFeedbackProps } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { Link } from 'expo-router';

/* ============================================
 * IconTitle - Icon with text label
 * ============================================ */

interface IconTitleProps {
  icon?: React.ElementType;
  text: any;
  color?: string;
  iconProps?: Record<string, unknown>;
  textProps?: Partial<GetProps<typeof Text>>;
}

const IconText = styled(Text, {
  fontSize: 14,
  color: '$color1',
});

const IconContainer = styled(XStack, {
  alignItems: 'center',
  gap: 4,
});

export const IconTitle = ({ icon: Icon, text, color, iconProps, textProps }: IconTitleProps) => {
  return (
    <IconContainer>
      {Icon && <Icon color={color ? color : '$color1'} size={16} {...iconProps} />}
      <IconText color={color ? color : '$color1'} {...textProps}>
        {text}
      </IconText>
    </IconContainer>
  );
};

/* ============================================
 * RippleButton - Material ripple effect button
 * ============================================ */

interface RippleButtonProps extends TouchableWithoutFeedbackProps {
  onPress: () => void;
  children?: React.ReactNode;
}

export const RippleButton: FC<RippleButtonProps> = ({ onPress, children, ...props }) => {
  const themeName = useThemeStore((state) => state.themeName);
  return (
    <Ripple
      onPress={(e) => {
        setTimeout(() => onPress(), 300);
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

/* ============================================
 * NoResults - Empty state with random kaomoji
 * ============================================ */

const KAOMOJI = [
  'Σ(ಠ_ಠ)',
  '(´･_･`)',
  '(╥﹏╥)',
  '(；一_一)',
  '(┬┬﹏┬┬)',
  '(－‸ლ)',
  '(｡•́︿•̀｡)',
  '(╯°□°）╯',
  '(⊙_⊙;)',
  'ヽ(°〇°)ﾉ',
];

export const NoResults = () => {
  const randomKaomoji = KAOMOJI[Math.floor(Math.random() * KAOMOJI.length)];

  return (
    <YStack padding="$4" alignItems="center" justifyContent="center" gap="$4">
      <Text fontSize={46} fontWeight={500} textAlign="center" color="$color1">
        {randomKaomoji}
      </Text>
      <Text fontSize={16} color="$color">
        No results found
      </Text>
      <Text fontSize={14} color="$color1" textAlign="center">
        Haven't installed extensions yet? Install them from{' '}
        <Link href="/(settings)/extensions">
          <Text fontSize={14} color="$color" textDecorationLine="underline">
            here
          </Text>
        </Link>
      </Text>
    </YStack>
  );
};

/* ============================================
 * ThemedView - Main view wrapper with theme support
 * ============================================ */

export type ThemedViewProps = {
  children?: React.ReactNode;
  useSafeArea?: boolean;
  useStatusBar?: boolean;
  statusBarProps?: StatusBarProps;
} & ViewProps;

export function ThemedView({
  children,
  useSafeArea = false, // because of edge-to-edge we won't be using safe area insets
  useStatusBar = true,
  statusBarProps,
  ...props
}: ThemedViewProps) {
  const themeName = useThemeStore((state) => state.themeName);
  const accentName = useAccentStore((state) => state.accentName);
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const currentTheme = useCurrentTheme();
  const insets = useSafeAreaInsets();

  return (
    <Theme name={accentName}>
      <View
        paddingTop={useSafeArea ? 0 : insets.top}
        flex={1}
        backgroundColor={pureBlackBackground ? '#000' : '$background'}
        {...props}>
        {children}
      </View>

      <StatusBar
        animated
        hideTransitionAnimation="slide"
        hidden={!useStatusBar}
        style={themeName === 'dark' ? 'light' : 'dark'}
        backgroundColor={pureBlackBackground ? '#000' : currentTheme?.background}
        {...statusBarProps}
      />
    </Theme>
  );
}

/* ============================================
 * Default exports for backward compatibility
 * ============================================ */

// Allow importing components individually
export default {
  IconTitle,
  RippleButton,
  NoResults,
  ThemedView,
};
