import type React from 'react';
import { Platform } from 'react-native';
import { requireNativeView, requireOptionalNativeModule } from 'expo';

/** SheetWidthModule.swift beside this file, iOS only. Missing from builds made before it, where it draws nothing. */
const available = Platform.OS === 'ios' && requireOptionalNativeModule('SheetWidthModule') != null;

/** Placed in a sheet's content, caps the sheet's width on an iPhone in landscape, where it would span the screen */
export const SheetWidthLimit: React.ComponentType<{ maxWidth: number }> = available
  ? requireNativeView('SheetWidthModule')
  : () => null;
