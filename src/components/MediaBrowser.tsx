/* eslint-disable react/display-name */
import React, { memo } from 'react';
import { YStack, Tabs, View } from 'tamagui';
import CardList from '@/components/CardList';
import { ChartNoAxesCombined, Heart, Search } from '@tamagui/lucide-icons';
import { useCurrentTheme, useTabsStore } from '@/hooks';
import IconTitle from '@/components/IconTitle';
import SearchBar from '@/components/SearchBar';
import { MediaFeedType, MediaType } from '@/constants/types';

interface MediaBrowserProps {
  mediaType: MediaType;
}

const TabTextStyle = {
  fontSize: 13,
  fontWeight: '600',
  // color: '$color2',
};

const TabIconStyle = {
  size: 15,
  // color: '$color2',
};

const MediaBrowser: React.FC<MediaBrowserProps> = ({ mediaType }) => {
  const TABS = [
    { id: 'tab1', icon: ChartNoAxesCombined, text: 'Trending', mediaFeedType: 'trending' },
    (mediaType === MediaType.ANIME || mediaType === MediaType.MANGA) && {
      id: 'tab2',
      icon: Heart,
      text: 'Popular',
      mediaFeedType: 'popular',
    },
    { id: 'tab3', icon: Search, text: 'Search', mediaFeedType: 'search' },
  ].filter((tab): tab is { id: string; icon: typeof ChartNoAxesCombined; text: string; mediaFeedType: MediaFeedType } =>
    Boolean(tab),
  );
  const currentTab = useTabsStore((state) => state.currentTab);
  const setCurrentTab = useTabsStore((state) => state.setCurrentTab);
  const currentTheme = useCurrentTheme();
  const TabList = memo(() => {
    return (
      <Tabs.List disablePassBorderRadius width="65%" marginVertical="$2" marginHorizontal="$4" gap="$2">
        {TABS.map(({ id, icon, text }, index) => {
          const isActive = currentTab === id;
          const bgColor = isActive ? currentTheme?.color4 : 'transparent';

          return (
            <Tabs.Tab
              key={id}
              flex={1}
              value={id}
              height={35}
              padding={0}
              borderWidth={2}
              borderColor={isActive ? '$color4' : '$color1'}
              style={{
                backgroundColor: bgColor,
              }}>
              <IconTitle icon={icon} text={text} iconProps={TabIconStyle} textProps={TabTextStyle} />
            </Tabs.Tab>
          );
        })}
      </Tabs.List>
    );
  });
  const metaProvider =
    mediaType === MediaType.ANIME ? 'anilist' : mediaType === MediaType.MANGA ? 'anilist-manga' : 'tmdb';

  return (
    <YStack gap="$2">
      <SearchBar />
      <Tabs
        defaultValue="tab1"
        orientation="horizontal"
        flexDirection="column"
        width="100%"
        value={currentTab}
        onValueChange={(value) => setCurrentTab(value)}>
        <TabList />
        {TABS.map(({ id, mediaFeedType }) => (
          <Tabs.Content value={id} key={id}>
            <View height="100%">
              <CardList mediaFeedType={mediaFeedType} mediaType={mediaType} metaProvider={metaProvider} />
            </View>
          </Tabs.Content>
        ))}
      </Tabs>
    </YStack>
  );
};

export default memo(MediaBrowser);
