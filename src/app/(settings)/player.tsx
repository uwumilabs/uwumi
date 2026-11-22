import React from 'react';
import { ScrollView } from 'react-native';
import { choiceLabel, type ChoiceOption } from '@/components/ChoiceDialog';
import { ChoiceRow, ChoiceRowHost } from '@/components/ChoiceRow';
import { List as NativeList } from '@/components/native/list/List';
import { SectionTitle, ThemedView } from '@/components/ui-primitives';
import { SUBTITLE_LANGUAGES } from '@/constants/config';
import { isTV } from '@/utils/tv';
import { PLAYBACK_RATES, usePlayerSettingsStore } from '@/hooks/stores/usePlayerSettingsStore';
import { useExternalSubtitleStore } from '@/hooks/stores/useExternalSubtitleStore';
import { pickSubtitleStyle, subtitleStyleSummary } from '@/utils/subtitleStyle';
import { SETTINGS_SCREENS } from '@/utils/routes';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

const OFF = 'off';

const LANGUAGE_OPTIONS: ChoiceOption<string>[] = [
  { label: 'Off', value: OFF },
  ...SUBTITLE_LANGUAGES.map(({ name, code }) => ({ label: name, value: code })),
];
const WATCHED_OPTIONS = [70, 75, 80, 85, 90, 95, 100].map((value) => ({ label: `${value}%`, value }));
const HIDE_OPTIONS = [2000, 3000, 4000, 5000, 7000, 10000].map((value) => ({
  label: `${value / 1000} seconds`,
  value,
}));
const SPEED_OPTIONS = PLAYBACK_RATES.map((value) => ({ label: value === 1 ? 'Normal' : `${value}x`, value }));
const SKIP_OPTIONS = [30, 60, 75, 85, 90, 120].map((value) => ({ label: `${value}s`, value }));

const Player = () => {
  const watchedPercent = usePlayerSettingsStore((state) => state.watchedPercent);
  const defaultSpeed = usePlayerSettingsStore((state) => state.defaultSpeed);
  const rotateToLandscape = usePlayerSettingsStore((state) => state.rotateToLandscape);
  const controlsHideMs = usePlayerSettingsStore((state) => state.controlsHideMs);
  const aniSkip = usePlayerSettingsStore((state) => state.aniSkip);
  const skipIntroSeconds = usePlayerSettingsStore((state) => state.skipIntroSeconds);
  const pipButton = usePlayerSettingsStore((state) => state.pipButton);
  const autoPip = usePlayerSettingsStore((state) => state.autoPip);
  const doubleTapSeek = usePlayerSettingsStore((state) => state.doubleTapSeek);
  const update = usePlayerSettingsStore((state) => state.update);
  const language = useExternalSubtitleStore((state) => state.language);
  const setLanguage = useExternalSubtitleStore((state) => state.setLanguage);
  const subtitleStyle = usePlayerSettingsStore(useShallow(pickSubtitleStyle));
  const router = useRouter();

  return (
    <ThemedView testID="player-settings-screen">
      <ChoiceRowHost>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <SectionTitle>Internal player</SectionTitle>
          <NativeList variant="flat">
            <ChoiceRow
              testID="player-settings-row-watched-percent"
              title="Mark episode as watched at"
              options={WATCHED_OPTIONS}
              value={watchedPercent}
              onChange={(value) => update({ watchedPercent: value })}
              description={`${watchedPercent}%`}
            />
            <ChoiceRow
              testID="player-settings-row-default-speed"
              title="Default playback speed"
              options={SPEED_OPTIONS}
              value={defaultSpeed}
              onChange={(value) => update({ defaultSpeed: value })}
              description={choiceLabel(SPEED_OPTIONS, defaultSpeed) ?? `${defaultSpeed}x`}
            />
            {!isTV && (
              <NativeList.Item
                testID="player-settings-row-rotate-landscape"
                title="Rotate to landscape"
                description="Opens videos in landscape, either way up"
                toggle={{ value: rotateToLandscape, onValueChange: (value) => update({ rotateToLandscape: value }) }}
              />
            )}
            <ChoiceRow
              testID="player-settings-row-hide-controls"
              title="Hide player controls after"
              options={HIDE_OPTIONS}
              value={controlsHideMs}
              onChange={(value) => update({ controlsHideMs: value })}
              description={choiceLabel(HIDE_OPTIONS, controlsHideMs) ?? `${controlsHideMs} ms`}
            />
          </NativeList>

          <SectionTitle>Intro skip</SectionTitle>
          <NativeList variant="flat">
            <NativeList.Item
              testID="player-settings-row-aniskip"
              title="Enable AniSkip"
              description="Skip intro, outro and recap buttons from AniSkip's timestamps, for anime"
              toggle={{ value: aniSkip, onValueChange: (value) => update({ aniSkip: value }) }}
            />
            <ChoiceRow
              testID="player-settings-row-skip-intro-length"
              title="Default skip intro length"
              options={SKIP_OPTIONS}
              value={skipIntroSeconds}
              onChange={(value) => update({ skipIntroSeconds: value })}
              description={`${skipIntroSeconds}s, where AniSkip has no timestamps`}
            />
          </NativeList>

          {!isTV && (
            <>
              <SectionTitle>Picture-in-picture</SectionTitle>
              <NativeList variant="flat">
                <NativeList.Item
                  testID="player-settings-row-pip-button"
                  title="Picture-in-picture button"
                  description="In the player's controls"
                  toggle={{ value: pipButton, onValueChange: (value) => update({ pipButton: value }) }}
                />
                <NativeList.Item
                  testID="player-settings-row-auto-pip"
                  title="Switch to picture-in-picture on leaving"
                  description="When you leave the player while it's playing"
                  toggle={{ value: autoPip, onValueChange: (value) => update({ autoPip: value }) }}
                />
              </NativeList>

              <SectionTitle>Gestures</SectionTitle>
              <NativeList variant="flat">
                <NativeList.Item
                  testID="player-settings-row-double-tap-seek"
                  title="Double tap to seek"
                  description="Double tap the left or right side to rewind or fast-forward"
                  toggle={{ value: doubleTapSeek, onValueChange: (value) => update({ doubleTapSeek: value }) }}
                />
              </NativeList>
            </>
          )}

          <SectionTitle>Subtitles</SectionTitle>
          <NativeList variant="flat">
            <ChoiceRow
              testID="player-settings-row-external-subtitles"
              title="External subtitles"
              options={LANGUAGE_OPTIONS}
              value={language ?? OFF}
              onChange={(value) => setLanguage(value === OFF ? null : value)}
              description={`OpenSubtitles tracks for movies and TV shows: ${choiceLabel(LANGUAGE_OPTIONS, language ?? OFF) ?? 'Off'}`}
            />
            <NativeList.Item
              testID="player-settings-row-subtitle-style"
              title={SETTINGS_SCREENS.subtitles.title}
              description={subtitleStyleSummary(subtitleStyle)}
              onPress={() => router.push(SETTINGS_SCREENS.subtitles.href)}
            />
          </NativeList>
        </ScrollView>
      </ChoiceRowHost>
    </ThemedView>
  );
};

export default Player;
