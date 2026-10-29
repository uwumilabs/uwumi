import { useEffect } from 'react';
import { type Href, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

// The last response outlives a remount of the layout, which would open the show a second time
let handledResponse: string | undefined;

/** Opens the show an episode alert is for, including when the tap launched the app; needs the mounted router */
export const useEpisodeAlertTaps = () => {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const href = response?.notification.request.content.data?.href;
    const key = response ? `${response.notification.request.identifier}:${response.notification.date}` : undefined;
    if (!href || key === handledResponse) return;
    handledResponse = key;
    router.push(href as Href);
  }, [response, router]);
};
