// Development only (More lists it in dev builds): MMKV's keys, to inspect or wipe
import React from 'react';
import { ScrollView, Text } from 'react-native';
import { ThemedView, HUYStack } from '@/components/ui-primitives';
import { storage } from '@/hooks/stores/MMKV';
import { Button } from '@/components/heroui';

const logAllKeys = () => {
  for (const key of storage.getAllKeys()) console.log(`Key: ${key}, Value: ${storage.getString(key)}`);
};

const deleteAllKeys = () => {
  for (const key of storage.getAllKeys()) storage.remove(key);
};

const Example = () => (
  <ThemedView testID="example-screen">
    <ScrollView className="space-y-3">
      <HUYStack className="p-4 gap-3">
        <Text className="text-xs font-bold text-accent mt-4">MMKV Storage</Text>
        <Button testID="example-log-keys" onPress={logAllKeys}>
          Get All MMKV Keys
        </Button>
        <Button testID="example-delete-keys" onPress={deleteAllKeys}>
          delete All MMKV Keys
        </Button>
      </HUYStack>
    </ScrollView>
  </ThemedView>
);

export default Example;
