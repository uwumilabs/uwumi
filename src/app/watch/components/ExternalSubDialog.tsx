import { FlatList } from 'react-native';
import React, { useCallback, useMemo } from 'react';
import { Button, Dialog, Input, Spinner, XStack, Text, View } from 'tamagui';
import { RippleButton } from '@/components/ui-primitives';
import { Search, X } from '@tamagui/lucide-icons';
import { SUB_LANGUAGE } from '@/constants/config';
import Animated, { LinearTransition, FadeInDown, FadeOutUp, Easing } from 'react-native-reanimated';
import type { TextInput } from 'react-native';
import { useCustomBackHandler } from '@/hooks';

const AnimatedView = Animated.createAnimatedComponent(View);

interface ExternalSubDialogProps {
  openExternalSubtitleLanguageDialog: boolean;
  setOpenExternalSubtitleLanguageDialog: (open: boolean) => void;
  externalSubtitleLanguage: string | null;
  setExternalSubtitleLanguage: (language: string | null) => void;
  isExternalSubtitlesLoading: boolean;
  setShouldFetchExternalSubs: (shouldFetch: boolean) => void;
  isFullscreen: boolean;
}

const ExternalSubDialog: React.FC<ExternalSubDialogProps> = ({
  openExternalSubtitleLanguageDialog,
  setOpenExternalSubtitleLanguageDialog,
  externalSubtitleLanguage,
  setExternalSubtitleLanguage,
  isExternalSubtitlesLoading,
  setShouldFetchExternalSubs,
  isFullscreen,
}) => {
  const inputRef = React.useRef<TextInput>(null);

  useCustomBackHandler(openExternalSubtitleLanguageDialog, () => {
    if (openExternalSubtitleLanguageDialog) {
      setOpenExternalSubtitleLanguageDialog(false);
    }
    return true;
  });

  const handleSelectLanguage = useCallback(
    (lang: string) => {
      setExternalSubtitleLanguage(lang);
      inputRef.current?.blur();
    },
    [setExternalSubtitleLanguage],
  );

  const handleClear = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.clear();
    setExternalSubtitleLanguage(null);
  }, [setExternalSubtitleLanguage]);

  // Improved search function with fuzzy matching
  const filteredLanguages = useMemo(() => {
    const searchTerms = externalSubtitleLanguage?.toLowerCase().trim().split(/\s+/);

    return Object.keys(SUB_LANGUAGE)
      .filter((lang) => {
        const langLower = lang.toLowerCase();
        const langParts = langLower.split(/[\s()]+/);
        return searchTerms?.every((term) => langParts.some((part) => part.startsWith(term)));
      })
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const searchLower = externalSubtitleLanguage?.toLowerCase().trim();

        if (aLower === searchLower) return -1;
        if (bLower === searchLower) return 1;
        if (aLower.startsWith(searchLower!) && !bLower.startsWith(searchLower!)) return -1;
        if (bLower.startsWith(searchLower!) && !aLower.startsWith(searchLower!)) return 1;
        return a.localeCompare(b);
      });
  }, [externalSubtitleLanguage]);
  return (
    <Dialog modal open={openExternalSubtitleLanguageDialog} onOpenChange={setOpenExternalSubtitleLanguageDialog}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          backgroundColor="rgba(0,0,0,0.5)"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          width={isFullscreen ? '85%' : '95%'}
          maxWidth={900}
          height={isFullscreen ? '80%' : '60%'}
          padding="$5"
          borderRadius="$6"
          position="relative"
          alignSelf={'center'}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ opacity: 0, scale: 0.95 }}
          exitStyle={{ opacity: 0, scale: 0.95 }}
          gap="$4">
          <View
            flexDirection={isFullscreen ? 'row' : 'column'}
            gap={isFullscreen ? '$6' : '$4'}
            alignItems={isFullscreen ? 'flex-start' : 'stretch'}
            justifyContent="space-between"
            flex={1}>
            <View flex={1} gap="4" width={isFullscreen ? 'auto' : '100%'}>
              <XStack
                alignItems="center"
                backgroundColor="$background"
                borderWidth={2}
                borderColor="$borderColor"
                borderRadius="$4"
                paddingHorizontal="$3"
                paddingVertical="$2.5"
                width={isFullscreen ? 'auto' : '100%'}>
                <Search size={18} color="$color2" />
                <Input
                  ref={inputRef}
                  flex={1}
                  placeholder="Search languages..."
                  value={externalSubtitleLanguage!}
                  borderWidth={0}
                  autoCorrect={false}
                  autoCapitalize="none"
                  autoComplete="off"
                  placeholderTextColor={'$color1'}
                  onChangeText={setExternalSubtitleLanguage}
                />
                {externalSubtitleLanguage ? (
                  <Button
                    size="$2.5"
                    circular
                    chromeless
                    icon={X}
                    onPress={handleClear}
                    backgroundColor="$color3"
                    color="$color1"
                    hoverStyle={{ backgroundColor: '$color4' }}
                    pressStyle={{ backgroundColor: '$color5' }}
                  />
                ) : null}
              </XStack>
              <XStack
                alignSelf={isFullscreen ? 'flex-end' : 'stretch'}
                justifyContent={isFullscreen ? 'flex-end' : 'space-between'}
                gap="$4"
                marginTop={isFullscreen && externalSubtitleLanguage ? '$6' : '$4'}
                width="100%">
                <Dialog.Close displayWhenAdapted asChild>
                  <RippleButton
                    onPress={() => {
                      setExternalSubtitleLanguage(null);
                      setOpenExternalSubtitleLanguageDialog(false);
                    }}>
                    <Text>Cancel</Text>
                  </RippleButton>
                </Dialog.Close>
                <Dialog.Close displayWhenAdapted asChild>
                  <Button
                    disabled={!externalSubtitleLanguage?.trim()}
                    onPress={() => {
                      if (externalSubtitleLanguage?.trim()) {
                        setShouldFetchExternalSubs(true);
                        //console.log('Fetching subtitles for language:', externalSubtitleLanguage);
                        setOpenExternalSubtitleLanguageDialog(false);
                        setExternalSubtitleLanguage(externalSubtitleLanguage);
                      }
                    }}>
                    {isExternalSubtitlesLoading ? (
                      <XStack gap="$2" alignItems="center">
                        <Spinner size="small" />
                        <Text color={'$color1'}>Fetching...</Text>
                      </XStack>
                    ) : (
                      <Text>Fetch Subtitles</Text>
                    )}
                  </Button>
                </Dialog.Close>
              </XStack>
            </View>

            {externalSubtitleLanguage && (
              <AnimatedView
                padding="$2"
                borderRadius="$2"
                flex={1}
                width="100%"
                minHeight={isFullscreen ? 300 : 350}
                maxHeight={isFullscreen ? 400 : '70%'}
                entering={FadeInDown.duration(200).easing(Easing.out(Easing.quad))}
                exiting={FadeOutUp.duration(150).easing(Easing.out(Easing.quad))}>
                <View flex={1} width="100%" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$4">
                  <FlatList
                    data={filteredLanguages}
                    keyExtractor={(item) => item}
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingVertical: 4 }}
                    ListEmptyComponent={
                      <View padding="$4">
                        <Text color="$color2" fontSize="$3" textAlign="center">
                          No languages found for "{externalSubtitleLanguage}"
                        </Text>
                      </View>
                    }
                    renderItem={({ item, index }) => (
                      <AnimatedView
                        key={item}
                        justifyContent="flex-start"
                        paddingHorizontal="$4"
                        borderColor="transparent"
                        borderBottomColor="$borderColor"
                        borderWidth={1}
                        hoverStyle={{ backgroundColor: '$color3' }}
                        pressStyle={{ backgroundColor: '$color4' }}
                        focusStyle={{ backgroundColor: '$color3' }}
                        entering={FadeInDown.delay(index * 15)
                          .duration(150)
                          .easing(Easing.out(Easing.quad))}
                        exiting={FadeOutUp.duration(100).easing(Easing.out(Easing.quad))}
                        layout={LinearTransition.duration(200).easing(Easing.bezier(0.4, 0, 0.2, 1))}>
                        <RippleButton onPress={() => handleSelectLanguage(item)}>
                          <Text fontSize="$4" color="$color1" fontWeight="500">
                            {item}
                          </Text>
                        </RippleButton>
                      </AnimatedView>
                    )}
                  />
                </View>
              </AnimatedView>
            )}
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
};

export default ExternalSubDialog;
