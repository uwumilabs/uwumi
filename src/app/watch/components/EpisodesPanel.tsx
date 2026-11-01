import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TVFocusGuideView, useWindowDimensions, View } from 'react-native';
import type { FlashListRef } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import { cn } from '@/components/heroui';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useControlsVisibility } from 'react-native-video-toolkit';
import ProviderSelection from './ProviderSelection';
import { isTV } from '@/constants/utils';
import type { MediaType } from '@/constants/types';
import { useEpisodeList, useEpisodesIdStore, useListJump, type EpisodeItem } from '@/hooks';
import { HUXStack, Image, List, Select, LinearGradient, TVFocusWrapper, WavyAnimation } from '@/components';
import { ThumbnailProgress } from '@/components/episode-list/EpisodeList';

const CARD_WIDTH = 200;
const THUMBNAIL_HEIGHT = (CARD_WIDTH * 9) / 16;
const CARD_GAP = 10;
const TITLE_HEIGHT = 44;

const TV_THUMBNAIL_WIDTH = 144;
const TV_THUMBNAIL_HEIGHT = (TV_THUMBNAIL_WIDTH * 9) / 16;
const TV_PANEL_EDGE = 48;
const TV_PANEL_COLOR = 'rgba(0,0,0,0.92)';

const SLIDE = { duration: 240, easing: Easing.out(Easing.cubic) };
const CLOSE_DISTANCE_RATIO = 0.3;
const CLOSE_VELOCITY = 800;
const tvPanelWidth = (width: number) => Math.min(560, Math.max(360, width * 0.42));

const episodeNumber = (episode: EpisodeItem, index: number) => String(episode.number ?? episode.episode ?? index + 1);

const EpisodeCard = memo(
  ({
    episode,
    index,
    isCurrent,
    onPress,
  }: {
    episode: EpisodeItem;
    index: number;
    isCurrent: boolean;
    onPress: (episode: EpisodeItem) => void;
  }) => {
    const image = typeof episode.image === 'string' ? episode.image : episode.image?.hd;
    return (
      <TVFocusWrapper
        onPress={() => onPress(episode)}
        focusScale={1.03}
        focusBorderRadius={12}
        style={{ width: CARD_WIDTH }}>
        <View
          className={cn('overflow-hidden rounded-xl bg-white/10', isCurrent && 'border-2 border-accent')}
          style={{ height: THUMBNAIL_HEIGHT }}>
          <Image source={image} style={{ width: '100%', height: '100%' }} />
          {isCurrent && <View className="absolute inset-0 bg-black/50" />}
          <Text className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-black text-accent">
            {`EP ${episodeNumber(episode, index)}`}
          </Text>
          {isCurrent ? (
            <View className="absolute bottom-2 right-2">
              <WavyAnimation />
            </View>
          ) : (
            <ThumbnailProgress uniqueId={episode.uniqueId as string} />
          )}
        </View>
        <Text className="mt-1.5 text-sm font-semibold text-white" numberOfLines={2}>
          {episode.title}
        </Text>
      </TVFocusWrapper>
    );
  },
);
EpisodeCard.displayName = 'EpisodeCard';

const EpisodeRow = memo(
  ({
    episode,
    index,
    isCurrent,
    preferFocus,
    onPress,
    onFocus,
  }: {
    episode: EpisodeItem;
    index: number;
    isCurrent: boolean;
    preferFocus: boolean;
    onPress: (episode: EpisodeItem) => void;
    onFocus: () => void;
  }) => {
    const image = typeof episode.image === 'string' ? episode.image : episode.image?.hd;
    const number = episodeNumber(episode, index);
    return (
      <TVFocusWrapper
        onPress={() => onPress(episode)}
        onFocus={onFocus}
        hasTVPreferredFocus={preferFocus}
        focusScale={1}
        focusBorderRadius={12}
        className={cn('flex-row items-center gap-3 rounded-[14px] p-1.5', isCurrent && 'bg-white/10')}>
        <View
          className="overflow-hidden rounded-xl bg-white/10"
          style={{ width: TV_THUMBNAIL_WIDTH, height: TV_THUMBNAIL_HEIGHT }}>
          <Image source={image} style={{ width: '100%', height: '100%' }} />
          {!isCurrent && <ThumbnailProgress uniqueId={episode.uniqueId as string} />}
        </View>
        <View className="flex-1 gap-1 pr-2">
          <Text className="text-xs font-black text-accent">{`EP ${number}`}</Text>
          <Text className="text-sm font-semibold text-white" numberOfLines={2}>
            {episode.title || `Episode ${number}`}
          </Text>
          {isCurrent && (
            <HUXStack className="items-center gap-2">
              <WavyAnimation />
              <Text className="text-xs text-white/70">Now playing</Text>
            </HUXStack>
          )}
        </View>
      </TVFocusWrapper>
    );
  },
);
EpisodeRow.displayName = 'EpisodeRow';

