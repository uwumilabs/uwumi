import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { IAnimeResult, IMovieResult } from 'react-native-consumet';
import { infoTitle, isTV } from '@/constants/utils';
import { MediaType } from '@/constants/types';
import { resolveProvider, useProviderStore } from '@/constants/provider';
import { queryClient } from '@/constants/queryClient';
import { useFavoriteStore, usePreferencesStore } from '@/hooks/stores';
import { type FavoriteSchedules, fetchFavoriteSchedules, scheduleOf } from '@/hooks/queries';

type Favorite = IAnimeResult | IMovieResult;

const CHANNEL_ID = 'new-episodes';
const ID_PREFIX = 'episode-';
// An episode further out is likely to move; a later sync schedules it once it's close
const LOOKAHEAD_MS = 14 * 24 * 60 * 60 * 1000;

interface EpisodeAlert {
  identifier: string;
  title: string;
  body: string;
  item: Favorite;
  at: number;
}

const alertsFor = (favorites: Favorite[], schedules: FavoriteSchedules, now: number) =>
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

/** The info screen a favorite's card opens, so tapping the alert lands on the show */
const infoHref = (item: Favorite) => {
  const mediaType = item.mediaType as MediaType;
  return {
    pathname: '/info/[mediaType]',
    params: {
      mediaType,
      metaProvider: item.metaProvider,
      type: item.type,
      provider: resolveProvider(mediaType, useProviderStore.getState().providers[mediaType]),
      id: String(item.id),
      image: item.image,
      title: infoTitle(item),
    },
  };
};

const scheduledAlertIds = async () =>
  (await Notifications.getAllScheduledNotificationsAsync())
    .map(({ identifier }) => identifier)
    .filter((identifier) => identifier.startsWith(ID_PREFIX));

const cancelAlerts = async (identifiers: string[]) =>
  Promise.all(identifiers.map((identifier) => Notifications.cancelScheduledNotificationAsync(identifier)));

/** Notification permission, asking only while the system still shows the prompt ("blocked" once it won't) */
export const ensureAlertPermission = async (): Promise<'granted' | 'denied' | 'blocked'> => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'blocked';
  return (await Notifications.requestPermissionsAsync()).granted ? 'granted' : 'denied';
};

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
  const alerts = alertsFor(favorites, schedules, Date.now());
  // On by default, so the first alert worth sending is when we ask; a refusal turns the switch off to match
  if (alerts.length && (await ensureAlertPermission()) !== 'granted') {
    return usePreferencesStore.getState().setEpisodeNotifications(false);
  }
  const wanted = new Set(alerts.map(({ identifier }) => identifier));
  const scheduled = await scheduledAlertIds();
  await cancelAlerts(scheduled.filter((identifier) => !wanted.has(identifier)));
  const existing = new Set(scheduled);
  for (const { identifier, title, body, item, at } of alerts) {
    if (existing.has(identifier)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body, data: { href: infoHref(item) } },
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
