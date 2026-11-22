import React from 'react';
import { Host, VStack } from '@expo/ui/swift-ui';
import { background, frame, shapes } from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { listItems, RADIUS, withDividers } from './card';

// ignoreSafeArea: in a ScrollView under the status bar, SwiftUI would push the rows down by the inset
export const NativeCard = ({ children }: { children: React.ReactNode }) => {
  const { surface } = useCurrentTheme();
  const items = listItems(children);
  if (items.length === 0) return null;
  return (
    <Host matchContents={{ vertical: true }} ignoreSafeArea="container" style={{ width: '100%' }}>
      <VStack
        spacing={0}
        modifiers={[
          frame({ maxWidth: Infinity }),
          background(surface, shapes.roundedRectangle({ cornerRadius: RADIUS })),
        ]}>
        {withDividers(items)}
      </VStack>
    </Host>
  );
};
