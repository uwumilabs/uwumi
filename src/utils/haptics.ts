import * as Haptics from 'expo-haptics';
import { isTV } from './tv';

// TV remotes can't vibrate
const unlessTV = (feedback: () => Promise<void>) => () => {
  if (!isTV) void feedback().catch(() => {});
};

export const haptics = {
  light: unlessTV(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: unlessTV(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: unlessTV(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  selection: unlessTV(() => Haptics.selectionAsync()),
};
