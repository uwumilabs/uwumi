import type React from 'react';
import type { ListItemProps, ListProps } from './shared';

export type { ListItemProps, ListProps } from './shared';

const ListItem: React.FC<ListItemProps> = () => null;
export const List = Object.assign((() => null) as React.FC<ListProps>, { Item: ListItem });
