import React from 'react';
import { ScrollView, View } from 'react-native';
import { CaptionsPreview } from 'react-native-video-toolkit';
import { Button } from '@/components/Button';
import { ChoiceRow, ChoiceRowHost } from '@/components/ChoiceRow';
import { List as NativeList } from '@/components/native/list/List';
import { SectionTitle, ThemedView } from '@/components/ui-primitives';
import { usePlayerSettingsStore } from '@/hooks/stores/usePlayerSettingsStore';
import {
  DEFAULT_SUBTITLE_STYLE,
  isDefaultSubtitleStyle,
  pickSubtitleStyle,
  SUBTITLE_STYLE,
  subtitleStyleOption,
  type SubtitleStyleKey,
} from '@/utils/subtitleStyle';

const PREVIEW_RADIUS = 16;

// A frame half light and half dark, so the background and edge choices show what they do on either
const Preview = () => {
  const margin = usePlayerSettingsStore(
    (state) => subtitleStyleOption('subtitleMargin', state.subtitleMargin).theme.bottomMargin ?? 0,
  );
  // The width is set, not left to stretch: in a flex column, an aspect-ratio box can shrink by its height instead
  return (
    <View className="px-4 pb-2 pt-4">
      <View className="overflow-hidden" style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: PREVIEW_RADIUS }}>
        <View className="absolute inset-0 flex-row">
          <View className="flex-1" style={{ backgroundColor: '#C9CED6' }} />
          <View className="flex-1" style={{ backgroundColor: '#1F232B' }} />
        </View>
        {/* Percent padding is of the width, and the height is 9/16 of it */}
        <View className="flex-1 justify-end" style={{ paddingBottom: `${margin * 56.25}%` }}>
          <CaptionsPreview testID="subtitle-style-preview" />
        </View>
      </View>
    </View>
  );
};

const StyleRow = ({ setting }: { setting: SubtitleStyleKey }) => {
  const value = usePlayerSettingsStore((state) => state[setting]);
  const update = usePlayerSettingsStore((state) => state.update);
  const option = subtitleStyleOption(setting, value);
  return (
    <ChoiceRow
      testID={`subtitle-style-row-${setting.replace('subtitle', '').toLowerCase()}`}
      title={SUBTITLE_STYLE[setting].title}
      options={SUBTITLE_STYLE[setting].options}
      value={option.value}
      onChange={(next) => update({ [setting]: next })}
      description={option.label}
    />
  );
};

const Subtitles = () => {
  const bold = usePlayerSettingsStore((state) => state.subtitleBold);
  const caps = usePlayerSettingsStore((state) => state.subtitleCaps);
  const isDefault = usePlayerSettingsStore((state) => isDefaultSubtitleStyle(pickSubtitleStyle(state)));
  const update = usePlayerSettingsStore((state) => state.update);

  return (
    <ThemedView testID="subtitle-style-screen">
      <Preview />
      <ChoiceRowHost>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <SectionTitle>Text</SectionTitle>
          <NativeList variant="flat">
            <StyleRow setting="subtitleSize" />
            <StyleRow setting="subtitleFont" />
            <StyleRow setting="subtitleColor" />
            <NativeList.Item
              testID="subtitle-style-row-bold"
              title="Bold"
              toggle={{ value: bold, onValueChange: (value) => update({ subtitleBold: value }) }}
            />
            <NativeList.Item
              testID="subtitle-style-row-caps"
              title="All caps"
              toggle={{ value: caps, onValueChange: (value) => update({ subtitleCaps: value }) }}
            />
          </NativeList>

          <SectionTitle>Background</SectionTitle>
          <NativeList variant="flat">
            <StyleRow setting="subtitleBackground" />
            <StyleRow setting="subtitleEdge" />
          </NativeList>

          <SectionTitle>Position</SectionTitle>
          <NativeList variant="flat">
            <StyleRow setting="subtitlePosition" />
            <StyleRow setting="subtitleMargin" />
          </NativeList>

          <View className="mx-4 mt-6">
            <Button
              testID="subtitle-style-reset"
              variant="outline"
              isDisabled={isDefault}
              onPress={() => update(DEFAULT_SUBTITLE_STYLE)}>
              Reset to default
            </Button>
          </View>
        </ScrollView>
      </ChoiceRowHost>
    </ThemedView>
  );
};

export default Subtitles;
