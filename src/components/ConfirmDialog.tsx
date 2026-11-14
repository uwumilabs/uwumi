import React from 'react';
import { DialogContent } from './DialogContent';
import { Dialog } from './heroui';
import { Button } from './Button';
import { HUXStack, HUYStack } from './ui-primitives';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  testID: string;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  testID,
}: ConfirmDialogProps) => (
  <Dialog isOpen={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="bg-black/50" />
      <DialogContent className="rounded-3xl bg-background p-4" testID={testID}>
        <Dialog.Close className="absolute right-3 top-3" accessibilityLabel="Close" />
        <HUYStack className="gap-3">
          <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
          <Dialog.Description className="text-base text-foreground/80">{description}</Dialog.Description>
          <HUXStack className="flex-row justify-end gap-3">
            <Button
              testID={`${testID}-cancel`}
              onPress={() => onOpenChange(false)}
              // The safe choice gets the D-pad first
              hasTVPreferredFocus
              variant="ghost"
              isIconOnly={false}
              className="min-w-25">
              {cancelText}
            </Button>
            <Button testID={`${testID}-confirm`} onPress={onConfirm} className="min-w-25" variant="danger">
              {confirmText}
            </Button>
          </HUXStack>
        </HUYStack>
      </DialogContent>
    </Dialog.Portal>
  </Dialog>
);
