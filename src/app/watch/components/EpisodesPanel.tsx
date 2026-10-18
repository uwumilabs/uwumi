import React, { memo, useCallback, useRef } from 'react';
import { Text, View } from 'react-native';
import type { FlashListRef } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import { cn } from 'heroui-native';
import { TvType, type MediaFormat } from 'react-native-consumet';
import {
  BottomSheetContent,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetRoot,
  useVideoSelector,
} from 'react-native-video-toolkit';
import ProviderSelection from './ProviderSelection';
import { isTV } from '@/constants/utils';
import type { MediaType } from '@/constants/types';
import {
  useEpisodeList,
  useEpisodesIdStore,
  useListJump,
  useServerStore,
  useSheetColor,
  type EpisodeItem,
} from '@/hooks';
import { HUXStack, Image, List, Select, TVFocusWrapper, WavyAnimation } from '@/components';
import { ThumbnailProgress } from '@/components/episode-list/EpisodeList';

const CARD_WIDTH = 200;
const THUMBNAIL_HEIGHT = (CARD_WIDTH * 9) / 16;
const CARD_GAP = 10;
const TITLE_HEIGHT = 44;

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
    onPress: () => void;
  }) => {
    const image = typeof episode.image === 'string' ? episode.image : episode.image?.hd;
    return (
      <TVFocusWrapper onPress={onPress} focusScale={1.03} focusBorderRadius={12} style={{ width: CARD_WIDTH }}>
        <View
          className={cn('overflow-hidden rounded-xl bg-default', isCurrent && 'border-2 border-accent')}
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
        <Text className="mt-1.5 text-sm font-semibold text-foreground" numberOfLines={2}>
          {episode.title}
        </Text>
      </TVFocusWrapper>
    );
  },
);
EpisodeCard.displayName = 'EpisodeCard';

interface EpisodesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (episode: EpisodeItem) => void;
}

/** YouTube-style "more episodes" strip that slides up over the fullscreen player. */
export const EpisodesPanel = ({ open, onOpenChange, onSelect }: EpisodesPanelProps) => {
  const portalHostName = useVideoSelector((state) => state.portalHostName);
  const sheetColor = useSheetColor();
  const { type, mediaType, isDubbed } = useLocalSearchParams<{
    type: MediaFormat | TvType;
    mediaType: MediaType;
    isDubbed?: string;
  }>();
  const { episodes, movieSeasons, activeSeason, setSeason } = useEpisodeList();
  const currentUniqueId = useEpisodesIdStore((store) => store.currentUniqueId);
  const servers = useServerStore((store) => store.servers);
  const currentServer = useServerStore((store) => store.currentServer);
  const setCurrentServer = useServerStore((store) => store.setCurrentServer);
  const listRef = useRef<FlashListRef<EpisodeItem>>(null);

  const rangeLabel = useCallback(
    (start: number, end: number) => `EP ${episodeNumber(episodes[start], start)}–${episodeNumber(episodes[end], end)}`,
    [episodes],
  );
  // Only the range parts: the scroll tracking is for vertical, Reanimated-wrapped lists
  const { listProps, ranges, rangeValue, jumpToRange } = useListJump({ items: episodes, listRef, rangeLabel });
  const currentIndex = episodes.findIndex((episode) => episode.uniqueId === currentUniqueId);

  const select = useCallback(
    (episode: EpisodeItem) => {
      onOpenChange(false);
      if (episode.uniqueId !== currentUniqueId) onSelect(episode);
    },
    [onOpenChange, onSelect, currentUniqueId],
  );

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <BottomSheetPortal hostName={portalHostName}>
        <BottomSheetOverlay />
        <BottomSheetContent
          title="Episodes"
          style={{ maxWidth: '100%', backgroundColor: sheetColor, paddingBottom: 16 }}>
          <HUXStack className="flex-wrap items-center gap-3 px-4 pb-3">
            <Text className="mr-auto text-lg font-semibold text-foreground">Episodes</Text>
            <ProviderSelection mediaType={mediaType} isDubbed={isDubbed} />
            {movieSeasons && type !== TvType.MOVIE && (
              <Select
                SelectItem={movieSeasons.map((_, index) => ({ name: `Season ${index + 1}`, value: String(index) }))}
                SelectLabel="Season"
                value={String(activeSeason)}
                onValueChange={(value) => setSeason(Number(value))}
              />
            )}
            {ranges.length > 0 && (
              <Select SelectItem={ranges} SelectLabel="Episodes" value={rangeValue} onValueChange={jumpToRange} />
            )}
            {servers.length > 0 && (
              <Select
                SelectItem={servers.map((server) => ({ name: server.name, value: server.name }))}
                SelectLabel="Servers"
                value={currentServer?.name ?? ''}
                onValueChange={setCurrentServer}
              />
            )}
          </HUXStack>
          <View style={{ height: isTV ? undefined : THUMBNAIL_HEIGHT + TITLE_HEIGHT, flex: isTV ? 1 : undefined }}>
            <List<EpisodeItem>
              ref={listRef}
              horizontal={!isTV}
              data={episodes}
              keyExtractor={(episode, index) => (episode.uniqueId as string) ?? `${episode.id}-${index}`}
              showsHorizontalScrollIndicator={false}
              scrollsToTop={false}
              // One card early, so the strip reads previous → current → next
              initialScrollIndex={currentIndex > 0 ? currentIndex - 1 : undefined}
              onViewableItemsChanged={listProps.onViewableItemsChanged}
              viewabilityConfig={listProps.viewabilityConfig}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ItemSeparatorComponent={() => <View style={{ width: CARD_GAP, height: CARD_GAP }} />}
              ListFooterComponent={null}
              renderItem={({ item, index }) => (
                <EpisodeCard
                  episode={item}
                  index={index}
                  isCurrent={item.uniqueId === currentUniqueId}
                  onPress={() => select(item)}
                />
              )}
            />
          </View>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheetRoot>
  );
};

export default EpisodesPanel;
