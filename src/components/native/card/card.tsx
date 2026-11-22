// Shared by the native card's platform files and the lists built on it
import React from 'react';
import { View } from 'react-native';
import { RNHostView } from '@expo/ui';
import { IoniconsIcon, type IoniconProps } from '../../Icons';
import { SeparatorLine } from '../separator/Separator';

// heroui ListGroup's look: a rounded card, dividers inset 16 from the edges
export const RADIUS = 24;
export const INSET = 16;

/** The elements among children, with fragments unwrapped, so a card can put dividers between them */
export const listItems = <P = unknown,>(children: React.ReactNode): React.ReactElement<P>[] =>
  React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) return [];
    if (child.type === React.Fragment) return listItems<P>((child.props as { children?: React.ReactNode }).children);
    return [child as React.ReactElement<P>];
  });

export const withDividers = (items: React.ReactElement[]) =>
  items.map((item, index) => (
    <React.Fragment key={item.key ?? index}>
      {index > 0 && <SeparatorLine inset={INSET} />}
      {item}
    </React.Fragment>
  ));

/** An Ionicon inside a native tree; `label` names an icon-only button */
export const HostedIcon = ({
  name,
  size,
  color,
  label,
}: {
  name: IoniconProps['name'];
  size: number;
  color: string;
  label?: string;
}) => (
  <RNHostView matchContents>
    <View accessibilityLabel={label}>
      <IoniconsIcon name={name} size={size} color={color} />
    </View>
  </RNHostView>
);

export interface HostedIconButtonProps {
  icon: IoniconProps['name'];
  label: string;
  onPress: () => void;
  testID?: string;
  size?: number;
}
