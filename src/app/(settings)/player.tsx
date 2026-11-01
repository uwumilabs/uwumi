import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { ChoiceDialog, choiceLabel, type ChoiceOption, NativeList, SectionTitle, ThemedView } from '@/components';
import { SUB_LANGUAGE } from '@/constants/config';
import { isTV } from '@/constants/utils';
import { useExternalSubtitleStore, usePlayerSettingsStore } from '@/hooks';

const OFF = 'off';

const LANGUAGE_OPTIONS: ChoiceOption<string>[] = [
  { label: 'Off', value: OFF },
  ...Object.entries(SUB_LANGUAGE)
    .filter(([name]) => name !== 'ALL')
    .map(([name, value]) => ({ label: name, value }))
    .sort((a, b) => a.label.localeCompare(b.label)),
];
const WATCHED_OPTIONS = [70, 75, 80, 85, 90, 95, 100].map((value) => ({ label: `${value}%`, value }));
const HIDE_OPTIONS = [2000, 3000, 4000, 5000, 7000, 10000].map((value) => ({
  label: `${value / 1000} seconds`,
  value,
}));
const SKIP_OPTIONS = [30, 60, 75, 85, 90, 120].map((value) => ({ label: `${value}s`, value }));

type Choice = Omit<React.ComponentProps<typeof ChoiceDialog<string | number>>, 'open' | 'onOpenChange'>;

const Player = () => {
  const settings = usePlayerSettingsStore();
  const update = settings.update;
  const language = useExternalSubtitleStore((state) => state.language);
  const setLanguage = useExternalSubtitleStore((state) => state.setLanguage);
  const [choice, setChoice] = useState<Choice | null>(null);

  const pick = (title: string, options: ChoiceOption<number>[], value: number, onChange: (value: number) => void) =>
    setChoice({ title, options, value, onChange: (picked) => onChange(Number(picked)) });

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <SectionTitle>Internal player</SectionTitle>
        <NativeList variant="flat">
          <NativeList.Item
            title="Mark episode as watched at"
            description={choiceLabel(WATCHED_OPTIONS, settings.watchedPercent) ?? `${settings.watchedPercent}%`}
            onPress={() =>
              pick('Mark episode as watched at', WATCHED_OPTIONS, settings.watchedPercent, (watchedPercent) =>
                update({ watchedPercent }),
              )
            }
          />
          {!isTV && (
            <NativeList.Item
              title="Rotate to landscape"
              description="Opens videos in landscape, either way up"
              toggle={{
                value: settings.rotateToLandscape,
                onValueChange: (rotateToLandscape) => update({ rotateToLandscape }),
              }}
            />
          )}
          <NativeList.Item
            title="Hide player controls after"
            description={choiceLabel(HIDE_OPTIONS, settings.controlsHideMs) ?? `${settings.controlsHideMs} ms`}
            onPress={() =>
              pick('Hide player controls after', HIDE_OPTIONS, settings.controlsHideMs, (controlsHideMs) =>
                update({ controlsHideMs }),
              )
            }
          />
        </NativeList>

        <SectionTitle>Intro skip</SectionTitle>
        <NativeList variant="flat">
          <NativeList.Item
            title="Enable AniSkip"
            description="Skip intro, outro and recap buttons from AniSkip's timestamps, for anime"
            toggle={{ value: settings.aniSkip, onValueChange: (aniSkip) => update({ aniSkip }) }}
          />
          <NativeList.Item
            title="Default skip intro length"
            description={`${settings.skipIntroSeconds}s, where AniSkip has no timestamps`}
            onPress={() =>
              pick('Default skip intro length', SKIP_OPTIONS, settings.skipIntroSeconds, (skipIntroSeconds) =>
                update({ skipIntroSeconds }),
              )
            }
          />
        </NativeList>

        {!isTV && (
          <>
            <SectionTitle>Picture-in-picture</SectionTitle>
            <NativeList variant="flat">
              <NativeList.Item
                title="Picture-in-picture button"
                description="In the player's controls"
                toggle={{ value: settings.pipButton, onValueChange: (pipButton) => update({ pipButton }) }}
              />
              <NativeList.Item
                title="Switch to picture-in-picture on leaving"
                description="When you leave the player while it's playing"
                toggle={{ value: settings.autoPip, onValueChange: (autoPip) => update({ autoPip }) }}
              />
            </NativeList>

            <SectionTitle>Gestures</SectionTitle>
            <NativeList variant="flat">
              <NativeList.Item
                title="Double tap to seek"
                description="Double tap the left or right side to rewind or fast-forward"
                toggle={{ value: settings.doubleTapSeek, onValueChange: (doubleTapSeek) => update({ doubleTapSeek }) }}
              />
            </NativeList>
          </>
        )}

        <SectionTitle>Subtitles</SectionTitle>
        <NativeList variant="flat">
          <NativeList.Item
            title="External subtitles"
            description={`OpenSubtitles tracks for movies and TV shows: ${choiceLabel(LANGUAGE_OPTIONS, language ?? OFF) ?? 'Off'}`}
            onPress={() =>
              setChoice({
                title: 'External subtitles',
                options: LANGUAGE_OPTIONS,
                value: language ?? OFF,
                onChange: (value) => setLanguage(value === OFF ? null : String(value)),
              })
            }
          />
        </NativeList>
      </ScrollView>

      {choice && <ChoiceDialog open onOpenChange={(open) => !open && setChoice(null)} {...choice} />}
    </ThemedView>
  );
};

export default Player;
