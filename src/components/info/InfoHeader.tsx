import React, { useMemo, useState } from 'react';
import { sharedTransitionTags, useInfoParams } from '@/utils/routes';
import { useMediaInfo, useShownTitle } from '@/hooks/queries/infoQueries';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { LinearGradient } from '@/components/LinearGradient';
import Animated from 'react-native-reanimated';
import { Chip, ScrollShadow } from '@/components/heroui';
import { Button } from '@/components/Button';
import { AnimatedImage, Image } from '@/components/Image';
import { HUXStack, HUYStack, IconTitle, RippleButton } from '@/components/ui-primitives';
import { ImagePreview } from '@/components/ImagePreview';
import { IoniconsIcon } from '@/components/Icons';
import { MediaCarousel } from '@/components/MediaCarousel';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { useEpisodeList } from '@/hooks/useEpisodeList';
import { useExtensionStore } from '@/hooks/stores/useExtensionStore';
import { useActiveProvider } from '@/hooks/stores/useProviderStore';
import { hexToRGB, normalizeRating } from '@/utils/format';
import { isTV } from '@/utils/tv';
import { openBrowser, shareMedia } from '@/utils/share';
import type { MediaItem } from '@/utils/media';
import { AnimatedCountdown } from './AnimatedCountdown';
import { useFavoriteToggle } from './useFavoriteToggle';

const DESCRIPTION_MAX_HEIGHT = 150;

