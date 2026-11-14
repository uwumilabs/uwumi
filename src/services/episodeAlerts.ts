import { useEffect } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ensureNotificationPermission } from './notifications';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { infoTitle, type MediaItem } from '@/utils/media';
import { isTV } from '@/utils/tv';
import { MediaType } from '@/constants/types';
import { infoHref } from '@/utils/routes';
import { queryClient } from '@/constants/queryClient';
import { useFavoriteStore } from '@/hooks/stores/useFavoriteStore';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore';
import { type FavoriteSchedules, fetchFavoriteSchedules, scheduleOf } from '@/hooks/queries/favoriteQueries';

const CHANNEL_ID = 'new-episodes';
const ID_PREFIX = 'episode-';
// An episode further out is likely to move; a later sync schedules it once it's close
const LOOKAHEAD_MS = 14 * 24 * 60 * 60 * 1000;

interface EpisodeAlert {
  identifier: string;
  title: string;
  body: string;
  item: MediaItem;
  at: number;
}

const alertsFor = (favorites: MediaItem[], schedules: FavoriteSchedules, now: number) =>
  favorites.flatMap((item): EpisodeAlert[] => {
    const next = scheduleOf(item, schedules)?.next;
    if (!next || next.at <= now || next.at > now + LOOKAHEAD_MS) return [];
    return [
      {
        // The air time is part of the id, so a delayed episode is cancelled and scheduled again
        identifier: `${ID_PREFIX}${item.mediaType}-${item.id}-${next.season ?? ''}-${next.episode}-${next.at}`,
        title: infoTitle(item) || 'New episode',
        body: `${next.season ? `S${next.season}E${next.episode}` : `Episode ${next.episode}`} is out`,
        item,
        at: next.at,
      },
    ];
  });

/** What an alert carries: the info screen a favorite's card opens, so tapping it lands on the show */
type AlertData = { href: ReturnType<typeof infoHref> };

const alertData = (item: MediaItem): AlertData => ({
  href: infoHref({
    mediaType: item.mediaType as MediaType,
    id: String(item.id),
    type: item.type,
    image: item.image,
    title: infoTitle(item),
  }),
});

// The air time is the identifier's last part
const alertTime = (identifier: string) => Number(identifier.slice(identifier.lastIndexOf('-') + 1));

const scheduledAlertIds = async () =>
  (await Notifications.getAllScheduledNotificationsAsync())
    .map(({ identifier }) => identifier)
    .filter((identifier) => identifier.startsWith(ID_PREFIX));

const cancelAlerts = async (identifiers: string[]) =>
  Promise.all(identifiers.map((identifier) => Notifications.cancelScheduledNotificationAsync(identifier)));

/** Cancels the alerts no longer wanted and schedules the missing ones, so repeated syncs don't duplicate */
const syncAlerts = async () => {
  if (!usePreferencesStore.getState().episodeNotifications) return void (await cancelAlerts(await scheduledAlertIds()));
  const favorites = useFavoriteStore.getState().favorites;
  const schedules = await fetchFavoriteSchedules(queryClient, favorites);
  // Offline, or a show failed to load: keep what's scheduled rather than cancel alerts that are still right
  if (!schedules.loaded) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'New episodes',
      importance: AndroidImportance.DEFAULT,
    });
  }
  const now = Date.now();
  const alerts = alertsFor(favorites, schedules, now);
  // On by default, so the first alert worth sending is when we ask; a refusal turns the switch off to match
  if (alerts.length && (await ensureNotificationPermission()) !== 'granted') {
    return usePreferencesStore.getState().setEpisodeNotifications(false);
  }
  const wanted = new Set(alerts.map(({ identifier }) => identifier));
  const scheduled = await scheduledAlertIds();
  // An alert past its time is due and may just not be delivered yet (Android can hold an alarm); let it fire
  await cancelAlerts(scheduled.filter((identifier) => !wanted.has(identifier) && !(alertTime(identifier) <= now)));
  const existing = new Set(scheduled);
  for (const { identifier, title, body, item, at } of alerts) {
    if (existing.has(identifier)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body, data: alertData(item) },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL_ID },
    });
  }
};

// One sync at a time, so quick changes (two favorites in a row) don't race each other
let queue = Promise.resolve();
const syncEpisodeAlerts = () => {
  queue = queue.then(syncAlerts).catch((error) => console.warn('Episode alerts failed to sync:', error));
};
const syncIfEnabled = () => {
  if (usePreferencesStore.getState().episodeNotifications) syncEpisodeAlerts();
};

let started = false;

/**
 * "New episode notifications": a local notification for each favorite's next episode at its air time (AniList's
 * exact time; TMDB's day at 18:00). Kept in step with the toggle and the favorites through their stores, and
 * re-synced when the app comes back to the foreground, so no React effect drives it. Android TV shows no such
 * notifications, so it stays off there.
 */
export const startEpisodeAlerts = () => {
  if (started || isTV) return;
  started = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  usePreferencesStore.subscribe((state, previous) => {
    if (state.episodeNotifications !== previous.episodeNotifications) syncEpisodeAlerts();
  });
  useFavoriteStore.subscribe((state, previous) => {
    if (state.favorites !== previous.favorites) syncIfEnabled();
  });
  AppState.addEventListener('change', (status) => {
    if (status === 'active') syncIfEnabled();
  });
  syncIfEnabled();
};

/** The "New episode notifications" switch: turning it on asks for the permission, or opens settings once it's blocked */
export const setEpisodeAlerts = async (on: boolean) => {
  if (!on) return usePreferencesStore.getState().setEpisodeNotifications(false);
  const permission = await ensureNotificationPermission();
  if (permission === 'granted') usePreferencesStore.getState().setEpisodeNotifications(true);
  // Android stops showing the prompt after two refusals; only system settings can grant it then
  else if (permission === 'blocked') void Linking.openSettings();
};

// The last response outlives a remount of the layout, which would open the show a second time
let handledResponse: string | undefined;

/** Opens the show a tapped alert is for, including when the tap launched the app; needs the mounted router */
export const useEpisodeAlertTaps = () => {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const href = (response?.notification.request.content.data as Partial<AlertData> | undefined)?.href;
    const key = response ? `${response.notification.request.identifier}:${response.notification.date}` : undefined;
    if (!href || key === handledResponse) return;
    handledResponse = key;
    router.push(href);
  }, [response, router]);
};
