import React, { useRef } from 'react';
import {
  CircularProgressIndicator,
  Column,
  Host,
  IconButton,
  ListItem as ComposeListItem,
  Row,
  Switch,
  Text,
  TooltipBox,
  type TooltipBoxRef,
} from '@expo/ui/jetpack-compose';
import {
  clickable,
  fillMaxWidth,
  padding,
  size,
  toggleable,
  weight,
  testID as testTag,
} from '@expo/ui/jetpack-compose/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { switchColors } from '../switch/Switch.android';
import { HostedIcon, listItems } from '../card/card';
import { HostedIconButton } from '../card/HostedIconButton';
import { NativeCard } from '../card/NativeCard';
import { createTrailing, FlatListContext, type ListItemProps, type ListProps } from './shared';

const Trailing = createTrailing({
  spinner: (color) => <CircularProgressIndicator color={color} modifiers={[size(18, 18)]} />,
  text: (text, color) => (
    <Text color={color} style={{ fontSize: 14 }}>
      {text}
    </Text>
  ),
  chevron: (color) => <HostedIcon name="chevron-forward" size={16} color={color} />,
});

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
  info,
  toggle,
  testID,
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
      modifiers={[action || info ? weight(1) : fillMaxWidth(), ...press, ...(testID ? [testTag(testID)] : [])]}>
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
            <Switch value={toggle.value} enabled={!disabled} colors={switchColors(theme)} />
          ) : (
            <Trailing text={trailing} trailingLoading={trailingLoading} trailingTone={trailingTone} chevron={chevron} />
          )}
        </ComposeListItem.TrailingContent>
      ) : null}
    </ComposeListItem>
  );

  if (!action && !info) return item;
  // Beside the row rather than in its trailing slot, so the D-pad can reach it
  return (
    <Row verticalAlignment="center" modifiers={[fillMaxWidth(), padding(0, 0, 8, 0)]}>
      {item}
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
    </Row>
  );
};

/** Material's rich tooltip, shown by a tap and kept until the next one */
const InfoButton = ({ title, text }: NonNullable<ListItemProps['info']>) => {
  const theme = useCurrentTheme();
  const tooltip = useRef<TooltipBoxRef>(null);
  return (
    <TooltipBox ref={tooltip} isPersistent>
      <TooltipBox.RichTooltip
        containerColor={theme.surface}
        titleContentColor={theme.foreground}
        contentColor={theme.foreground}>
        <TooltipBox.RichTooltip.Title>
          <Text color={theme.foreground} style={{ fontSize: 16, fontWeight: '600' }}>
            {title}
          </Text>
        </TooltipBox.RichTooltip.Title>
        <TooltipBox.RichTooltip.Text>
          <Text color={theme.foreground} style={{ fontSize: 14 }}>
            {text}
          </Text>
        </TooltipBox.RichTooltip.Text>
      </TooltipBox.RichTooltip>
      <IconButton onClick={() => tooltip.current?.show()}>
        <HostedIcon name="information-circle-outline" size={20} color={theme.foreground} label={`About ${title}`} />
      </IconButton>
    </TooltipBox>
  );
};

const ListRoot = ({ children, variant = 'card' }: ListProps) => {
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

  return <NativeCard>{items}</NativeCard>;
};

export const List = Object.assign(ListRoot, { Item });
