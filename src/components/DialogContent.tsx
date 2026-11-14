import React from 'react';
import { TVFocusGuideView } from 'react-native';
import { Dialog } from './heroui';
import { isTV } from '@/utils/tv';

/**
 * A dialog's panel. On TV it holds the D-pad inside: heroui's dialog sits in a portal over the screen, and the focus
 * engine would otherwise move on to the controls behind it
 */
export const DialogContent = ({ children, ...props }: React.ComponentProps<typeof Dialog.Content>) => (
  <Dialog.Content {...props}>
    {isTV ? (
      <TVFocusGuideView autoFocus trapFocusUp trapFocusDown trapFocusLeft trapFocusRight>
        {children}
      </TVFocusGuideView>
    ) : (
      children
    )}
  </Dialog.Content>
);
