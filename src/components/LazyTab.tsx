import React, { useState, type ReactNode } from 'react';
import { useIsFocused } from 'expo-router';

/** NativeTabs mounts every tab at launch, so a tab's content renders the first time it's opened and stays after. */
export const LazyTab = ({ children }: { children: ReactNode }) => {
  const focused = useIsFocused();
  const [opened, setOpened] = useState(focused);
  if (focused && !opened) setOpened(true);

  return opened ? <>{children}</> : null;
};

export default LazyTab;
