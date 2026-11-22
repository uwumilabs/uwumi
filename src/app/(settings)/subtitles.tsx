import React from 'react';
import { ScrollView, View } from 'react-native';
import { CaptionsPreview, useVideoSelector } from 'react-native-video-toolkit';
import { Button } from '@/components/Button';
import { ChoiceRow, ChoiceRowHost } from '@/components/ChoiceRow';
import { List as NativeList } from '@/components/native/list/List';
import { SectionTitle, ThemedView } from '@/components/ui-primitives';
import {
  resetSubtitleStyle,
  useIsDefaultSubtitleStyle,
  useSubtitleSetting,
} from '@/hooks/stores/usePlayerSettingsStore';
import {
  SUBTITLE_STYLE_ROWS,
  SUBTITLE_STYLE_SECTIONS,
  subtitleChoice,
  type SubtitleStyleRow,
} from '@/utils/subtitleStyle';

const PREVIEW_RADIUS = 16;
const ASPECT_RATIO = 16 / 9;

// A frame half light and half dark, so the background and edge choices show what they do on either
const Preview = () => {
  const margin = useVideoSelector((state) => state.theme.captions.bottomMargin);
  // The width is set, not left to stretch: in a flex column, an aspect-ratio box can shrink by its height instead
  return (
    <View className="px-4 pb-2 pt-4">
      <View
        className="overflow-hidden"
        style={{ width: '100%', aspectRatio: ASPECT_RATIO, borderRadius: PREVIEW_RADIUS }}>
        <View className="absolute inset-0 flex-row">
          <View className="flex-1" style={{ backgroundColor: '#C9CED6' }} />
          <View className="flex-1" style={{ backgroundColor: '#1F232B' }} />
        </View>
        {/* The toolkit's margin is a share of the picture's height; percent padding is a share of the width */}
        <View className="flex-1 justify-end" style={{ paddingBottom: `${(margin * 100) / ASPECT_RATIO}%` }}>
          <CaptionsPreview testID="subtitle-style-preview" />
        </View>
      </View>
    </View>
  );
};

const StyleChoiceRow = ({ row }: { row: Extract<SubtitleStyleRow, { kind: 'choice' }> }) => {
  const [value, setValue] = useSubtitleSetting(row.key);
  return (
    <ChoiceRow
      testID={`subtitle-style-row-${row.id}`}
      title={row.title}
      options={row.options}
      value={subtitleChoice(row.key, value).value}
      onChange={setValue}
    />
  );
};

const StyleToggleRow = ({ row }: { row: Extract<SubtitleStyleRow, { kind: 'toggle' }> }) => {
  const [value, setValue] = useSubtitleSetting(row.key);
  return (
    <NativeList.Item
      testID={`subtitle-style-row-${row.id}`}
      title={row.title}
      toggle={{ value, onValueChange: setValue }}
    />
  );
};

const Subtitles = () => {
  const isDefault = useIsDefaultSubtitleStyle();

  return (
    <ThemedView testID="subtitle-style-screen">
      <Preview />
      <ChoiceRowHost>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {SUBTITLE_STYLE_SECTIONS.map((section) => (
            <React.Fragment key={section.key}>
              <SectionTitle>{section.title}</SectionTitle>
              <NativeList variant="flat">
                {SUBTITLE_STYLE_ROWS.filter((row) => row.section === section.key).map((row) =>
                  row.kind === 'choice' ? (
                    <StyleChoiceRow key={row.key} row={row} />
                  ) : (
                    <StyleToggleRow key={row.key} row={row} />
                  ),
                )}
              </NativeList>
            </React.Fragment>
          ))}

          <View className="mx-4 mt-6">
            <Button testID="subtitle-style-reset" variant="outline" isDisabled={isDefault} onPress={resetSubtitleStyle}>
              Reset to default
            </Button>
          </View>
        </ScrollView>
      </ChoiceRowHost>
    </ThemedView>
  );
};

export default Subtitles;
