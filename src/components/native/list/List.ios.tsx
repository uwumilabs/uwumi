import React from 'react';
import { View } from 'react-native';
import { Button, HStack, Host, Image, ProgressView, RNHostView, Spacer, Text, Toggle, VStack } from '@expo/ui/swift-ui';
import {
  background,
  buttonStyle,
  contentShape,
  controlSize,
  font,
  foregroundStyle,
  frame,
  labelsHidden,
  padding,
  shapes,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks';
import { IoniconsIcon, type IoniconProps } from '../../Icons';
import { SeparatorLine } from '../separator/Separator';
import { FlatListContext, listItems, type ListItemProps, type ListProps } from './shared';

// heroui ListGroup's look: a rounded surface card, rows padded 16 with a 12 gap, dividers inset 16
const RADIUS = 24;
const INSET = 16;

type HostedIconProps = { name: IoniconProps['name']; size: number; color: string; label?: string };

const HostedIcon = ({ name, size, color, label }: HostedIconProps) => (
  <RNHostView matchContents>
    <View accessibilityLabel={label}>
      <IoniconsIcon name={name} size={size} color={color} />
    </View>
  </RNHostView>
);

type TrailingProps = Pick<ListItemProps, 'trailingLoading' | 'trailingTone'> & { text?: string; chevron: boolean };

// The end of the row: a spinner, a value, or a chevron on pressable rows
const Trailing = ({ text, trailingLoading, trailingTone, chevron }: TrailingProps) => {
  const theme = useCurrentTheme();
  if (trailingLoading) return <ProgressView modifiers={[controlSize('small'), tint(theme.muted)]} />;
  if (text) {
    return (
      <Text modifiers={[font({ size: 14 }), foregroundStyle(trailingTone === 'danger' ? theme.danger : theme.muted)]}>
        {text}
      </Text>
    );
  }
  if (chevron) return <Image systemName="chevron.right" size={14} color={theme.muted} />;
  return null;
};

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
  toggle,
}: ListItemProps) => {
  const theme = useCurrentTheme();
  const flat = React.useContext(FlatListContext);
  const pressable = !!onPress && !disabled && !toggle;

  const content = (
    <HStack spacing={flat ? 20 : 12} modifiers={[padding({ all: INSET }), contentShape(shapes.rectangle())]}>
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
          modifiers={[labelsHidden(), tint(theme.accent)]}
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
    <Button onPress={onPress} modifiers={[buttonStyle('plain')]}>
      {content}
    </Button>
  ) : (
    content
  );

  if (!action) return row;
  return (
    <HStack spacing={0}>
      {row}
      <Button onPress={action.onPress} modifiers={[buttonStyle('plain'), padding({ trailing: 12 })]}>
        <HostedIcon name={action.icon} size={18} color={theme.foreground} label={action.label} />
      </Button>
    </HStack>
  );
};

const ListRoot = ({ children, variant = 'card' }: ListProps) => {
  const theme = useCurrentTheme();
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

  return (
    <Host matchContents={{ vertical: true }} ignoreSafeArea="container" style={{ width: '100%' }}>
      <VStack
        spacing={0}
        modifiers={[
          frame({ maxWidth: Infinity }),
          background(theme.surface, shapes.roundedRectangle({ cornerRadius: RADIUS })),
        ]}>
        {items.map((item, index) => (
          <React.Fragment key={item.key ?? index}>
            {index > 0 && <SeparatorLine inset={INSET} />}
            {item}
          </React.Fragment>
        ))}
      </VStack>
    </Host>
  );
};

export const List = Object.assign(ListRoot, { Item });

export default List;
