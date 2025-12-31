import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View, ScrollView } from 'react-native';
import React, { ReactNode, useState } from 'react';
import { WebView } from 'react-native-webview';
import { hexToRGB } from '@/constants/utils';
import { useCurrentTheme, usePureBlackBackground, useMediaInfoStore } from '@/hooks';
import { RippleButton, HUXStack, HUYStack, IoniconsIcon } from '@/components';

const StatisticsXStack = ({ children }: { children: ReactNode }) => {
  return <HUXStack className="flex-1 justify-between">{children}</HUXStack>;
};

const StatisticItem = ({ label, value }: { label: string; value: string }) => (
  <StatisticsXStack>
    {value && (
      <>
        <Text className="text-2xl font-bold text-foreground">{label}</Text>
        <Text className="text-2xl font-bold text-accent">{value}</Text>
      </>
    )}
  </StatisticsXStack>
);

const Details = () => {
  const data = useMediaInfoStore((state) => state.mediaInfo);
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const currentTheme = useCurrentTheme();
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);

  // Animated style for description collapse/expand
  const descriptionAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(isExpanded ? 0 : -contentHeight + 20, {
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
    };
  }, [isExpanded, contentHeight]);

  // Animated style for chevron rotation
  const chevronAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withTiming(isExpanded ? '180deg' : '0deg', {
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
        },
      ],
    };
  }, [isExpanded]);

  return (
    <HUYStack className="gap-0.5">
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}>
        <View>
          <View>
            <View className="relaive mt-2">
              <View className="absolute" onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}>
                <Text
                  style={{ color: pureBlackBackground ? '#000' : currentTheme?.background }}
                  className="px-2 leading-1 text-justify">
                  {data?.description}
                </Text>
              </View>
              <View
                style={{
                  overflow: 'hidden',
                  height: isExpanded ? contentHeight + contentHeight * 0.5 : contentHeight,
                }}>
                <WebView
                  bounces={false}
                  scrollEnabled={false}
                  originWhitelist={['*']}
                  source={{
                    html: `
                                    <html>
                                      <head>
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                                        <style>
                                          * { margin: 0; padding: 0; overflow: hidden; }
                                          body { width: 100vw; height: 100vh;color: ${currentTheme?.foreground};text-align: justify;font-weight: 500; }
                                        </style>
                                      </head>
                                      <body>
                                        ${data?.description || 'No Description'}
                                      </body>
                                    </html>
                                  `,
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'transparent',
                  }}
                />
              </View>
            </View>
            <View className="h-full">
              {/* Animated description view */}
              <Animated.View
                style={[
                  {
                    overflow: 'hidden',
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                  },
                  descriptionAnimatedStyle,
                ]}>
                <LinearGradient
                  locations={[0, 0.05, 0.1]}
                  colors={
                    pureBlackBackground
                      ? [hexToRGB('#000000', 0.5), hexToRGB('#000000', 0.7), hexToRGB('#000000', 1)]
                      : [
                          hexToRGB(currentTheme?.background, 0.5),
                          hexToRGB(currentTheme?.background, 0.7),
                          hexToRGB(currentTheme?.background, 1),
                        ]
                  }
                  start={{ x: 0.0, y: 0.0 }}
                  end={{ x: 0.0, y: 0.1 }}
                  style={{ height: '100%', width: '100%' }}>
                  <View>
                    {/* Animated icon rotation */}
                    <Animated.View style={[{ alignItems: 'center', padding: 8 }, chevronAnimatedStyle]}>
                      <RippleButton style={{ alignItems: 'center' }} onPress={() => setIsExpanded(!isExpanded)}>
                        <IoniconsIcon name="chevron-down" size={24} />
                      </RippleButton>
                    </Animated.View>
                    <HUYStack className="flex-1 h-full w-full hap-2">
                      <StatisticItem label="Type" value={data?.type || ''} />
                      <StatisticItem label="Country" value={String(data?.countryOfOrigin || '')} />
                      <StatisticItem label="Season" value={`${data?.season || ''} ${data?.releaseDate}`} />
                      <StatisticItem label="Duration" value={`${data?.duration}m`} />
                      <HUYStack className="h-50 relative">
                        <View className="absolute h-50">
                          <WebView
                            bounces={false}
                            scrollEnabled={false}
                            originWhitelist={['*']}
                            source={{
                              html: `
                                <html>
                                  <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                                    <style>
                                      * { margin: 0; padding: 0; overflow: hidden; }
                                      body { width: 100vw; height: 100vh; }
                                      iframe { width: 100%; height: 100%; border: 0; }
                                    </style>
                                  </head>
                                  <body>
                                    <iframe
                                      src="https://www.youtube.com/embed/${data?.trailer?.id}"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowfullscreen>
                                    </iframe>
                                  </body>
                                </html>
                              `,
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                            }}
                          />
                          <View className="w-full h-full" />
                        </View>
                      </HUYStack>
                    </HUYStack>
                  </View>
                </LinearGradient>
              </Animated.View>
            </View>
          </View>
        </View>
      </ScrollView>
    </HUYStack>
  );
};

export default Details;
