/**
 * This file is only for development and testing purposes.
 * It is not intended for production use.
 * This file doesnt get bundled in the production build.(may be😁)
 * It is used to test the functionality of library, stores,hooks other screens etc.
 */
import React from 'react';
import { ThemedView, HUXStack, HUYStack, Progress } from '@/components';
import { storage } from '@/hooks/stores/MMKV';
import { ScrollView, Text } from 'react-native';
import { Button } from 'heroui-native';
import { useUniwind } from 'uniwind';

const Example = () => {
  const uni = useUniwind();
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
      <ScrollView>
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
        <HUXStack className="w-full bg-red-500">
          <Progress value={70} />
        </HUXStack>
      </ScrollView>
    </ThemedView>
  );
};

export default Example;
