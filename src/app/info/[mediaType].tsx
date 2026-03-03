import { AnimatedCountdown, AnimatedFavoriteButton } from './components';
import {
  IconTitle,
  ThemedView,
  RippleButton,
  AnimatedCustomImage,
  HorizontalTabs,
  HUYStack,
  HUXStack,
  IoniconsIcon,
  CustomImage,
} from '@/components';
import {
  useCurrentTheme,
  useInfo,
  usePureBlackBackground,
  useExtensionStore,
  useMediaInfoStore,
  useEpisodesStore,
} from '@/hooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { findNodeHandle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MediaType, MetaProvider } from '@/constants/types';
import { hexToRGB, normalizeRating } from '@/constants/utils';
import { isTV } from '@/constants/utils';
import Episodes from './Episodes';
import Chapters from './Chapters';
import Details from './Details';
import Similar from './Similar';
import { MediaFormat, TvType } from 'react-native-consumet';
import { useProviderStore } from '@/constants/provider';
import { openBrowserAsync } from 'expo-web-browser';
import Animated from 'react-native-reanimated';

const Info = () => {
  const { mediaType, metaProvider, type, provider, id, image, title } = useLocalSearchParams<{
    mediaType: MediaType;
    metaProvider: MetaProvider;
    type: MediaFormat | TvType;
    provider: string;
    id: string;
    image: string;
    title?: string;
  }>();
  const currentProvider = useProviderStore((state) => state.providers[mediaType]);
  const { getExtensionInfo } = useExtensionStore();
  const { episodes } = useEpisodesStore();
  const { setMediaInfo, clearMediaInfo } = useMediaInfoStore();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useInfo({ mediaType, id, metaProvider, type, provider: currentProvider });
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const currentTheme = useCurrentTheme();
  const router = useRouter();

  // TV: refs for explicit D-pad focus chain
  const backBtnRef = useRef<View>(null);
  const favBtnRef = useRef<View>(null);
  const webviewBtnRef = useRef<View>(null);
  const horizontalTabsRef = useRef<View>(null);

  // Compute native node handles after mount for nextFocus* props
  const [tvNodes, setTvNodes] = useState<{
    back: number | null;
    fav: number | null;
    webview: number | null;
    horizontalTabs: number | null;
  }>({
    back: null,
    fav: null,
    webview: null,
    horizontalTabs: null,
  });
  useEffect(() => {
    if (!isTV) return;
    // Short delay to ensure refs are populated
    const timer = setTimeout(() => {
      setTvNodes({
        back: findNodeHandle(backBtnRef.current),
        fav: findNodeHandle(favBtnRef.current),
        webview: findNodeHandle(webviewBtnRef.current),
        horizontalTabs: findNodeHandle(horizontalTabsRef.current),
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Update store when data changes
  useEffect(() => {
    if (data && id) {
      setMediaInfo(data, id);
    }

    // Clear store on unmount
    return () => {
      clearMediaInfo();
    };
  }, [data, mediaType, id, metaProvider, setMediaInfo, clearMediaInfo]);

  const tabItems = useMemo(
    () => [
      {
        key: 'tab1',
        label: mediaType === MediaType.MANGA ? 'Chapters' : 'Episodes',
        content: mediaType === MediaType.MANGA ? <Chapters /> : <Episodes />,
      },
      {
        key: 'tab2',
        label: 'Details',
        content: <Details />,
      },
      {
        key: 'tab3',
        label: 'Similar',
        content: <Similar />,
      },
    ],
    [mediaType],
  );
  // console.log(data);

  return (
    <>
      <ThemedView
        useSafeArea
        statusBarProps={{ translucent: true, backgroundColor: 'transparent' }}
        focusable={isTV ? false : undefined}>
        <View className="h-75 relative" focusable={isTV ? false : undefined}>
          <View className="absolute inset-0 h-75 w-full" focusable={isTV ? false : undefined}>
            <CustomImage source={{ uri: data?.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
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
              <AnimatedCustomImage
                sharedTransitionTag={`shared-image-${id}`}
                source={{ uri: image }}
                style={{ width: 115, height: 163 }}
                focusable={isTV ? false : undefined}
              />
              <HUYStack className="gap-2 flex-1" props={{ focusable: isTV ? false : undefined }}>
                <Animated.Text
                  className="text-foreground text-3xl font-bold"
                  numberOfLines={3}
                  sharedTransitionTag={`shared-title-${id}`}>
                  {title}
                </Animated.Text>

                <HUXStack className="item-center justify-between" props={{ focusable: isTV ? false : undefined }}>
                  {data?.status && <IconTitle iconName="time-outline" text={data?.status} />}
                  {episodes.length > 0 && (
                    <RippleButton
                      ref={webviewBtnRef}
                      onPress={() => openBrowserAsync(episodes[0].url! || getExtensionInfo(currentProvider)?.baseUrl!)}
                      nextFocusUp={tvNodes.back}
                      nextFocusLeft={tvNodes.webview}
                      nextFocusRight={tvNodes.webview}
                      nextFocusDown={tvNodes.horizontalTabs}>
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

        <HUYStack className="items-center mt-5 flex-1" props={{ focusable: isTV ? false : undefined }}>
          <HorizontalTabs
            ref={horizontalTabsRef}
            items={tabItems}
            initialTab="tab1"
            nextFocusUp={tvNodes.webview ?? tvNodes.back}
          />
        </HUYStack>
      </ThemedView>
    </>
  );
};

export default Info;
