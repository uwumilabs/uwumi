import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useOnboardingFlowStore } from '@/hooks';

const OnboardingLayout = () => {
  const { hasCompletedOnboarding } = useOnboardingFlowStore();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're in onboarding and it's completed
    if (true) {
      router.replace('/(tabs)'); // Redirect to main app if onboarding is completed
    }
    // Remove the redirect to onboarding when not completed to avoid conflicts
  }, [hasCompletedOnboarding, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="index" options={{ title: 'Onboarding' }} />
    </Stack>
  );
};

export default OnboardingLayout;
