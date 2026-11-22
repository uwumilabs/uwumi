import React from 'react';
import { Card, Column, Host } from '@expo/ui/jetpack-compose';
import { clip, fillMaxWidth, Shapes } from '@expo/ui/jetpack-compose/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { listItems, RADIUS, withDividers } from './card';

export const NativeCard = ({ children }: { children: React.ReactNode }) => {
  const { surface } = useCurrentTheme();
  const items = listItems(children);
  if (items.length === 0) return null;
  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <Card colors={{ containerColor: surface }} modifiers={[fillMaxWidth(), clip(Shapes.RoundedCorner(RADIUS))]}>
        <Column modifiers={[fillMaxWidth()]}>{withDividers(items)}</Column>
      </Card>
    </Host>
  );
};
