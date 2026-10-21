import React, { useEffect, useMemo, useRef, useState } from 'react';
import { findNodeHandle, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from '@/components/LinearGradient';
import Animated from 'react-native-reanimated';
import { Button, Chip, ScrollShadow } from 'heroui-native';
import { IAnimeInfo, IMovieInfo } from 'react-native-consumet';
import {
  AnimatedImage,
  Image,
  HUXStack,
  HUYStack,
  IconTitle,
  IoniconsIcon,
  MediaCarousel,
  RippleButton,
} from '@/components';
import { useCurrentTheme, useEpisodeList, useExtensionStore, usePureBlackBackground } from '@/hooks';
import { useActiveProvider } from '@/constants/provider';
import { MediaType, MetaProvider } from '@/constants/types';
import { hexToRGB, isTV, normalizeRating, openBrowser } from '@/constants/utils';
import type { MediaItem } from '@/components/CardList';
import { AnimatedCountdown } from './AnimatedCountdown';
import { AnimatedFavoriteButton } from './AnimatedFavoriteButton';

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
  data: IAnimeInfo | IMovieInfo | undefined;
}

export const InfoHeader: React.FC<InfoHeaderProps> = ({ data }) => {
  const { mediaType, metaProvider, id, image, title, sharedTag } = useLocalSearchParams<{
    mediaType: MediaType;
    metaProvider: MetaProvider;
    id: string;
    image: string;
    title?: string;
    sharedTag?: string;
  }>();
  const transitionTag = sharedTag ?? id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentTheme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const currentProvider = useActiveProvider(mediaType);
  const { episodes } = useEpisodeList();

  // TV: refs for an explicit D-pad focus chain across the top row
  const backBtnRef = useRef<View>(null);
  const favBtnRef = useRef<View>(null);
  const webviewBtnRef = useRef<View>(null);
  const [tvNodes, setTvNodes] = useState<{ back: number | null; fav: number | null; webview: number | null }>({
    back: null,
    fav: null,
    webview: null,
  });
  useEffect(() => {
    if (!isTV) return;
    // Short delay to ensure refs are populated
    const timer = setTimeout(() => {
      setTvNodes({
        back: findNodeHandle(backBtnRef.current),
        fav: findNodeHandle(favBtnRef.current),
        webview: findNodeHandle(webviewBtnRef.current),
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
  const recommendations = data?.recommendations as MediaItem[] | undefined;

  return (
    <View>
      <View className="h-75 relative" focusable={isTV ? false : undefined}>
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
        <View className="p-2.5 z-20" style={{ marginTop: insets.top }} focusable={isTV ? false : undefined}>
          <HUXStack className="items-center justify-between" props={{ focusable: isTV ? false : undefined }}>
            <RippleButton
              ref={backBtnRef}
              onPress={() => router.back()}
              hasTVPreferredFocus
              nextFocusRight={tvNodes.fav}
              nextFocusDown={tvNodes.webview}
              nextFocusLeft={tvNodes.back}
              nextFocusUp={tvNodes.back}>
              <IoniconsIcon name="arrow-back-outline" />
            </RippleButton>

            <AnimatedFavoriteButton
              ref={favBtnRef}
              nextFocusLeft={tvNodes.back}
              nextFocusDown={tvNodes.webview}
              nextFocusRight={tvNodes.fav}
              nextFocusUp={tvNodes.fav}
            />
          </HUXStack>

          <HUXStack className="gap-2.5 items-center" props={{ focusable: isTV ? false : undefined }}>
            <AnimatedImage
              sharedTransitionTag={`shared-image-${transitionTag}`}
              source={{ uri: image }}
              style={{ width: 115, height: 163 }}
              focusable={isTV ? false : undefined}
            />
            <HUYStack className="gap-2 flex-1" props={{ focusable: isTV ? false : undefined }}>
              <Animated.Text
                className="text-foreground text-3xl font-bold"
                numberOfLines={3}
                sharedTransitionTag={`shared-title-${transitionTag}`}>
                {title}
              </Animated.Text>

              <HUXStack className="item-center justify-between" props={{ focusable: isTV ? false : undefined }}>
                {data?.status && <IconTitle iconName="time-outline" text={data?.status} />}
                {episodes.length > 0 && (
                  <RippleButton
                    ref={webviewBtnRef}
                    onPress={() =>
                      openBrowser(
                        episodes[0].url! || useExtensionStore.getState().getExtensionInfo(currentProvider)?.baseUrl!,
                      )
                    }
                    nextFocusUp={tvNodes.back}
                    nextFocusLeft={tvNodes.webview}
                    nextFocusRight={tvNodes.webview}>
                    <IconTitle iconName="globe-outline" text="Webview" />
                  </RippleButton>
                )}
              </HUXStack>
              <HUXStack className="justify-between" props={{ focusable: isTV ? false : undefined }}>
                <IconTitle iconName="star-outline" text={normalizeRating(data?.rating)} />
                {(data?.nextAiringEpisode?.airingTime || data?.nextAiringEpisode?.releaseDate) && (
                  <AnimatedCountdown
                  // targetDate={data.nextAiringEpisode.airingTime || data?.nextAiringEpisode?.releaseDate}
                  />
                )}
                <IconTitle iconName="film-outline" text={data?.type} />
              </HUXStack>
            </HUYStack>
          </HUXStack>
        </View>
      </View>

      <HUYStack className="gap-3 px-4 pt-4">
        {!!description &&
          (isTV ? (
            // A nested scroller can't be reached with a D-pad; TV screens have room for the full text
            <Text className="text-foreground/90 text-base leading-6">{description}</Text>
          ) : (
            <ScrollShadow
              LinearGradientComponent={LinearGradient}
              size={32}
              color={pureBlackBackground ? '#000000' : currentTheme?.background}>
              <ScrollView
                style={{ maxHeight: DESCRIPTION_MAX_HEIGHT }}
                // Android: lets this scroll inside the episode list that scrolls the page
                nestedScrollEnabled
                scrollsToTop={false}
                showsVerticalScrollIndicator={false}>
                <Text className="text-foreground/90 text-base leading-6">{description}</Text>
              </ScrollView>
            </ScrollShadow>
          ))}

        {chips.length > 0 && (
          <HUXStack className="flex-wrap gap-2">
            {chips.map((chip) => (
              <Chip key={chip} size="sm">
                {chip}
              </Chip>
            ))}
          </HUXStack>
        )}

        {!!trailerId && (
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onPress={() => openBrowser(`https://www.youtube.com/watch?v=${trailerId}`)}>
            <IoniconsIcon name="logo-youtube" size={16} color={currentTheme?.foreground} />
            <Button.Label>Trailer</Button.Label>
          </Button>
        )}
      </HUYStack>

      {!!recommendations?.length && (
        <View className="pt-6">
          <MediaCarousel
            title="More like this"
            items={recommendations}
            mediaType={mediaType}
            metaProvider={metaProvider}
          />
        </View>
      )}
      <View className="h-4" />
    </View>
  );
};

export default InfoHeader;
