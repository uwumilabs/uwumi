import React, { createContext, useCallback, useContext, useState } from 'react';
import { ChoiceDialog, choiceLabel, type ChoiceOption } from './ChoiceDialog';
import { List as NativeList, type ListItemProps } from './native/list/List';

interface Choice<T> {
  title: string;
  options: ChoiceOption<T>[];
  value: T;
  // Method syntax, so a row's Choice<T> can open as a Choice<unknown>
  onChange(value: T): void;
}

const OpenChoiceContext = createContext<((choice: Choice<unknown>) => void) | null>(null);

/**
 * The dialog for the `ChoiceRow`s inside it. The rows sit in a native list's host, which can't hold the dialog's
 * views, so it renders here, beside the screen's content.
 */
export const ChoiceRowHost = ({ children }: { children: React.ReactNode }) => {
  const [choice, setChoice] = useState<Choice<unknown> | null>(null);
  const [open, setOpen] = useState(false);
  const openChoice = useCallback((next: Choice<unknown>) => {
    setChoice(next);
    setOpen(true);
  }, []);
  return (
    <OpenChoiceContext.Provider value={openChoice}>
      {children}
      {choice && <ChoiceDialog open={open} onOpenChange={setOpen} {...choice} />}
    </OpenChoiceContext.Provider>
  );
};

export interface ChoiceRowProps<T> extends Choice<T>, Pick<ListItemProps, 'testID' | 'disabled' | 'info'> {
  /** In place of the picked option's label */
  description?: string;
}

/** Aniyomi's list setting: a `NativeList.Item` showing the picked option, which opens a ChoiceDialog to change it */
export const ChoiceRow = <T,>({ title, options, value, onChange, description, ...item }: ChoiceRowProps<T>) => {
  const openChoice = useContext(OpenChoiceContext);
  if (!openChoice) throw new Error('ChoiceRow needs a ChoiceRowHost around it');
  return (
    <NativeList.Item
      {...item}
      title={title}
      description={description ?? choiceLabel(options, value)}
      onPress={() => openChoice({ title, options, value, onChange })}
    />
  );
};
