import React from 'react';
import { Text } from 'react-native';
import { HUXStack, HUYStack, Select, ThemedView } from '@/components';
import { SUB_LANGUAGE } from '@/constants/config';
import { useExternalSubtitleStore } from '@/hooks';

const OFF = 'off';

const LANGUAGE_OPTIONS = [
  { name: 'Off', value: OFF },
  ...Object.entries(SUB_LANGUAGE)
    .filter(([name]) => name !== 'ALL')
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name)),
];

const Player = () => {
  const language = useExternalSubtitleStore((state) => state.language);
  const setLanguage = useExternalSubtitleStore((state) => state.setLanguage);

  return (
    <ThemedView>
      <HUXStack className="items-center justify-between gap-3 p-4">
        <HUYStack className="flex-1 gap-1">
          <Text className="text-foreground text-base font-semibold">External subtitles</Text>
          <Text className="text-foreground/60 text-xs">
            Adds OpenSubtitles tracks in this language to movies and TV shows
          </Text>
        </HUYStack>
        <Select
          SelectItem={LANGUAGE_OPTIONS}
          SelectLabel="Language"
          value={language ?? OFF}
          onValueChange={(value) => setLanguage(value === OFF ? null : value)}
          size="sm"
        />
      </HUXStack>
    </ThemedView>
  );
};

export default Player;
