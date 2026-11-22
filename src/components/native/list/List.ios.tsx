import React, { useState } from 'react';
import { Button, HStack, Host, Image, Popover, ProgressView, Spacer, Text, Toggle, VStack } from '@expo/ui/swift-ui';
import {
  buttonStyle,
  contentShape,
  fixedSize,
  controlSize,
  font,
  foregroundStyle,
  frame,
  padding,
  shapes,
  tint,
  accessibilityIdentifier,
  accessibilityLabel,
} from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { toggleModifiers } from '../switch/Switch.ios';
import { HostedIcon, INSET, listItems } from '../card/card';
import { HostedIconButton } from '../card/HostedIconButton';
import { NativeCard } from '../card/NativeCard';
import { createTrailing, FlatListContext, type ListItemProps, type ListProps } from './shared';

const Trailing = createTrailing({
  spinner: (color) => <ProgressView modifiers={[controlSize('small'), tint(color)]} />,
  text: (text, color) => <Text modifiers={[font({ size: 14 }), foregroundStyle(color)]}>{text}</Text>,
  chevron: (color) => <Image systemName="chevron.right" size={14} color={color} />,
});

const Item = ({
  title,
  description,
  icon,
  trailing,
  trailingLoading,
  trailingTone,
  onPress,
  disabled,
  action,
  info,
  toggle,
  testID,
}: ListItemProps) => {
  const theme = useCurrentTheme();
  const flat = React.useContext(FlatListContext);
  const pressable = !!onPress && !disabled && !toggle;
  const id = (suffix = '') => (testID ? [accessibilityIdentifier(testID + suffix)] : []);

  const content = (
    <HStack
      spacing={flat ? 20 : 12}
      modifiers={[padding({ all: INSET }), contentShape(shapes.rectangle()), ...(pressable ? [] : id())]}>
      {icon ? <HostedIcon name={icon} size={flat ? 24 : 20} color={flat ? theme.accent : theme.foreground} /> : null}
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[font({ size: 16, weight: 'medium' }), foregroundStyle(theme.foreground)]}>{title}</Text>
        {description ? <Text modifiers={[font({ size: 14 }), foregroundStyle(theme.muted)]}>{description}</Text> : null}
      </VStack>
      <Spacer />
      {toggle ? (
        <Toggle
          isOn={toggle.value}
          onIsOnChange={toggle.onValueChange}
          // The row's title is a sibling Text, so VoiceOver would read the switch as just "0" or "1"
          modifiers={[...toggleModifiers(theme), accessibilityLabel(title)]}
        />
      ) : (
        <Trailing
          text={trailing}
          trailingLoading={trailingLoading}
          trailingTone={trailingTone}
          chevron={!!onPress && !action && !flat}
        />
      )}
    </HStack>
  );

  const row = pressable ? (
    <Button onPress={onPress} modifiers={[buttonStyle('plain'), ...id()]}>
      {content}
    </Button>
  ) : (
    content
  );

  if (!action && !info) return row;
  return (
    <HStack spacing={0} modifiers={[padding({ trailing: 12 })]}>
      {row}
      {action ? (
        <HostedIconButton
          icon={action.icon}
          label={action.label}
          onPress={action.onPress}
          testID={testID ? `${testID}-action` : undefined}
          size={18}
        />
      ) : info ? (
        <InfoButton {...info} />
      ) : null}
    </HStack>
  );
};

/** A popover bubble from the button, as on iPad, rather than a sheet */
const InfoButton = ({ title, text }: NonNullable<ListItemProps['info']>) => {
  const theme = useCurrentTheme();
  const [open, setOpen] = useState(false);
  return (
    <Popover isPresented={open} onIsPresentedChange={setOpen} arrowEdge="top">
      <Popover.Trigger>
        <Button onPress={() => setOpen(true)} modifiers={[buttonStyle('plain')]}>
          <HostedIcon name="information-circle-outline" size={20} color={theme.foreground} label={`About ${title}`} />
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 16 }), frame({ width: 300 })]}>
          <Text modifiers={[font({ size: 16, weight: 'semibold' }), foregroundStyle(theme.foreground)]}>{title}</Text>
          <Text
            modifiers={[
              font({ size: 14 }),
              foregroundStyle(theme.muted),
              fixedSize({ horizontal: false, vertical: true }),
            ]}>
            {text}
          </Text>
        </VStack>
      </Popover.Content>
    </Popover>
  );
};

const ListRoot = ({ children, variant = 'card' }: ListProps) => {
  const items = listItems(children);
  if (items.length === 0) return null;

  // ignoreSafeArea: in a ScrollView under the status bar, SwiftUI would push the rows down by the inset
  if (variant === 'flat') {
    return (
      <Host matchContents={{ vertical: true }} ignoreSafeArea="container" style={{ width: '100%' }}>
        <FlatListContext.Provider value>
          <VStack spacing={0} modifiers={[frame({ maxWidth: Infinity })]}>
            {items}
          </VStack>
        </FlatListContext.Provider>
      </Host>
    );
  }

  return <NativeCard>{items}</NativeCard>;
};

export const List = Object.assign(ListRoot, { Item });