const EpisodesStrip = memo(
  ({ onSelect, onFocusInside }: { onSelect: (episode: EpisodeItem) => void; onFocusInside: () => void }) => {
    const { mediaType, isDubbed } = useLocalSearchParams<{ mediaType: MediaType; isDubbed?: string }>();
    const { episodes } = useEpisodeList();
    const currentUniqueId = useEpisodesIdStore((store) => store.currentUniqueId);
    const listRef = useRef<FlashListRef<EpisodeItem>>(null);
    // TV: the row the remote lands on as the panel opens. Cleared once focus is in, so a recycled row
    // showing the current episode again doesn't pull the focus back to it
    const [focusId, setFocusId] = useState(() => currentUniqueId ?? episodes[0]?.uniqueId);
    const rowFocused = useCallback(() => {
      setFocusId(undefined);
      onFocusInside();
    }, [onFocusInside]);

    const rangeLabel = useCallback(
      (start: number, end: number) =>
        `EP ${episodeNumber(episodes[start], start)}–${episodeNumber(episodes[end], end)}`,
      [episodes],
    );
    // Only the range parts: the scroll tracking is for vertical, Reanimated-wrapped lists
    const { listProps, ranges, rangeValue, jumpToRange } = useListJump({ items: episodes, listRef, rangeLabel });
    const currentIndex = episodes.findIndex((episode) => episode.uniqueId === currentUniqueId);

    const pickers = (
      <>
        <ProviderSelection mediaType={mediaType} isDubbed={isDubbed} />
        {ranges.length > 0 && (
          <Select size="sm" SelectItem={ranges} SelectLabel="Episodes" value={rangeValue} onValueChange={jumpToRange} />
        )}
      </>
    );

    return (
      <>
        {isTV ? (
          <View className="gap-3 px-5 pb-3">
            <Text className="text-xl font-bold text-white">Episodes</Text>
            <HUXStack className="flex-wrap items-center gap-2">{pickers}</HUXStack>
          </View>
        ) : (
          <HUXStack className="flex-1 justify-center items-center gap-2 px-4 pb-3">{pickers}</HUXStack>
        )}
        <View style={isTV ? styles.tvList : styles.list}>
          <List<EpisodeItem>
            ref={listRef}
            horizontal={!isTV}
            data={episodes}
            keyExtractor={(episode, index) => (episode.uniqueId as string) ?? `${episode.id}-${index}`}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollsToTop={false}
            // One card early, so the strip reads previous → current → next
            initialScrollIndex={currentIndex > 0 ? currentIndex - 1 : undefined}
            onViewableItemsChanged={listProps.onViewableItemsChanged}
            viewabilityConfig={listProps.viewabilityConfig}
            contentContainerStyle={isTV ? styles.tvListContent : styles.listContent}
            ItemSeparatorComponent={() => <View style={{ width: CARD_GAP, height: isTV ? 6 : CARD_GAP }} />}
            ListFooterComponent={null}
            renderItem={({ item, index }) =>
              isTV ? (
                <EpisodeRow
                  episode={item}
                  index={index}
                  isCurrent={item.uniqueId === currentUniqueId}
                  preferFocus={item.uniqueId === focusId}
                  onPress={onSelect}
                  onFocus={rowFocused}
                />
              ) : (
                <EpisodeCard
                  episode={item}
                  index={index}
                  isCurrent={item.uniqueId === currentUniqueId}
                  onPress={onSelect}
                />
              )
            }
          />
        </View>
      </>
    );
  },
);
EpisodesStrip.displayName = 'EpisodesStrip';

