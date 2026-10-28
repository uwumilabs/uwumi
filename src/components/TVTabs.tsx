import React, { useEffect, useRef, useState } from 'react';
import { Image, type ImageSourcePropType, Pressable, Text, TVFocusGuideView, View } from 'react-native';
import { Tabs, TabList, TabSlot, TabTrigger, useTabTrigger } from 'expo-router/ui';
import { useIsFocused } from 'expo-router';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useBackHandler, useCurrentTheme, usePureBlackBackground } from '@/hooks';
import { hexToRGB } from '@/constants/utils';
import { TVRailContext } from './TVRow';

const COLLAPSED_WIDTH = 88;
const EXPANDED_WIDTH = 232;

const TABS: { name: string; href: '/' | '/manga' | '/movies' | '/more'; label: string; icon: ImageSourcePropType }[] = [
  { name: 'index', href: '/', label: 'Anime', icon: require('../../assets/images/anime.png') },
  { name: 'manga', href: '/manga', label: 'Manga', icon: require('../../assets/images/manga.png') },
  { name: 'movies', href: '/movies', label: 'Movies', icon: require('../../assets/images/movies.png') },
  { name: 'more', href: '/more', label: 'More', icon: require('../../assets/images/more.png') },
];
const HOME_TAB = TABS[0].name;

// react-native-tvos adds requestTVFocus to views; its types don't list it
type FocusableView = { requestTVFocus?: () => void };
type PressableElement = React.ComponentRef<typeof Pressable>;

interface RailItemProps {
  label: string;
  icon: ImageSourcePropType;
  expanded: boolean;
  itemRef: (view: PressableElement | null) => void;
  /** From TabTrigger: whether this is the current tab */
  isFocused?: boolean;
  onPress?: () => void;
}

const RailItem = ({ label, icon, expanded, itemRef, isFocused: selected, onPress }: RailItemProps) => {
  const theme = useCurrentTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      ref={itemRef}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        height: 56,
        paddingHorizontal: 18,
        borderRadius: 28,
        // The current tab keeps its indicator; focus adds the soft fill native lists use
        backgroundColor: selected ? theme.default : focused ? hexToRGB(theme.foreground, 0.14) : 'transparent',
        borderWidth: 2,
        borderColor: focused ? theme.foreground : 'transparent',
      }}>
      <Image source={icon} style={{ width: 28, height: 28, tintColor: theme.foreground }} />
      {expanded && (
        <Text numberOfLines={1} style={{ color: theme.foreground, fontSize: 16, fontWeight: '700' }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};

/**
 * Back from a tab's content goes to the rail; Back on the rail goes to Anime, then leaves the app, as the big TV
 * apps do. Inside Tabs, so it can switch tabs.
 */
const RailBackHandler = ({ railFocused, focusTab }: { railFocused: boolean; focusTab: (name: string) => void }) => {
  const screenFocused = useIsFocused();
  const { switchTab, getTrigger } = useTabTrigger({ name: HOME_TAB });
  useBackHandler(screenFocused, () => {
    const current = TABS.find(({ name }) => getTrigger(name)?.isFocused)?.name ?? HOME_TAB;
    if (!railFocused) {
      focusTab(current);
      return true;
    }
    if (current !== HOME_TAB) {
      switchTab(HOME_TAB, {});
      focusTab(HOME_TAB);
      return true;
    }
    return false;
  });
  return null;
};

/**
 * Android TV's tabs: a rail on the left, icons only, that widens to show labels while it has focus. Entering it
 * lands on the current tab, and OK switches tabs (moving through it doesn't). Phones keep NativeTabs.
 */
export const TVTabs = () => {
  const theme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const [expanded, setExpanded] = useState(false);
  const itemRefs = useRef<Record<string, PressableElement | null>>({});
  const [destination, setDestination] = useState<PressableElement | null>(null);

  const railStyle = useAnimatedStyle(() => ({
    width: withTiming(expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH, { duration: 180 }),
  }));

  return (
    <TVRailContext.Provider value>
      <Tabs>
        {/* The routes; the rail below draws its own triggers */}
        <TabList style={{ display: 'none' }}>
          {TABS.map(({ name, href }) => (
            <TabTrigger key={name} name={name} href={href} />
          ))}
        </TabList>
        <View style={{ flex: 1, marginLeft: COLLAPSED_WIDTH }}>
          <TabSlot />
        </View>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              overflow: 'hidden',
              backgroundColor: pureBlackBackground ? theme.amoledSurfaceVariant : theme.segment,
            },
            railStyle,
          ]}>
          <TVFocusGuideView
            destinations={destination ? [destination] : undefined}
            onFocusEnter={() => setExpanded(true)}
            onFocusLeave={() => setExpanded(false)}
            style={{ flex: 1, justifyContent: 'center', gap: 8, paddingHorizontal: 12 }}>
            {TABS.map(({ name, label, icon }) => (
              <TabTrigger key={name} name={name} asChild>
                <RailItem
                  label={label}
                  icon={icon}
                  expanded={expanded}
                  itemRef={(view) => {
                    itemRefs.current[name] = view;
                  }}
                />
              </TabTrigger>
            ))}
          </TVFocusGuideView>
        </Animated.View>
        <RailDestination onCurrent={(name) => setDestination(itemRefs.current[name] ?? null)} />
        <RailBackHandler
          railFocused={expanded}
          focusTab={(name) => (itemRefs.current[name] as FocusableView | null)?.requestTVFocus?.()}
        />
      </Tabs>
    </TVRailContext.Provider>
  );
};

/** Reports the current tab, for the rail's focus guide to point at, so Left from anywhere lands on it */
const RailDestination = ({ onCurrent }: { onCurrent: (name: string) => void }) => {
  const { getTrigger } = useTabTrigger({ name: HOME_TAB });
  const current = TABS.find(({ name }) => getTrigger(name)?.isFocused)?.name ?? HOME_TAB;
  useEffect(() => onCurrent(current), [current, onCurrent]);
  return null;
};

export default TVTabs;
