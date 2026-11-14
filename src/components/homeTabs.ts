import type { ImageSourcePropType } from 'react-native';

/** The home tabs, for the phone tab bar and the TV rail */
export const TABS: {
  name: string;
  href: '/' | '/manga' | '/movies' | '/more';
  label: string;
  icon: ImageSourcePropType;
  testID: string;
}[] = [
  { name: 'index', href: '/', label: 'Anime', icon: require('../../assets/images/anime.png'), testID: 'tab-anime' },
  {
    name: 'manga',
    href: '/manga',
    label: 'Manga',
    icon: require('../../assets/images/manga.png'),
    testID: 'tab-manga',
  },
  {
    name: 'movies',
    href: '/movies',
    label: 'Movies',
    icon: require('../../assets/images/movies.png'),
    testID: 'tab-movies',
  },
  { name: 'more', href: '/more', label: 'More', icon: require('../../assets/images/more.png'), testID: 'tab-more' },
];
