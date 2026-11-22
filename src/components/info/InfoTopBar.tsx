import React from 'react';
import type { PageScroll } from './pageScroll';

export interface InfoTopBarProps {
  scroll: PageScroll;
  children: React.ReactNode;
}

export const InfoTopBar = ({ children }: InfoTopBarProps) => <>{children}</>;
