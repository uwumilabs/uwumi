import type React from 'react';
import type { ListItemProps, ListProps } from './shared';

export type { ListItemProps, ListProps } from './shared';

// Platforms other than Android and iOS have no native list
const ListItem: React.FC<ListItemProps> = () => null;
export const List = Object.assign((() => null) as React.FC<ListProps>, { Item: ListItem });

export default List;
