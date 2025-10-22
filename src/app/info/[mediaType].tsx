import { AnimatedCountdown, AnimatedFavoriteButton } from './components';
import { IconTitle, ThemedView, RippleButton, AnimatedCustomImage, HorizontalTabs } from '@/components';
import { useCurrentTheme, useInfo, usePureBlackBackground, useExtensionStore, useMediaInfoStore } from '@/hooks';
import { ArrowLeft, Clock, Globe, Star } from '@tamagui/lucide-icons';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner, Text, View, XStack, YStack, ZStack } from 'tamagui';
import { LinearGradient } from 'tamagui/linear-gradient';
import { MediaType, MetaProvider } from '@/constants/types';
import { hexToRGB } from '@/constants/utils';
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
  if (isLoading) {
    return (
      <ThemedView>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" color="$color" />
        </YStack>
      </ThemedView>
    );
  }
  return (
    <>
      <ThemedView useSafeArea statusBarProps={{ translucent: true, backgroundColor: 'transparent' }}>
        <ZStack height={300}>
          <ImageBackground source={{ uri: data?.cover }} style={{ width: '100%', height: 300 }} />
          <BlurView
            style={{
              ...StyleSheet.absoluteFillObject,
            }}
            intensity={20}
            tint="dark"
          />
          <View height={300}>
            <LinearGradient
              width="100%"
              height="300"
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
              flex={1}
            />
          </View>
          <View padding={10} marginTop={insets.top}>
            <XStack alignItems="center" justifyContent="space-between" marginBlockEnd={20}>
              {/* a small delay to ensure the back navigation is smooth  */}
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
            </XStack>

            <XStack gap={10} alignItems="center">
              <AnimatedCustomImage
                sharedTransitionTag="shared-image"
                source={{ uri: image }}
                style={{ width: 115, height: 163 }}
              />
              <YStack gap={8} flex={1}>
                <Text numberOfLines={3} color="$color1" fontSize="$5" fontWeight="700">
                  {typeof data?.title === 'object' ? data?.title?.english || data?.title?.romaji : data?.title}
                </Text>

                <XStack alignItems="center" justifyContent="space-between">
                  <IconTitle icon={Clock} text={data?.status} />
                  <RippleButton onPress={() => openBrowserAsync(getExtensionInfo(getProvider(mediaType))?.baseUrl!)}>
                    <IconTitle icon={Globe} text="Webview" color="$color" />
                  </RippleButton>
                </XStack>
                <XStack justifyContent="space-between">
                  <IconTitle icon={Star} text={data?.rating} />
                  {(data?.nextAiringEpisode?.airingTime || data?.nextAiringEpisode?.releaseDate) && (
                    <AnimatedCountdown
                      targetDate={data.nextAiringEpisode.airingTime || data?.nextAiringEpisode?.releaseDate}
                    />
                  )}
                  <IconTitle text={data?.type} />
                </XStack>
              </YStack>
            </XStack>
          </View>
        </ZStack>

        <YStack alignItems="center" marginTop={20} flex={1}>
          <HorizontalTabs items={tabItems} initialTab="tab1" />
        </YStack>
      </ThemedView>
    </>
  );
};

export default Info;
