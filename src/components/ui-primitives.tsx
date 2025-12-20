/**
 * UI Primitives - Small reusable UI components consolidated into one file
 * This file contains lightweight, frequently-used components that don't warrant separate files
 */

import React, { FC, ReactNode } from 'react';
import { View, ViewProps, Text, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore, useCurrentTheme, usePureBlackBackground } from '@/hooks';
import { StatusBar, StatusBarProps } from 'expo-status-bar';
import { Link } from 'expo-router';
import { cn, PressableFeedback, PressableFeedbackProps } from 'heroui-native';

/* ============================================
 * IconTitle - Icon with text label
 * ============================================ */

interface IconTitleProps {
  icon?: React.ElementType;
  text: any;
  color?: string;
}

export const IconTitle = ({ icon: Icon, text, color }: IconTitleProps) => {
  return (
    <HUXStack className="items-center gap-2">
      {Icon && <Icon className="text-foreground" size={16} />}
      <Text className="text-14 text-foreground">{text}</Text>
    </HUXStack>
  );
};

/* ============================================
 * RippleButton - Material ripple effect button
 * ============================================ */

type RippleButtonProps = Omit<PressableFeedbackProps, 'onPress'> & {
  onPress?: () => void;
  children?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  className?: string;
};

export const RippleButton: FC<RippleButtonProps> = ({ onPress, children, containerStyle, className, ...props }) => {
  const currentTheme = useCurrentTheme();
  return (
    <PressableFeedback
      feedbackVariant="ripple"
      onPress={onPress}
      className={cn('rounded-full p-2', className)}
      style={containerStyle}
      animation={{
        ripple: {
          backgroundColor: { value: currentTheme.accent },
          opacity: { value: [0, 0.3, 0] },
          progress: { baseDuration: 600 },
        },
        scale: {
          value: 0.98,
          timingConfig: { duration: 150 },
        },
      }}
      {...props}>
      {children}
    </PressableFeedback>
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
    <HUYStack className="p-2 items-center justify-center gap-2">
      <Text className="text-5xl font-medium text-center text-foreground">{randomKaomoji}</Text>
      <Text className="text-xl text-accent">No results found</Text>
      <Text className="text-xs text-foreground text-center">
        Haven't installed extensions yet? Install them from{' '}
        <Link href="/(settings)/extensions">
          <Text className="text-xs text-accent underline">here</Text>
        </Link>
      </Text>
    </HUYStack>
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
}: ThemedViewProps) {
  const isDark = useThemeStore((state) => state.isDark);
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const currentTheme = useCurrentTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <View
        style={{
          paddingTop: useSafeArea ? 0 : insets.top,
          backgroundColor: pureBlackBackground ? '#000' : currentTheme?.background,
        }}
        className="flex-1">
        {children}
      </View>

      <StatusBar
        animated
        hideTransitionAnimation="slide"
        hidden={!useStatusBar}
        style={isDark ? 'light' : 'dark'}
        backgroundColor={pureBlackBackground ? '#000' : currentTheme?.background}
        {...statusBarProps}
      />
    </>
  );
}

type SimpleStackProps = {
  children?: ReactNode;
  props?: ViewProps;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export const HUXStack = ({ children, props, className }: SimpleStackProps) => {
  return (
    <View className={cn('flex flex-row', className)} {...props}>
      {children}
    </View>
  );
};

export const HUYStack = ({ children, props, className }: SimpleStackProps) => {
  return (
    <View className={cn('flex flex-col', className)} {...props}>
      {children}
    </View>
  );
};

export const HUZStack = ({ children, props, className }: SimpleStackProps) => {
  return (
    <HUYStack className={cn('relative', className)} {...props}>
      {children}
    </HUYStack>
  );
};

// Allow importing components individually
export default {
  IconTitle,
  RippleButton,
  NoResults,
  ThemedView,
  HUXStack,
  HUYStack,
};
