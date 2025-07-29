import { ThemedView } from '@/components/ThemedView';
import { Button } from 'tamagui';
import { storage } from '@/hooks/stores/MMKV';
import { useOnboardingFlowStore } from '@/hooks';
import { useRouter } from 'expo-router';

const Example = () => {
  const getAllMMKVKeys = () => {
    const keys = storage.getAllKeys();
    console.log('All MMKV Keys:', keys);
    //get all the data from MMKV storage
    console.log(storage.getBoolean('hasCompletedOnboarding'));
    keys.forEach((key) => {
      const value = storage.getString(key);
      const typeOfValue = typeof value;
      console.log(`Key: ${key}, Value: ${value}, Type: ${typeOfValue}`);
    });
  };

  const { setHasCompletedOnboarding } = useOnboardingFlowStore();
  const router = useRouter();

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
          setHasCompletedOnboarding(false);
          router.push('/(onboarding)');
        }}
        themeInverse>
        go back to onboarding
      </Button>
    </ThemedView>
  );
};

export default Example;
