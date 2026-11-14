import React, { ReactNode, forwardRef, useContext, useState } from 'react';
import { SETTINGS_SCREENS } from '@/utils/routes';
import { View, ViewProps, Text, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import { HeaderShownContext } from 'expo-router/react-navigation';
import { cn, PressableFeedback, PressableFeedbackProps } from './heroui';
import { IoniconProps, IoniconsIcon } from './Icons';
import { SystemBars } from 'react-native-edge-to-edge';
import { isTV, tvFocusRingStyle } from '@/utils/tv';

interface IconTitleProps {
  iconName: IoniconProps['name'];
  text: any;
}

export const IconTitle = ({ iconName, text }: IconTitleProps) => {
  return (
    <HUXStack className="items-center gap-2">
      <IoniconsIcon name={iconName} className="text-foreground" size={16} />
      <Text className="text-14 text-foreground">{text}</Text>
    </HUXStack>
  );
};

type RippleButtonProps = Omit<PressableFeedbackProps, 'onPress'> & {
  onPress?: () => void;
  children?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  className?: string;
  /** Whether this element should receive initial focus when the screen mounts (TV only). */
  hasTVPreferredFocus?: boolean;
  /** Scale while focused on TV. Default: 1.05; rows that fill their container should use 1 */
  focusScale?: number;
};

export const RippleButton = forwardRef<React.ComponentRef<typeof View>, RippleButtonProps>(
  ({ onPress, children, containerStyle, className, hasTVPreferredFocus, focusScale, ...props }, ref) => {
    const currentTheme = useCurrentTheme();

    return (
      <PressableFeedback
        ref={ref}
        onPress={onPress}
        className={cn('rounded-full p-2', className)}
        // No radius here: the ring follows the button's own rounded-* class
        style={[containerStyle, isTV && tvFocusRingStyle({ color: currentTheme?.accent, scale: focusScale })]}
        isAnimatedStyleActive={!isTV}
        focusable={isTV ? true : undefined}
        hasTVPreferredFocus={isTV ? hasTVPreferredFocus : undefined}
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
RippleButton.displayName = 'RippleButton';

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

/** Without a `hint`, it points to Extensions, the usual reason a search or feed comes back empty. */
export const NoResults = ({ title = 'No results found', hint }: { title?: string; hint?: string }) => {
  // Picked once per mount, so it doesn't change on every re-render
  const [randomKaomoji] = useState(() => KAOMOJI[Math.floor(Math.random() * KAOMOJI.length)]);

  return (
    <HUYStack testID="no-results" className="p-2 pt-4 items-center justify-center gap-2">
      <Text className="text-5xl font-medium text-center text-foreground">{randomKaomoji}</Text>
      <Text className="text-xl text-accent">{title}</Text>
      {hint ? (
        <Text className="text-xs text-foreground text-center">{hint}</Text>
      ) : (
        <Text className="text-xs text-foreground text-center">
          Haven't installed extensions yet? Install them from{' '}
          <Link href={SETTINGS_SCREENS.extensions.href}>
            <Text className="text-xs text-accent underline">here</Text>
          </Link>
        </Text>
      )}
    </HUYStack>
  );
};

export type ThemedViewProps = {
  children?: React.ReactNode;
  useSafeArea?: boolean;
  useStatusBar?: boolean;
} & ViewProps;

export function ThemedView({
  children,
  useSafeArea = false, // because of edge-to-edge we won't be using safe area insets
  useStatusBar = true,
  style,
  ...props
}: ThemedViewProps) {
  const currentTheme = useCurrentTheme();
  const insets = useSafeAreaInsets();
  // A native stack header already covers the status bar
  const headerShown = useContext(HeaderShownContext);

  return (
    <>
      <View
        style={[
          {
            paddingTop: useSafeArea || headerShown ? 0 : insets.top,
            backgroundColor: currentTheme.screenBackground,
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
        style={currentTheme.isDark ? 'light' : 'dark'}
      />
      <SystemBars hidden={!useStatusBar} />
    </>
  );
}

type StackProps = ViewProps & { children?: ReactNode; className?: string };

export const HUXStack = ({ className, ...props }: StackProps) => (
  <View className={cn('flex flex-row', className)} {...props} />
);

export const HUYStack = ({ className, ...props }: StackProps) => (
  <View className={cn('flex flex-col', className)} {...props} />
);

/** An Aniyomi-style settings section title, above a flat list */
export const SectionTitle = ({ children }: { children: string }) => (
  <Text className="px-4 pb-1 pt-5 text-sm font-semibold text-accent">{children}</Text>
);
