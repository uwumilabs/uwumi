import type React from 'react';
import { requireNativeView, requireOptionalNativeModule } from 'expo';

/** SheetWidthModule.swift beside this file. Missing on Android and from iOS builds made before it. */
const available = requireOptionalNativeModule('SheetWidthModule') != null;

/** Placed in a sheet's content, caps the sheet's width on an iPhone in landscape, where it would span the screen */
export const SheetWidthLimit: React.ComponentType<{ maxWidth: number }> = available
  ? requireNativeView('SheetWidthModule')
  : () => null;
