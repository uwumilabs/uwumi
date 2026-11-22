// Shared by List.android/ios; it can't live in List.tsx, which those files would resolve back to themselves
import React from 'react';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import type { IoniconProps } from '../../Icons';

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

/** Whether the enclosing list is `flat`, for items to pick their icon colour */
export const FlatListContext = React.createContext(false);

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
