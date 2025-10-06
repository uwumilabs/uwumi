/**
 * This file is only for development and testing purposes.
 * It is not intended for production use.
 * This file doesnt get bundled in the production build.(may be😁)
 * It is used to test the functionality of library, stores,hooks other screens etc.
 */
import { ThemedView } from '@/components/ThemedView';
import { Button } from 'tamagui';
import { storage } from '@/hooks/stores/MMKV';
import { useExtensionStore, useOnboardingFlowStore, useConsumetExtensions } from '@/hooks';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AnimeProvider, ProviderManager, type ExtensionRegistry } from 'react-native-consumet';

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
  const { updateRegistry, installExtension, readExtensionCode, readExtractorCode, providerManager } =
    useConsumetExtensions();
  const { setHasCompletedOnboarding } = useOnboardingFlowStore();
  const router = useRouter();

  const fetchExtensionRegistry = async () => {
    try {
      updateRegistry(
        'https://raw.githubusercontent.com/uwumilabs/react-native-consumet/refs/heads/main/src/extension-registry.json',
      );
    } catch (error) {
      console.error('Error fetching extension registry:', error);
    }
  };
  readExtractorCode;

  const getExtensionCode = async (extensionId: string) => {
    try {
      const extension = await installExtension(extensionId);
      const content = await readExtensionCode(extensionId);
      const metadata = providerManager.getExtensionMetadata(extensionId);
      //console.log('Extension metadata:', metadata);
      // @ts-ignore
      const zoro = providerManager.executeProviderCode(content!, metadata.factoryName, metadata);
      const search = await (await zoro).search('One');
      //console.log('Search results:', search);
      // const extractorCode = await readExtractorCode('MegaCloud');
      // console.log('Extension file content:', extractorCode);
    } catch (error) {
      console.error('Error reading extension file:', error);
    }
  };

  return (
    <ThemedView>
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

      <Button
        onPress={() => {
          fetchExtensionRegistry();
        }}
        themeInverse>
        load Extension Registry
      </Button>
      <Button
        onPress={() => {
          getExtensionCode('himovies');
        }}
        themeInverse>
        Get Extension File
      </Button>
    </ThemedView>
  );
};

export default Example;
