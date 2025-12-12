/**
 * This file is only for development and testing purposes.
 * It is not intended for production use.
 * This file doesnt get bundled in the production build.(may be😁)
 * It is used to test the functionality of library, stores,hooks other screens etc.
 */
import React from 'react';
import { ThemedView, RippleButton } from '@/components';
import { Button, Text, ScrollView, YStack } from 'tamagui';
import { storage } from '@/hooks/stores/MMKV';

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

  return (
    <ThemedView>
      <ScrollView>
        <YStack padding="$4" gap="$3">
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

          <RippleButton
            onPress={() => {
              console.log('RippleButton Pressed');
            }}
            containerStyle={{ padding: 12, backgroundColor: '$color2', borderRadius: 8 }}>
            <Text color="$color1">Ripple Button</Text>
          </RippleButton>
        </YStack>
      </ScrollView>
    </ThemedView>
  );
};

export default Example;
