import React from 'react';
import { ScrollView } from 'react-native';
import type { ChoiceOption } from '@/components/ChoiceDialog';
import { ChoiceRow, ChoiceRowHost } from '@/components/ChoiceRow';
import { List as NativeList } from '@/components/native/list/List';
import { SectionTitle, ThemedView } from '@/components/ui-primitives';
import { isTV } from '@/utils/tv';
import {
  type InvertTapZones,
  type ReaderBackground,
  type ReadingMode,
  type TapZonesLayout,
  READING_MODES,
  useReaderSettingsStore,
} from '@/hooks/stores/useReaderSettingsStore';

const READING_MODE_OPTIONS = Object.entries(READING_MODES).map(([value, { label }]) => ({
  label,
  value: value as ReadingMode,
}));
const BACKGROUND_OPTIONS: ChoiceOption<ReaderBackground>[] = [
  { label: 'App theme', value: 'theme' },
  { label: 'Black', value: 'black' },
  { label: 'Gray', value: 'gray' },
  { label: 'White', value: 'white' },
];
const PADDING_OPTIONS = [0, 5, 10, 15, 20, 25].map((value) => ({ label: `${value}%`, value }));
const TAP_ZONE_OPTIONS: ChoiceOption<TapZonesLayout>[] = [
  { label: 'L shaped', value: 'l-shaped' },
  { label: 'Kindle-ish', value: 'kindlish' },
  { label: 'Edge', value: 'edge' },
  { label: 'Right and left', value: 'right-left' },
  { label: 'Disabled', value: 'disabled' },
];
const INVERT_OPTIONS: ChoiceOption<InvertTapZones>[] = [
  { label: 'None', value: 'none' },
  { label: 'Horizontal', value: 'horizontal' },
  { label: 'Vertical', value: 'vertical' },
  { label: 'Both', value: 'both' },
];

const Reader = () => {
  const readingMode = useReaderSettingsStore((state) => state.readingMode);
  const background = useReaderSettingsStore((state) => state.background);
  const keepScreenOn = useReaderSettingsStore((state) => state.keepScreenOn);
  const showPageNumber = useReaderSettingsStore((state) => state.showPageNumber);
  const sidePadding = useReaderSettingsStore((state) => state.sidePadding);
  const tapZones = useReaderSettingsStore((state) => state.tapZones);
  const invertTapZones = useReaderSettingsStore((state) => state.invertTapZones);
  const showTapZonesOverlay = useReaderSettingsStore((state) => state.showTapZonesOverlay);
  const update = useReaderSettingsStore((state) => state.update);

  return (
    <ThemedView testID="reader-settings-screen">
      <ChoiceRowHost>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <SectionTitle>General</SectionTitle>
          <NativeList variant="flat">
            <ChoiceRow
              testID="reader-settings-row-reading-mode"
              title="Default reading mode"
              options={READING_MODE_OPTIONS}
              value={readingMode}
              onChange={(value) => update({ readingMode: value })}
            />
          </NativeList>

          <SectionTitle>Display</SectionTitle>
          <NativeList variant="flat">
            <ChoiceRow
              testID="reader-settings-row-background"
              title="Background color"
              options={BACKGROUND_OPTIONS}
              value={background}
              onChange={(value) => update({ background: value })}
            />
            <NativeList.Item
              testID="reader-settings-row-keep-screen-on"
              title="Keep screen on"
              toggle={{ value: keepScreenOn, onValueChange: (value) => update({ keepScreenOn: value }) }}
            />
            <NativeList.Item
              testID="reader-settings-row-page-number"
              title="Show page number"
              toggle={{ value: showPageNumber, onValueChange: (value) => update({ showPageNumber: value }) }}
            />
          </NativeList>

          {/* TV pages take the D-pad's focus and have no tap zones */}
          {!isTV && (
            <>
              <SectionTitle>Tap zones</SectionTitle>
              <NativeList variant="flat">
                <ChoiceRow
                  testID="reader-settings-row-tap-zones"
                  title="Tap zones"
                  options={TAP_ZONE_OPTIONS}
                  value={tapZones}
                  onChange={(value) => update({ tapZones: value })}
                />
                <ChoiceRow
                  testID="reader-settings-row-invert-tap-zones"
                  title="Invert tap zones"
                  options={INVERT_OPTIONS}
                  value={invertTapZones}
                  onChange={(value) => update({ invertTapZones: value })}
                  disabled={tapZones === 'disabled'}
                />
                <NativeList.Item
                  testID="reader-settings-row-tap-zones-overlay"
                  title="Show tap zones overlay"
                  description="Briefly show when the reader opens"
                  toggle={{
                    value: showTapZonesOverlay,
                    onValueChange: (value) => update({ showTapZonesOverlay: value }),
                  }}
                />
              </NativeList>
            </>
          )}

          <SectionTitle>Long strip</SectionTitle>
          <NativeList variant="flat">
            <ChoiceRow
              testID="reader-settings-row-side-padding"
              title="Side padding"
              options={PADDING_OPTIONS}
              value={sidePadding}
              onChange={(value) => update({ sidePadding: value })}
              description={`${sidePadding}%`}
              disabled={READING_MODES[readingMode].paged}
            />
          </NativeList>
        </ScrollView>
      </ChoiceRowHost>
    </ThemedView>
  );
};

export default Reader;