/** Providers return the description as HTML (or, for some manga, keyed by language). */
const toPlainText = (description: unknown): string => {
  const raw =
    typeof description === 'string'
      ? description
      : description && typeof description === 'object'
        ? String((description as Record<string, unknown>).en ?? Object.values(description)[0] ?? '')
        : '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

interface InfoHeaderProps {
  /** "More like this" at the end; anime and movies show it after their episode window instead */
  withRecommendations?: boolean;
}

/** The "More like this" row, shown after the header (manga) or after the episode window */
export const InfoRecommendations = () => {
  const { data } = useMediaInfo();
  const { mediaType } = useInfoParams();
  const recommendations = data?.recommendations as MediaItem[] | undefined;
  if (!recommendations?.length) return null;
  return (
    <View className="pt-6">
      <MediaCarousel title="More like this" items={recommendations} mediaType={mediaType} />
    </View>
  );
};

// SF Symbol names, as expo-router types them
type SFSymbol = Extract<React.ComponentProps<typeof Stack.Toolbar.Button>['icon'], string>;

// Toolbar icons: an SF Symbol on iOS; on Android an image of the Ionicon, as its toolbar takes no font icons
const useToolbarIcon = (ionicon: React.ComponentProps<typeof Ionicons>['name'], sfSymbol: SFSymbol) => {
  const { data: image } = useQuery({
    queryKey: ['toolbarIcon', ionicon],
    queryFn: () => Ionicons.getImageSource(ionicon, 24, 'white'),
    enabled: Platform.OS === 'android',
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return Platform.OS === 'ios' ? sfSymbol : (image ?? undefined);
};

/**
 * Share and favorite as native header buttons, beside the native back button: the D-pad reaches them on TV, with
 * the same focus highlight as the back button
 */
export const InfoToolbar = () => {
  const { mediaType, id, type } = useInfoParams();
  const { title } = useShownTitle();
  const currentTheme = useCurrentTheme();
  const { isFavorited, toggleFavorite } = useFavoriteToggle();
  const shareIcon = useToolbarIcon('share-social-outline', 'square.and.arrow.up');
  const heartIcon = useToolbarIcon('heart-outline', 'heart');
  const filledHeartIcon = useToolbarIcon('heart', 'heart.fill');

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon={shareIcon}
        hidden={isTV || !shareIcon}
        accessibilityLabel="Share"
        onPress={() => shareMedia({ mediaType, id, type, title })}
      />
      <Stack.Toolbar.Button
        icon={isFavorited ? filledHeartIcon : heartIcon}
        hidden={!heartIcon || !filledHeartIcon}
        tintColor={isFavorited ? currentTheme?.default : undefined}
        accessibilityLabel={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        onPress={toggleFavorite}
      />
    </Stack.Toolbar>
  );
};

export const InfoHeader = ({ withRecommendations = true }: InfoHeaderProps) => {
  const { data } = useMediaInfo();
  const { mediaType, id, sharedTag } = useInfoParams();
  const { title: shownTitle, image: poster } = useShownTitle();
  const transitionTags = sharedTransitionTags(id, sharedTag);
  // The header floats over the artwork, so the details start below it
  const headerHeight = useHeaderHeight();
  const currentTheme = useCurrentTheme();
  const pureBlackBackground = currentTheme.isPureBlack;
  const currentProvider = useActiveProvider(mediaType);
  const { episodes } = useEpisodeList();

  const description = useMemo(() => toPlainText(data?.description), [data?.description]);
  const chips = useMemo(() => {
    const season = [data?.season, data?.releaseDate].filter(Boolean).join(' ');
    return [
      ...(data?.genres ?? []),
      data?.type,
      data?.countryOfOrigin,
      season,
      data?.duration ? `${data.duration}m` : undefined,
    ].filter((chip): chip is string => typeof chip === 'string' && chip.trim().length > 0);
  }, [data]);
  const trailerId = data?.trailer?.id;
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <View>
      {!!poster && (
        <ImagePreview uri={poster} title={shownTitle} visible={previewOpen} onClose={() => setPreviewOpen(false)} />
      )}
      {/* TV: focus inside a block scrolls all of it clear of the see-through header (the page snaps below it) */}
      <View className="h-75 relative" focusable={isTV ? false : undefined} scrollSnapAlign={isTV ? 'start' : undefined}>
        <View className="absolute inset-0 h-75 w-full" focusable={isTV ? false : undefined}>
          <Image source={{ uri: data?.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </View>
        <View className="h-75 absolute inset-0 z-10" focusable={isTV ? false : undefined}>
          <LinearGradient
            className="w-full h-75 flex-1"
            colors={
              pureBlackBackground
                ? [hexToRGB('#000000', 1), hexToRGB('#000000', 0.7), hexToRGB('#000000', 0.4)]
                : [
                    hexToRGB(currentTheme?.background, 1),
                    hexToRGB(currentTheme?.background, 0.7),
                    hexToRGB(currentTheme?.background, 0.4),
                  ]
            }
            start={[0, 1]}
            end={[0, 0.5]}
          />
        </View>
        {/* TV: details at the bottom of the artwork */}
        <View
          className="p-2.5 z-20"
          style={[{ paddingTop: headerHeight }, isTV && { flex: 1, justifyContent: 'flex-end' }]}
          focusable={isTV ? false : undefined}>
          <HUXStack className="gap-2.5 items-center" focusable={isTV ? false : undefined}>
            {!isTV && (
              <Pressable
                testID="info-cover"
                onPress={() => setPreviewOpen(true)}
                disabled={!poster}
                accessibilityRole="imagebutton"
                accessibilityLabel="View cover">
                <AnimatedImage
                  sharedTransitionTag={transitionTags.image}
                  source={{ uri: poster }}
                  style={{ width: 115, height: 163 }}
                />
              </Pressable>
            )}
            <HUYStack
              className="gap-2 flex-1"
              focusable={isTV ? false : undefined}
              style={isTV ? { maxWidth: '55%' } : undefined}>
              <Animated.Text
                className="text-foreground text-3xl font-bold"
                numberOfLines={3}
                sharedTransitionTag={transitionTags.title}>
                {shownTitle}
              </Animated.Text>

              <HUXStack className="item-center justify-between" focusable={isTV ? false : undefined}>
                {data?.status && <IconTitle iconName="time-outline" text={data?.status} />}
                {episodes.length > 0 && (
                  <RippleButton
                    testID="info-webview"
                    onPress={() =>
                      openBrowser(
                        episodes[0].url! || useExtensionStore.getState().getExtensionInfo(currentProvider)?.baseUrl!,
                      )
                    }>
                    <IconTitle iconName="globe-outline" text="Webview" />
                  </RippleButton>
                )}
              </HUXStack>
              <HUXStack className="justify-between" focusable={isTV ? false : undefined}>
                <IconTitle iconName="star-outline" text={normalizeRating(data?.rating)} />
                {(data?.nextAiringEpisode?.airingTime || data?.nextAiringEpisode?.releaseDate) && <AnimatedCountdown />}
                <IconTitle iconName="film-outline" text={data?.type} />
              </HUXStack>
            </HUYStack>
          </HUXStack>
        </View>
      </View>

      <HUYStack className="gap-3 px-4 pt-4" scrollSnapAlign={isTV ? 'start' : undefined}>
        {!!description && (
          <ScrollShadow LinearGradientComponent={LinearGradient} size={32} color={currentTheme.screenBackground}>
            <ScrollView
              testID="info-description"
              style={{ maxHeight: DESCRIPTION_MAX_HEIGHT }}
              // Android: lets this scroll inside the page by touch
              nestedScrollEnabled
              // TV: the D-pad can only scroll it while it has focus, as there's nothing focusable inside
              focusable={isTV ? true : undefined}
              scrollsToTop={false}
              showsVerticalScrollIndicator={false}>
              <Text className="text-foreground/90 text-base leading-6">{description}</Text>
            </ScrollView>
          </ScrollShadow>
        )}

        {chips.length > 0 && (
          <HUXStack className="flex-wrap gap-2">
            {chips.map((chip) => (
              // Labels only: nothing for the D-pad to stop on
              <Chip key={chip} size="sm" focusable={isTV ? false : undefined}>
                {chip}
              </Chip>
            ))}
          </HUXStack>
        )}

        {!!trailerId && (
          <Button
            testID="info-trailer"
            variant="secondary"
            size="sm"
            className="self-start"
            onPress={() => openBrowser(`https://www.youtube.com/watch?v=${trailerId}`)}>
            <IoniconsIcon name="logo-youtube" size={16} color={currentTheme?.foreground} />
            <Button.Label>Trailer</Button.Label>
          </Button>
        )}
      </HUYStack>

      {withRecommendations && <InfoRecommendations />}
      <View className="h-4" />
    </View>
  );
};