interface EpisodesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (episode: EpisodeItem) => void;
}

/**
 * YouTube-style "more episodes" strip over the player: a swipe up on the video opens it, a swipe down on the video
 * or on the strip closes it. On TV it's a side panel. Mounted only while shown.
 */
export const EpisodesPanel = ({ open, onOpenChange, onSelect }: EpisodesPanelProps) => {
  const { hideControls } = useControlsVisibility();
  const { width, height } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  // How far the panel travels to hide (on TV, with its faded edge), kept across opens; the window's size until it's laid out
  const size = useSharedValue(isTV ? tvPanelWidth(width) + TV_PANEL_EDGE : height);
  const shown = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (open) {
      // TV hides them once a row has focus (onFocusInside): hidden while a player button still has it,
      // the player would take the focus back
      if (!isTV) hideControls();
      drag.set(withTiming(0, SLIDE));
    }
    shown.set(
      withTiming(open ? 1 : 0, SLIDE, (finished) => {
        if (!finished || open) return;
        drag.set(0);
        scheduleOnRN(setMounted, false);
      }),
    );
  }, [open, hideControls, shown, drag]);

  const panelStyle = useAnimatedStyle(() => {
    const offset = (1 - shown.value) * size.value + drag.value;
    return { transform: [isTV ? { translateX: offset } : { translateY: offset }] };
  });
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, shown.value - drag.value / size.value)),
  }));

  const dragToClose = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!isTV)
        .activeOffsetY(12)
        .failOffsetX([-16, 16])
        .onUpdate((event) => {
          drag.set(Math.max(0, event.translationY));
        })
        .onEnd((event) => {
          if (event.translationY > size.value * CLOSE_DISTANCE_RATIO || event.velocityY > CLOSE_VELOCITY) {
            scheduleOnRN(onOpenChange, false);
          } else {
            drag.set(withTiming(0, SLIDE));
          }
        }),
    [drag, size, onOpenChange],
  );

  const select = useCallback(
    (episode: EpisodeItem) => {
      onOpenChange(false);
      if (episode.uniqueId !== useEpisodesIdStore.getState().currentUniqueId) onSelect(episode);
    },
    [onOpenChange, onSelect],
  );

  if (!mounted) return null;

  return (
    <>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} />
      <GestureDetector gesture={dragToClose}>
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          onLayout={(event) => {
            size.set(isTV ? event.nativeEvent.layout.width + TV_PANEL_EDGE : event.nativeEvent.layout.height);
          }}
          style={[isTV ? [styles.tvPanel, { width: tvPanelWidth(width) }] : styles.panel, panelStyle]}>
          {!isTV && (
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
              locations={[0, 0.3, 1]}
              style={StyleSheet.absoluteFill}
            />
          )}
          {!isTV && <View className="mb-2 h-1 w-10 self-center rounded-full bg-white/40" />}
          {isTV ? (
            <>
              <LinearGradient
                colors={['transparent', TV_PANEL_COLOR]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tvEdge}
              />
              {/* The D-pad stays in the panel rather than reaching the player's controls behind it */}
              <TVFocusGuideView trapFocusUp trapFocusDown trapFocusLeft trapFocusRight style={styles.tvContent}>
                <EpisodesStrip onSelect={select} onFocusInside={hideControls} />
              </TVFocusGuideView>
            </>
          ) : (
            <EpisodesStrip onSelect={select} onFocusInside={hideControls} />
          )}
        </Animated.View>
      </GestureDetector>
    </>
  );
};

const styles = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 36, paddingBottom: 16 },
  tvPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    paddingTop: 28,
    backgroundColor: TV_PANEL_COLOR,
  },
  tvEdge: { position: 'absolute', top: 0, bottom: 0, left: -TV_PANEL_EDGE, width: TV_PANEL_EDGE },
  tvContent: { flex: 1 },
  list: { height: THUMBNAIL_HEIGHT + TITLE_HEIGHT },
  listContent: { paddingHorizontal: 16 },
  tvList: { flex: 1 },
  tvListContent: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 24 },
});

export default EpisodesPanel;
