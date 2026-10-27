import React from 'react';
import { View } from 'react-native';
import {
  Card,
  CircularProgressIndicator,
  Column,
  Host,
  IconButton,
  ListItem as ComposeListItem,
  RNHostView,
  Row,
  Switch,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  clickable,
  clip,
  fillMaxWidth,
  padding,
  Shapes,
  size,
  toggleable,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';
import { useCurrentTheme } from '@/hooks';
import { IoniconsIcon, type IoniconProps } from '../../Icons';
import { SeparatorLine } from '../separator/Separator';
import { FlatListContext, listItems, type ListItemProps, type ListProps } from './shared';

// heroui ListGroup's look: a rounded surface card, dividers inset 16 from the edges
const RADIUS = 24;
const INSET = 16;

type HostedIconProps = { name: IoniconProps['name']; size: number; color: string; label?: string };

const HostedIcon = ({ name, size: iconSize, color, label }: HostedIconProps) => (
  <RNHostView matchContents>
    <View accessibilityLabel={label}>
      <IoniconsIcon name={name} size={iconSize} color={color} />
    </View>
  </RNHostView>
);

type TrailingProps = Pick<ListItemProps, 'trailingLoading' | 'trailingTone'> & { text?: string; chevron: boolean };

// The end of the row: a spinner, a value, or a chevron on pressable rows
const Trailing = ({ text, trailingLoading, trailingTone, chevron }: TrailingProps) => {
  const theme = useCurrentTheme();
  if (trailingLoading) return <CircularProgressIndicator color={theme.muted} modifiers={[size(18, 18)]} />;
  if (text) {
    return (
      <Text color={trailingTone === 'danger' ? theme.danger : theme.muted} style={{ fontSize: 14 }}>
        {text}
      </Text>
    );
  }
  if (chevron) return <HostedIcon name="chevron-forward" size={16} color={theme.muted} />;
  return null;
};

// Compose's own clickable handles taps and D-pad focus, with Material's focus highlight
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
  const pressable = !!onPress && !disabled;
  // Aniyomi's flat rows go without one
  const chevron = !!onPress && !action && !toggle && !flat;
  const hasTrailing = !!trailingLoading || !!trailing || chevron || !!toggle;
  const press = toggle
    ? [toggleable(toggle.value, () => toggle.onValueChange(!toggle.value), { role: 'switch', enabled: !disabled })]
    : pressable
      ? [clickable(onPress)]
      : [];

  const item = (
    <ComposeListItem
      colors={{ containerColor: 'transparent' }}
      modifiers={[action ? weight(1) : fillMaxWidth(), ...press]}>
      <ComposeListItem.HeadlineContent>
        <Text color={theme.foreground} style={{ fontSize: 16, fontWeight: '500' }}>
          {title}
        </Text>
      </ComposeListItem.HeadlineContent>
      {description ? (
        <ComposeListItem.SupportingContent>
          <Text color={theme.muted} style={{ fontSize: 14 }}>
            {description}
          </Text>
        </ComposeListItem.SupportingContent>
      ) : null}
      {icon ? (
        <ComposeListItem.LeadingContent>
          <HostedIcon name={icon} size={flat ? 24 : 20} color={flat ? theme.accent : theme.foreground} />
        </ComposeListItem.LeadingContent>
      ) : null}
      {hasTrailing ? (
        <ComposeListItem.TrailingContent>
          {toggle ? (
            <Switch
              value={toggle.value}
              enabled={!disabled}
              colors={{
                checkedTrackColor: theme.accent,
                checkedThumbColor: theme.accentForeground,
                checkedBorderColor: theme.accent,
                uncheckedTrackColor: 'transparent',
                uncheckedThumbColor: theme.muted,
                uncheckedBorderColor: theme.muted,
              }}
            />
          ) : (
            <Trailing text={trailing} trailingLoading={trailingLoading} trailingTone={trailingTone} chevron={chevron} />
          )}
        </ComposeListItem.TrailingContent>
      ) : null}
    </ComposeListItem>
  );

  if (!action) return item;
  // Beside the row rather than in its trailing slot, so the D-pad can reach it
  return (
    <Row verticalAlignment="center" modifiers={[fillMaxWidth(), padding(0, 0, 8, 0)]}>
      {item}
      <IconButton onClick={action.onPress}>
        <HostedIcon name={action.icon} size={18} color={theme.foreground} label={action.label} />
      </IconButton>
    </Row>
  );
};

const ListRoot = ({ children, variant = 'card' }: ListProps) => {
  const theme = useCurrentTheme();
  const items = listItems(children);
  if (items.length === 0) return null;

  if (variant === 'flat') {
    return (
      <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
        <FlatListContext.Provider value>
          <Column modifiers={[fillMaxWidth()]}>{items}</Column>
        </FlatListContext.Provider>
      </Host>
    );
  }

  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <Card colors={{ containerColor: theme.surface }} modifiers={[fillMaxWidth(), clip(Shapes.RoundedCorner(RADIUS))]}>
        <Column modifiers={[fillMaxWidth()]}>
          {items.map((item, index) => (
            <React.Fragment key={item.key ?? index}>
              {index > 0 && <SeparatorLine inset={INSET} />}
              {item}
            </React.Fragment>
          ))}
        </Column>
      </Card>
    </Host>
  );
};

export const List = Object.assign(ListRoot, { Item });

export default List;
