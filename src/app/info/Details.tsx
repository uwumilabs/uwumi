import { MotiView } from 'moti';
import { LinearGradient } from 'tamagui/linear-gradient';
import { Text, View, YStack, XStack, styled, ZStack, ScrollView } from 'tamagui';
import { ChevronDown } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import { WebView } from 'react-native-webview';
import { hexToRGB } from '@/constants/utils';
import { useCurrentTheme, usePureBlackBackground, useMediaInfoStore } from '@/hooks';
import { RippleButton } from '@/components';

const StatisticsXStack = styled(XStack, {
  flex: 1,
  justifyContent: 'space-between',
});

const StatisticItem = ({ label, value }: { label: string; value: string }) => (
  <StatisticsXStack>
    {value && (
      <>
        <Text fontSize="$4" fontWeight={700} color="$color1">
          {label}
        </Text>
        <Text fontSize="$4" fontWeight={700} color="$color">
          {value}
        </Text>
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

  return (
    <YStack gap={2}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}>
        <View>
          <View>
            <View position="relative" marginTop="$2">
              <View position="absolute" onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}>
                <Text color="transparent" paddingHorizontal="$2" lineHeight="$3.5" textAlign="justify">
                  {data?.description}
                </Text>
              </View>
              <View
                height={isExpanded ? contentHeight + contentHeight * 0.5 : contentHeight}
                style={{ overflow: 'hidden' }}>
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
                                          body { width: 100vw; height: 100vh;color: ${currentTheme?.color1};text-align: justify;font-weight: 500; }
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
            <View height="100%">
              {/* Animated description view */}
              <MotiView
                from={{
                  translateY: -contentHeight,
                }}
                animate={{
                  translateY: isExpanded ? 0 : -contentHeight + 20,
                }}
                transition={{
                  type: 'timing',
                  duration: 500,
                }}
                style={{
                  overflow: 'hidden',
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                }}>
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
                    <MotiView
                      style={{ alignItems: 'center', padding: 8 }}
                      from={{
                        rotate: '180deg',
                      }}
                      animate={{
                        rotate: isExpanded ? '180deg' : '0deg',
                      }}
                      transition={{
                        type: 'timing',
                        duration: 500,
                      }}>
                      <RippleButton
                        style={{ width: '100%', height: 25, alignItems: 'center' }}
                        onPress={() => setIsExpanded(!isExpanded)}>
                        <ChevronDown size={24} color="$color" />
                      </RippleButton>
                    </MotiView>
                    <YStack flex={1} height="100%" width="100%" gap="$2">
                      <StatisticItem label="Type" value={data?.type || ''} />
                      <StatisticItem label="Country" value={String(data?.countryOfOrigin || '')} />
                      <StatisticItem label="Season" value={`${data?.season || ''} ${data?.releaseDate}`} />
                      <StatisticItem label="Duration" value={`${data?.duration}m`} />
                      <YStack height={200} position="relative">
                        <ZStack height={200}>
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
                          <View width="100%" height="100%" />
                        </ZStack>
                      </YStack>
                    </YStack>
                  </View>
                </LinearGradient>
              </MotiView>
            </View>
          </View>
        </View>
      </ScrollView>
    </YStack>
  );
};

export default Details;
