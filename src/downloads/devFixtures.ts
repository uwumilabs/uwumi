// Development only: fake downloads in every state, for working on the Downloads screen without downloading anything.
// Only ever required behind __DEV__, so release bundles leave this file out.
import { MediaFormat, TvType } from 'react-native-consumet';
import { MediaType } from '@/constants/types';
import type { EpisodeDownload } from './model';
import { useDownloadStore } from './useDownloadStore';

const FAKE_ID_PREFIX = 'fake-';
const FAKE_URL = 'https://example.invalid/fake.m3u8';
const GB = 1024 ** 3;
const MB = 1024 ** 2;

const fakeDownloads = (now: number): EpisodeDownload[] => [
  {
    id: `${FAKE_ID_PREFIX}film-anime`,
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/142770-YgESt2HJXlNg.jpg',
    url: FAKE_URL,
    name: 'Complete Movie',
    showName: 'Suzume no Tojimari',
    mediaType: MediaType.ANIME,
    watchParams: {
      mediaType: MediaType.ANIME,
      id: '142770',
      type: MediaFormat.MOVIE,
      provider: 'anikoto',
      uniqueId: 'fake$ep=1',
    },
    episode: 1,
    status: 'completed',
    fileSize: 1.4 * GB,
    createdAt: now - 3 * 86400000,
    completedAt: now - 3 * 86400000 + 600000,
  },
  {
    id: `${FAKE_ID_PREFIX}film-tmdb`,
    image: 'https://image.tmdb.org/t/p/w342/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    url: FAKE_URL,
    name: 'Inception',
    showName: 'Inception',
    mediaType: MediaType.MOVIE,
    watchParams: {
      mediaType: MediaType.MOVIE,
      id: '27205',
      type: TvType.MOVIE,
      provider: 'vegamovies',
      uniqueId: 'fake-27205',
    },
    episode: 1,
    status: 'completed',
    fileSize: 2.1 * GB,
    createdAt: now - 86400000,
    completedAt: now - 86400000 + 900000,
  },
  {
    id: `${FAKE_ID_PREFIX}episode-completed`,
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg',
    url: FAKE_URL,
    name: 'The Journey’s End',
    showName: 'Frieren: Beyond Journey’s End',
    mediaType: MediaType.ANIME,
    watchParams: {
      mediaType: MediaType.ANIME,
      id: '154587',
      type: MediaFormat.TV,
      provider: 'anikoto',
      uniqueId: 'fake$ep=1',
    },
    episode: 1,
    status: 'completed',
    fileSize: 312 * MB,
    createdAt: now - 7200000,
    completedAt: now - 6900000,
  },
  {
    id: `${FAKE_ID_PREFIX}episode-downloading`,
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg',
    url: FAKE_URL,
    name: 'It Didn’t Have to Be Magic…',
    showName: 'Frieren: Beyond Journey’s End',
    episode: 2,
    status: 'downloading',
    sessionId: 1,
    progress: { percentage: 42.5, currentTime: 612, totalDuration: 1440, speed: 3.2, bitrate: 2500000, size: 191 * MB },
    createdAt: now - 120000,
  },
  {
    id: `${FAKE_ID_PREFIX}episode-preparing`,
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg',
    url: FAKE_URL,
    name: 'Killing Magic',
    showName: 'Frieren: Beyond Journey’s End',
    episode: 3,
    status: 'downloading',
    createdAt: now - 30000,
  },
  {
    id: `${FAKE_ID_PREFIX}episode-pending`,
    image: 'https://image.tmdb.org/t/p/w342/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    url: FAKE_URL,
    name: 'Breakage',
    showName: 'Breaking Bad',
    mediaType: MediaType.MOVIE,
    episode: 5,
    season: 2,
    status: 'pending',
    createdAt: now - 10000,
  },
  {
    id: `${FAKE_ID_PREFIX}episode-failed`,
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg',
    url: FAKE_URL,
    name: 'Ryomen Sukuna',
    showName: 'Jujutsu Kaisen',
    episode: 1,
    status: 'failed',
    error: 'Try another server: this one sends pictures instead of video',
    createdAt: now - 5400000,
  },
  {
    id: `${FAKE_ID_PREFIX}episode-cancelled`,
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg',
    url: FAKE_URL,
    name: 'For Myself',
    showName: 'Jujutsu Kaisen',
    episode: 2,
    status: 'cancelled',
    createdAt: now - 5000000,
  },
  {
    id: `${FAKE_ID_PREFIX}long-titles`,
    image: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/156822-y0wPQIl3AHDA.jpg',
    url: FAKE_URL,
    name: 'An Episode Title Long Enough That It Has to Be Cut Off Somewhere on Every Phone',
    showName: 'That Time I Got Reincarnated as a Slime With a Show Name That Never Seems to End',
    episode: 124,
    season: 3,
    status: 'completed',
    fileSize: 988 * MB,
    createdAt: now - 600000,
    completedAt: now - 300000,
  },
];

/** Adds the fake downloads, replacing earlier copies of them */
export const addFakeDownloads = () => {
  const fakes = Object.fromEntries(fakeDownloads(Date.now()).map((download) => [download.id, download]));
  useDownloadStore.setState((state) => ({ downloads: { ...state.downloads, ...fakes } }));
};

/** Removes the fake downloads and nothing else */
export const removeFakeDownloads = () =>
  useDownloadStore.setState((state) => ({
    downloads: Object.fromEntries(Object.entries(state.downloads).filter(([id]) => !id.startsWith(FAKE_ID_PREFIX))),
  }));
