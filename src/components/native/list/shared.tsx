// Shared by List.android/ios; it can't live in List.tsx, which those files would resolve back to themselves
import React from 'react';
import { View } from 'react-native';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { IoniconsIcon, type IoniconProps } from '../../Icons';
import { SeparatorLine } from '../separator/Separator';

export interface ListItemProps {
  title: string;
  /** For e2e tests: on the row; its `action` button gets `<testID>-action` */
  testID?: string;
  description?: string;
  icon?: IoniconProps['name'];
  /** Value at the end of the row, drawn natively. Pressable rows show a chevron when it's left out. */
  trailing?: string;
  /** A spinner in place of `trailing`, e.g. while checking */
  trailingLoading?: boolean;
  /** `danger` colours `trailing` red, e.g. for an error; muted otherwise */
  trailingTone?: 'muted' | 'danger';
  onPress?: () => void;
  disabled?: boolean;
  /** A separate button at the end of the row, like "remove". On TV it is its own focus stop. */
  action?: { icon: IoniconProps['name']; label: string; onPress: () => void };
  /** An info button at the end of the row that explains it in a bubble beside the button. On TV it is its own focus stop. */
  info?: { title: string; text: string };
  /** A switch at the end of the row; on Android the whole row flips it */
  toggle?: { value: boolean; onValueChange: (value: boolean) => void };
}

export interface ListProps {
  /** `List.Item`s; null/false entries and fragments are fine */
  children: React.ReactNode;
  /** `flat`: Aniyomi-style edge-to-edge rows with accent icons, no card or dividers */
  variant?: 'card' | 'flat';
}

// heroui ListGroup's look: a rounded surface card, dividers inset 16 from the edges
export const RADIUS = 24;
export const INSET = 16;

/** Whether the enclosing list is `flat`, for items to pick their icon colour */
export const FlatListContext = React.createContext(false);

/** The `List.Item` elements among children, with fragments unwrapped, so the list can put dividers between them */
export const listItems = (children: React.ReactNode): React.ReactElement<ListItemProps>[] =>
  React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) return [];
    if (child.type === React.Fragment) return listItems((child.props as { children?: React.ReactNode }).children);
    return [child as React.ReactElement<ListItemProps>];
  });

/** The card's items with an inset divider between each pair */
export const withDividers = (items: React.ReactElement[]) =>
  items.map((item, index) => (
    <React.Fragment key={item.key ?? index}>
      {index > 0 && <SeparatorLine inset={INSET} />}
      {item}
    </React.Fragment>
  ));

type RNHostViewComponent = React.ComponentType<{ matchContents?: boolean; children: React.ReactElement }>;

type HostedIconProps = { name: IoniconProps['name']; size: number; color: string; label?: string };

/** An Ionicon inside the native tree, in the platform's `RNHostView`; `label` names an icon-only button */
export const createHostedIcon = (RNHostView: RNHostViewComponent) =>
  function HostedIcon({ name, size, color, label }: HostedIconProps) {
    return (
      <RNHostView matchContents>
        <View accessibilityLabel={label}>
          <IoniconsIcon name={name} size={size} color={color} />
        </View>
      </RNHostView>
    );
  };

type TrailingProps = Pick<ListItemProps, 'trailingLoading' | 'trailingTone'> & {
  text?: string;
  chevron: boolean;
};

/** The end of a row from the platform's views: a spinner while loading, else the `trailing` text, else a chevron */
export const createTrailing = (render: {
  spinner: (color: string) => React.ReactElement;
  text: (text: string, color: string) => React.ReactElement;
  chevron: (color: string) => React.ReactElement;
}) =>
  function Trailing({ text, trailingLoading, trailingTone, chevron }: TrailingProps) {
    const theme = useCurrentTheme();
    if (trailingLoading) return render.spinner(theme.muted);
    if (text) return render.text(text, trailingTone === 'danger' ? theme.danger : theme.muted);
    if (chevron) return render.chevron(theme.muted);
    return null;
  };
