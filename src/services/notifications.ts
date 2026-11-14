import * as Notifications from 'expo-notifications';

/**
 * The notification permission, which downloads (their progress) and episode alerts need. Asks only while the system
 * still shows the prompt: "blocked" once it won't, which only system settings can change
 */
export const ensureNotificationPermission = async (): Promise<'granted' | 'denied' | 'blocked'> => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'blocked';
  return (await Notifications.requestPermissionsAsync()).granted ? 'granted' : 'denied';
};
