/**
 * This file is only for development and testing purposes.
 * It is not intended for production use.
 * This file doesnt get bundled in the production build.(may be😁)
 * It is used to test the functionality of library, stores,hooks other screens etc.
 */
import React, { useState } from 'react';
import { ThemedView } from '@/components';
import { Button, Text, ScrollView, YStack } from 'tamagui';
import { storage } from '@/hooks/stores/MMKV';
import { useDownloadStore } from '@/hooks/stores/useDownloadStore';
import { TextTrackType } from 'react-native-video';

const Example = () => {
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
  };

  const deleteAllMMKVKeys = () => {
    const keys = storage.getAllKeys();
    keys.forEach((key) => {
      storage.delete(key);
      //console.log(`Deleted key: ${key}`);
    });
  };

  const [lastDownloadId, setLastDownloadId] = useState<string | null>(null);

  // Subscribe to store methods (stable references)
  const { initialize, addDownload, startDownload, getStreamInfo, getStorageInfo } = useDownloadStore();

  // Subscribe to downloads object (will re-render on changes)
  const downloads = useDownloadStore((state) => state.downloads);

  // Get the specific download (will re-render when this download changes)
  const currentDownload = lastDownloadId ? downloads[lastDownloadId] : null;

  // console.log('Current Download:', currentDownload);
  return (
    <ThemedView>
      <ScrollView>
        <YStack padding="$4" gap="$3">
          <Button
            onPress={() => {
              getAllMMKVKeys();
            }}
            themeInverse>
            Get All MMKV Keys
          </Button>
          <Button
            onPress={() => {
              deleteAllMMKVKeys();
            }}
            themeInverse>
            delete All MMKV Keys
          </Button>

          {/* Download Store Examples */}
          <Text fontSize="$7" fontWeight="bold" color="$color" marginTop="$4">
            Download Store Demo
          </Text>

          <Button
            onPress={async () => {
              await initialize();
            }}
            themeInverse>
            Init Download Store
          </Button>

          <Button
            onPress={async () => {
              const HLS_URL =
                'https://vault-14.owocdn.top/stream/14/11/f42e0b2853302a6b2df351bde169e0e7c4294664c9f6b48ddff0201f6bc70afc/uwu.m3u8';
              const VTT_URL =
                'https://raw.githubusercontent.com/1c7/vtt-test-file/refs/heads/master/vtt%20files/4.%20No%20Hour.vtt';

              const id = addDownload({
                url: HLS_URL,
                name: 'Big Buck Bunny',
                showName: 'Test Series',
                season: 1,
                episode: 1,
                externalSubtitles: [
                  { uri: VTT_URL, language: 'en', title: 'English External', type: TextTrackType.VTT },
                ],
              });
              setLastDownloadId(id);

              await startDownload(id, (p) => {
                console.log(`Download progress: ${p.percentage}%`);
              });
            }}
            themeInverse>
            Download with Show Directory
          </Button>

          {/* Progress Display */}
          {currentDownload ? (
            <YStack
              backgroundColor="$color3"
              padding="$4"
              borderRadius="$4"
              gap="$2"
              marginTop="$3"
              borderWidth={2}
              borderColor="$color4">
              <Text fontSize="$6" fontWeight="bold" color="$color">
                Status: {currentDownload.status.toUpperCase()}
              </Text>
              <Text fontSize="$5" color="$color1" marginTop="$2">
                Progress: {currentDownload.progress?.percentage ?? 0}%
              </Text>
              {currentDownload.progress ? (
                <>
                  <Text fontSize="$4" color="$color1">
                    Time: {Math.floor(currentDownload.progress.currentTime / 60)}:
                    {Math.floor(currentDownload.progress.currentTime % 60)
                      .toString()
                      .padStart(2, '0')}{' '}
                    / {Math.floor(currentDownload.progress.totalDuration / 60)}:
                    {Math.floor(currentDownload.progress.totalDuration % 60)
                      .toString()
                      .padStart(2, '0')}
                  </Text>
                  <Text fontSize="$4" color="$color1">
                    Speed: {currentDownload.progress.speed.toFixed(2)}x | Bitrate:{' '}
                    {(currentDownload.progress.bitrate / 1000).toFixed(0)} kbps
                  </Text>
                  <Text fontSize="$4" color="$color1">
                    Size: {(currentDownload.progress.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </>
              ) : null}
            </YStack>
          ) : null}

          <Button
            onPress={async () => {
              const HLS_URL = 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8';
              const info = await getStreamInfo(HLS_URL);
              console.log('Stream Info:', {
                duration: `${Math.floor(info.duration / 60)}m ${Math.floor(info.duration % 60)}s`,
                videoTracks: info.videoTracks.length,
                audioTracks: info.audioTracks.length,
                textTracks: info.textTracks.length,
                totalStreams: info.totalStreams,
              });
            }}
            themeInverse>
            Get Stream Info
          </Button>

          <Button
            onPress={() => {
              const storageInfo = getStorageInfo();
              console.log('Storage Info:', {
                downloadsPath: storageInfo.downloadsPath,
                tempPath: storageInfo.tempPath,
                downloadsSize: `${(storageInfo.downloadsSize / 1024 / 1024).toFixed(2)} MB`,
                totalDownloads: storageInfo.totalDownloads,
              });
            }}
            themeInverse>
            Get Storage Info
          </Button>
        </YStack>
      </ScrollView>
    </ThemedView>
  );
};

export default Example;
