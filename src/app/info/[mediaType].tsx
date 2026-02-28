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
import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MediaType, MetaProvider } from '@/constants/types';
import { hexToRGB, normalizeRating } from '@/constants/utils';
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
      <ThemedView useSafeArea statusBarProps={{ translucent: true, backgroundColor: 'transparent' }}>
        <View className="h-75 relative">
          <View className="absolute inset-0 h-75 w-full">
            <CustomImage source={{ uri: data?.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          </View>
          <View className="h-75 absolute inset-0 z-10">
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
          <View className="p-2.5 z-20" style={{ marginTop: insets.top }}>
            <HUXStack className="items-center justify-between">
              <RippleButton onPress={() => router.back()}>
                <IoniconsIcon name="arrow-back-outline" />
              </RippleButton>

              <AnimatedFavoriteButton />
            </HUXStack>

            <HUXStack className="gap-2.5 items-center">
              <AnimatedCustomImage
                sharedTransitionTag={`shared-image-${id}`}
                source={{ uri: image }}
                style={{ width: 115, height: 163 }}
              />
              <HUYStack className="gap-2 flex-1">
                <Animated.Text
                  className="text-foreground text-3xl font-bold"
                  numberOfLines={3}
                  sharedTransitionTag={`shared-title-${id}`}>
                  {title}
                </Animated.Text>

                <HUXStack className="item-center justify-between">
                  {data?.status && <IconTitle iconName="time-outline" text={data?.status} />}
                  {episodes.length > 0 && (
                    <RippleButton
                      onPress={() => openBrowserAsync(episodes[0].url! || getExtensionInfo(currentProvider)?.baseUrl!)}>
                      <IconTitle iconName="globe-outline" text="Webview" />
                    </RippleButton>
                  )}
                </HUXStack>
                <HUXStack className="justify-between">
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

        <HUYStack className="items-center mt-5 flex-1">
          <HorizontalTabs items={tabItems} initialTab="tab1" />
        </HUYStack>
      </ThemedView>
    </>
  );
};

export default Info;
