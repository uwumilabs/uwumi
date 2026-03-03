/**
 * UI Primitives - Small reusable UI components consolidated into one file
 * This file contains lightweight, frequently-used components that don't warrant separate files
 */

import React, { ReactNode, forwardRef, useCallback, useState } from 'react';
import {
  View,
  ViewProps,
  Text,
  StyleProp,
  ViewStyle,
  type NativeSyntheticEvent,
  type TargetedEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore, useCurrentTheme, usePureBlackBackground } from '@/hooks';
import { StatusBar, StatusBarProps } from 'expo-status-bar';
import { Link } from 'expo-router';
import { cn, PressableFeedback, PressableFeedbackProps } from 'heroui-native';
import { IoniconProps, IoniconsIcon } from './Icons';
import { SystemBars } from 'react-native-edge-to-edge';
import { isTV } from '@/constants/utils';

/* ============================================
 * IconTitle - Icon with text label
 * ============================================ */

interface IconTitleProps {
  iconName: IoniconProps['name'];
  text: any;
  color?: string;
}

export const IconTitle = ({ iconName, text, color }: IconTitleProps) => {
  return (
    <HUXStack className="items-center gap-2">
      <IoniconsIcon name={iconName} color={color} className="text-foreground" size={16} />
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
  /** Whether this element should receive initial focus when the screen mounts (TV only). */
  hasTVPreferredFocus?: boolean;
};

export const RippleButton = forwardRef<View, RippleButtonProps>(
  ({ onPress, children, containerStyle, className, hasTVPreferredFocus, ...props }, ref) => {
    const currentTheme = useCurrentTheme();
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = useCallback(
      (e: NativeSyntheticEvent<TargetedEvent>) => {
        setIsFocused(true);
        if (typeof props.onFocus === 'function') {
          props.onFocus(e);
        }
      },
      [props.onFocus],
    );

    const handleBlur = useCallback(
      (e: NativeSyntheticEvent<TargetedEvent>) => {
        setIsFocused(false);
        if (typeof props.onBlur === 'function') {
          props.onBlur(e);
        }
      },
      [props.onBlur],
    );

    return (
      <PressableFeedback
        ref={ref}
        onPress={onPress}
        className={cn('rounded-full p-2', className)}
        style={[
          containerStyle,
          isTV && {
            borderWidth: 2,
            borderColor: 'transparent',
            borderRadius: 12,
          },
          isTV &&
            isFocused && {
              borderColor: currentTheme?.accent,
              transform: [{ scale: 1.05 }],
            },
        ]}
        focusable={isTV ? true : undefined}
        hasTVPreferredFocus={isTV ? hasTVPreferredFocus : undefined}
        onFocus={isTV ? handleFocus : props.onFocus}
        onBlur={isTV ? handleBlur : props.onBlur}
        animation={{
          scale: {
            value: 0.98,
            timingConfig: { duration: 150 },
          },
        }}
        {...props}>
        <PressableFeedback.Ripple
          animation={{
            backgroundColor: { value: currentTheme.default },
            opacity: { value: [0, 0.3, 0] },
            progress: { baseDuration: 600 },
          }}
        />
        {children}
      </PressableFeedback>
    );
  },
);

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
  style,
  ...props
}: ThemedViewProps) {
  const isDark = useThemeStore((state) => state.isDark);
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const currentTheme = useCurrentTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <View
        style={[
          {
            paddingTop: useSafeArea ? 0 : insets.top,
            backgroundColor: pureBlackBackground ? '#000' : currentTheme?.background,
          },
          style,
        ]}
        className="flex-1"
        {...props}>
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
      <SystemBars hidden={!useStatusBar} />
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

// Allow importing components individually
export default {
  IconTitle,
  RippleButton,
  NoResults,
  ThemedView,
  HUXStack,
  HUYStack,
};
