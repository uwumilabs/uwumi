import { AnimatedCountdown, AnimatedFavoriteButton } from './components';
import {
  IconTitle,
  ThemedView,
  RippleButton,
  AnimatedCustomImage,
  HorizontalTabs,
  HUYStack,
  HUXStack,
} from '@/components';
import {
  useCurrentTheme,
  useInfo,
  usePureBlackBackground,
  useExtensionStore,
  useMediaInfoStore,
  useEpisodesStore,
} from '@/hooks';
import { ArrowLeft, Clock, Globe, Star } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ImageBackground, Text, View } from 'react-native';
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

const Info = () => {
  const { mediaType, metaProvider, type, provider, id, image } = useLocalSearchParams<{
    mediaType: MediaType;
    metaProvider: MetaProvider;
    type: MediaFormat | TvType;
    provider: string;
    id: string;
    image: string;
  }>();
  const { getProvider } = useProviderStore();
  const { getExtensionInfo } = useExtensionStore();
  const { episodes } = useEpisodesStore();
  const { setMediaInfo, clearMediaInfo } = useMediaInfoStore();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useInfo({ mediaType, id, metaProvider, type, provider: getProvider(mediaType) });
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

  const tabItems = [
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
  ];
  // console.log(data);

  return (
    <>
      <ThemedView useSafeArea statusBarProps={{ translucent: true, backgroundColor: 'transparent' }}>
        <View className="h-75 relative">
          <ImageBackground className="absolute inset-0 h-75 w-full" source={{ uri: data?.cover }} />
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
                <ArrowLeft />
              </RippleButton>

              <AnimatedFavoriteButton
                id={id}
                title={data?.title!}
                image={image || data?.image!}
                type={type}
                mediaType={mediaType}
                provider={provider}
                metaProvider={metaProvider}
              />
            </HUXStack>

            <HUXStack className="gap-2.5 items-center">
              <AnimatedCustomImage
                sharedTransitionTag={`shared-image-${id}`}
                source={{ uri: image }}
                style={{ width: 115, height: 163 }}
              />
              <HUYStack className="gap-2 flex-1">
                <Text className="text-foreground text-3xl font-bold" numberOfLines={3}>
                  {typeof data?.title === 'object' ? data?.title?.english || data?.title?.romaji : data?.title}
                </Text>

                <HUXStack className="item-center justify-between">
                  {data?.status && <IconTitle icon={Clock} text={data?.status} />}
                  {episodes.length > 0 && (
                    <RippleButton
                      onPress={() =>
                        openBrowserAsync(episodes[0].url! || getExtensionInfo(getProvider(mediaType))?.baseUrl!)
                      }>
                      <IconTitle icon={Globe} text="Webview" color="$color" />
                    </RippleButton>
                  )}
                </HUXStack>
                <HUXStack className="justify-between">
                  <IconTitle icon={Star} text={normalizeRating(data?.rating)} />
                  {(data?.nextAiringEpisode?.airingTime || data?.nextAiringEpisode?.releaseDate) && (
                    <AnimatedCountdown
                      targetDate={data.nextAiringEpisode.airingTime || data?.nextAiringEpisode?.releaseDate}
                    />
                  )}
                  <IconTitle text={data?.type} />
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
