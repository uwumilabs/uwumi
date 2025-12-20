/* eslint-disable react/display-name */
import React, { memo, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { Tabs } from 'heroui-native';
import CardList from '@/components/CardList';
import { ChartNoAxesCombined, Heart, Search } from 'lucide-react-native';
import { useCurrentTheme, useTabsStore } from '@/hooks';
import { IconTitle, HUYStack } from '@/components/ui-primitives';
import SearchBar from '@/components/SearchBar';
import { MediaFeedType, MediaType } from '@/constants/types';

interface MediaBrowserProps {
  mediaType: MediaType;
}

export const MediaBrowser: React.FC<MediaBrowserProps> = ({ mediaType }) => {
  const TABS = useMemo(
    () =>
      [
        { id: 'tab1', icon: ChartNoAxesCombined, text: 'Trending', mediaFeedType: 'trending' },
        (mediaType === MediaType.ANIME || mediaType === MediaType.MANGA) && {
          id: 'tab2',
          icon: Heart,
          text: 'Popular',
          mediaFeedType: 'popular',
        },
        { id: 'tab3', icon: Search, text: 'Search', mediaFeedType: 'search' },
      ].filter(
        (tab): tab is { id: string; icon: typeof ChartNoAxesCombined; text: string; mediaFeedType: MediaFeedType } =>
          Boolean(tab),
      ),
    [mediaType],
  );
  const currentTab = useTabsStore((state) => state.currentTab);
  const setCurrentTab = useTabsStore((state) => state.setCurrentTab);
  const currentTheme = useCurrentTheme();

  const handleTabChange = useCallback(
    (value: string) => {
      setCurrentTab(value);
    },
    [setCurrentTab],
  );

  const metaProvider = useMemo(
    () => (mediaType === MediaType.ANIME ? 'anilist' : mediaType === MediaType.MANGA ? 'anilist-manga' : 'tmdb'),
    [mediaType],
  );

  const TabList = useMemo(() => {
    return (
      <Tabs.List className="justify-center mx-auto">
        <Tabs.Indicator />
        {TABS.map(({ id, icon, text }) => {
          return (
            <Tabs.Trigger key={id} value={id}>
              <IconTitle icon={icon} text={text} />
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
    );
  }, [currentTab, currentTheme, TABS]);

  const tabsContent = useMemo(
    () =>
      TABS.map(({ id, mediaFeedType }) => (
        <Tabs.Content value={id} key={id}>
          <View className="h-full">
            <CardList mediaFeedType={mediaFeedType} mediaType={mediaType} metaProvider={metaProvider} />
          </View>
        </Tabs.Content>
      )),
    [TABS, mediaType, metaProvider],
  );

  return (
    <HUYStack className="gap-2">
      <SearchBar />
      <Tabs value={currentTab} onValueChange={handleTabChange} variant="pill">
        {TabList}
        {tabsContent}
      </Tabs>
    </HUYStack>
  );
};

export default memo(MediaBrowser);
