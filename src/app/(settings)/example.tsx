/**
 * This file is only for development and testing purposes.
 * It is not intended for production use.
 * This file doesnt get bundled in the production build.(may be😁)
 * It is used to test the functionality of library, stores,hooks other screens etc.
 */
import React from 'react';
import { ThemedView } from '@/components';
import { Button, Text, ScrollView, YStack, XStack } from 'tamagui';
import { storage } from '@/hooks/stores/MMKV';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Notifications from 'expo-notifications';

const Example = () => {
  // Set up notification channel for Android
  React.useEffect(() => {
    const setupNotificationChannel = async () => {
      if (Notifications.AndroidImportance) {
        await Notifications.setNotificationChannelAsync('downloads', {
          name: 'Downloads',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          showBadge: true,
          sound: null, // No sound for progress updates
        });
      }
    };
    setupNotificationChannel();
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
  };

  const deleteAllMMKVKeys = () => {
    const keys = storage.getAllKeys();
    keys.forEach((key) => {
      storage.delete(key);
      //console.log(`Deleted key: ${key}`);
    });
  };
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true, // No sound for progress updates
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  const setPortrait = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  };

  const setLandscape = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  };

  const showNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification 📬',
        body: 'This is a sample notification from Uwumi!',
        data: { data: 'goes here' },
      },
      trigger: null, // Show immediately
    });
  };

  // Simulate a download notification with proper progress updates
  const showDownloadNotification = async () => {
    try {
      // Request permissions first
      const permission = await Notifications.requestPermissionsAsync();
      const granted = (permission as any)?.status === 'granted' || (permission as any)?.granted;
      if (!granted) {
        console.warn('Notification permission not granted');
        return;
      }

      const notificationId = 'download-progress';

      // Create initial notification with progress bar
      await Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content: {
          title: 'Downloading Episode',
          body: 'Starting download...',
          data: { type: 'download', progress: 0 },
          // Android-specific progress notification
          ...(Notifications.AndroidImportance && {
            android: {
              channelId: 'downloads',
              priority: Notifications.AndroidNotificationPriority.HIGH,
              progress: {
                max: 100,
                current: 0,
                indeterminate: false,
              },
            },
          }),
        } as any,
        trigger: null,
      });

      // Simulate download progress
      const steps = [10, 25, 40, 55, 70, 85, 100];
      for (const progress of steps) {
        // Wait to simulate download time
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (progress < 100) {
          // Update notification with new progress
          await Notifications.scheduleNotificationAsync({
            identifier: notificationId,
            content: {
              title: 'Downloading Episode',
              body: `${progress}% complete`,
              data: { type: 'download', progress },
              ...(Notifications.AndroidImportance && {
                android: {
                  channelId: 'downloads',
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                  progress: {
                    max: 100,
                    current: progress,
                    indeterminate: false,
                  },
                },
              }),
            } as any,
            trigger: null,
          });
        } else {
          // Final completion notification
          await Notifications.scheduleNotificationAsync({
            identifier: notificationId,
            content: {
              title: 'Download Complete',
              body: 'Episode downloaded successfully',
              data: { type: 'download', progress: 100 },
              ...(Notifications.AndroidImportance && {
                android: {
                  channelId: 'downloads',
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                },
              }),
            } as any,
            trigger: null,
          });

          // Auto-dismiss after 3 seconds
          setTimeout(async () => {
            await Notifications.dismissNotificationAsync(notificationId);
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Failed to show download notification', err);
    }
  };

  return (
    <ThemedView>
      <ScrollView>
        <YStack padding="$4" gap="$3">
          <Text fontSize="$7" fontWeight="bold" color="$color">
            Screen Orientation
          </Text>
          <XStack gap="$3">
            <Button flex={1} onPress={setPortrait} themeInverse>
              Portrait
            </Button>
            <Button flex={1} onPress={setLandscape} themeInverse>
              Landscape
            </Button>
          </XStack>

          <Text fontSize="$7" fontWeight="bold" color="$color" marginTop="$4">
            Notifications
          </Text>
          <XStack gap="$3">
            <Button onPress={showNotification} flex={1} themeInverse>
              Show Sample Notification
            </Button>
            <Button onPress={showDownloadNotification} flex={1} themeInverse>
              Show Download Notification
            </Button>
          </XStack>

          <Text fontSize="$7" fontWeight="bold" color="$color" marginTop="$4">
            MMKV Storage
          </Text>
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
        </YStack>
      </ScrollView>
    </ThemedView>
  );
};

export default Example;
