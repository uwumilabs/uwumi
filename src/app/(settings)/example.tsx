/**
 * This file is only for development and testing purposes.
 * It is not intended for production use.
 * This file doesnt get bundled in the production build.(may be😁)
 * It is used to test the functionality of library, stores,hooks other screens etc.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ThemedView, HUYStack } from '@/components';
import { storage } from '@/hooks/stores/MMKV';
import { ScrollView, Text } from 'react-native';
import { Button } from 'heroui-native';
import { useUniwind } from 'uniwind';
import { useProviderStore } from '@/constants/provider';
import ExternalSubDialog from '@/app/watch/components/ExternalSubDialog';
import { SUB_LANGUAGE } from '@/constants/config';
import { useExternalSubtitles } from '@/hooks';
import { TvType } from 'react-native-consumet';

const Example = () => {
  const uni = useUniwind();
  const setProvider = useProviderStore((state) => state.setProvider);

  const [externalSubtitleLanguage, setExternalSubtitleLanguage] = useState<string | null>(null);
  const [shouldFetchExternalSubs, setShouldFetchExternalSubs] = useState(false);
  // const [isExternalSubtitlesLoading, setIsExternalSubtitlesLoading] = useState(false);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    data: externalSubtitles,
    isLoading: isExternalSubtitlesLoading,
    isError: isExternalSubtitlesError,
  } = useExternalSubtitles({
    imdbId: 'tt4574334',
    episodeNumber: '5',
    seasonNumber: '1',
    type: TvType.TVSERIES,
    language: SUB_LANGUAGE[externalSubtitleLanguage as keyof typeof SUB_LANGUAGE],
    enabled: true,
  });
  console.log('externalSubtitles', externalSubtitles, isExternalSubtitlesLoading, isExternalSubtitlesError);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  const handleSetShouldFetchExternalSubs = useCallback((value: boolean) => {
    setShouldFetchExternalSubs(value);

    // This screen is for UI testing, so we simulate a short loading state.
    // if (value) {
    //   setIsExternalSubtitlesLoading(true);
    //   if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    //   loadingTimeoutRef.current = setTimeout(() => {
    //     setIsExternalSubtitlesLoading(false);
    //     setShouldFetchExternalSubs(false);
    //   }, 1200);
    // }
  }, []);

  const getAllMMKVKeys = () => {
    const keys = storage.getAllKeys();
    //console.log('All MMKV Keys:', keys);
    //get all the data from MMKV storage
    //console.log(storage.getBoolean('hasCompletedOnboarding'));
    keys.forEach((key) => {
      const value = storage.getString(key);
      const typeOfValue = typeof value;
      console.log(`Key: ${key}, Value: ${value}, Type: ${typeOfValue}`);
    });
    console.log(uni);
  };

  const deleteAllMMKVKeys = () => {
    const keys = storage.getAllKeys();
    keys.forEach((key) => {
      storage.delete(key);
      //console.log(`Deleted key: ${key}`);
    });
  };

  return (
    <ThemedView>
      <ScrollView className="space-y-3">
        <HUYStack className="p-4 gap-3">
          <Text className="text-xs font-bold text-accent mt-4">MMKV Storage</Text>
          <Button
            onPress={() => {
              getAllMMKVKeys();
            }}>
            Get All MMKV Keys
          </Button>
          <Button
            onPress={() => {
              deleteAllMMKVKeys();
            }}>
            delete All MMKV Keys
          </Button>
        </HUYStack>

        <HUYStack className="p-4 gap-3">
          <Text className="text-xs font-bold text-accent">External Subtitles (UI Test)</Text>
          <ExternalSubDialog
            externalSubtitleLanguage={externalSubtitleLanguage}
            setExternalSubtitleLanguage={setExternalSubtitleLanguage}
            isExternalSubtitlesLoading={isExternalSubtitlesLoading}
            setShouldFetchExternalSubs={handleSetShouldFetchExternalSubs}
            isFullscreen={false}
          />
          {/* <Button onPress={() => setIsExternalSubtitlesLoading((v) => !v)}>
            Toggle loading ({isExternalSubtitlesLoading ? 'on' : 'off'})
          </Button> */}
          <Button onPress={() => handleSetShouldFetchExternalSubs(true)}>
            Simulate “Fetch Subtitles” (shouldFetch={String(shouldFetchExternalSubs)})
          </Button>
          <Text>Selected language: {externalSubtitleLanguage ?? '(none)'}</Text>
        </HUYStack>
      </ScrollView>
    </ThemedView>
  );
};

export default Example;
