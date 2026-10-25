// Shared by List.android/ios; it can't live in List.tsx, which those files would resolve back to themselves
import React from 'react';
import type { IoniconProps } from '../../Icons';

export interface ListItemProps {
  title: string;
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
}

export interface ListProps {
  /** `List.Item`s; null/false entries and fragments are fine */
  children: React.ReactNode;
}

/** The `List.Item` elements among children, with fragments unwrapped, so the list can put dividers between them */
export const listItems = (children: React.ReactNode): React.ReactElement<ListItemProps>[] =>
  React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) return [];
    if (child.type === React.Fragment) return listItems((child.props as { children?: React.ReactNode }).children);
    return [child as React.ReactElement<ListItemProps>];
  });
