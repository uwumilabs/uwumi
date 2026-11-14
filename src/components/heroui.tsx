// heroui-native's root entry re-exports every component, so importing from it bundles and loads all of them.
// The app imports heroui from here instead, and this pulls in only the per-component entries it uses.
import React from 'react';
import { Chip as HeroChip } from 'heroui-native/chip';
import { isTV } from '@/utils/tv';
export { Avatar } from 'heroui-native/avatar';
export { Button } from 'heroui-native/button';
export { Card } from 'heroui-native/card';
export { Checkbox } from 'heroui-native/checkbox';
export { Dialog } from 'heroui-native/dialog';
export { useThemeColor } from 'heroui-native/hooks';
export { PressableFeedback, type PressableFeedbackProps } from 'heroui-native/pressable-feedback';
export { Portal } from 'heroui-native/portal';
export { HeroUINativeProvider } from 'heroui-native/provider';
export { Input } from 'heroui-native/input';
export { ScrollShadow } from 'heroui-native/scroll-shadow';
export { SearchField } from 'heroui-native/search-field';
export { SkeletonGroup } from 'heroui-native/skeleton-group';
export { Tabs } from 'heroui-native/tabs';
export { Toast, useToast, type ToastComponentProps } from 'heroui-native/toast';
export { cn } from 'heroui-native/utils';

// uwumi's chips are labels; heroui makes them pressable, which would put every one in the TV D-pad's path
const LabelChip = (props: React.ComponentProps<typeof HeroChip>) => (
  <HeroChip focusable={isTV ? false : undefined} {...props} />
);
export const Chip = Object.assign(LabelChip, HeroChip) as typeof HeroChip;
