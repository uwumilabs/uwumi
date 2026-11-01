import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { ChoiceDialog, choiceLabel, type ChoiceOption, NativeList, SectionTitle, ThemedView } from '@/components';
import {
  type InvertTapZones,
  type ReaderBackground,
  type ReadingMode,
  type TapZonesLayout,
  useReaderSettingsStore,
} from '@/hooks';

const READING_MODE_OPTIONS: ChoiceOption<ReadingMode>[] = [
  { label: 'Paged (left to right)', value: 'paged-ltr' },
  { label: 'Paged (right to left)', value: 'paged-rtl' },
  { label: 'Paged (vertical)', value: 'paged-vertical' },
  { label: 'Long strip', value: 'long-strip' },
  { label: 'Long strip with gaps', value: 'long-strip-gaps' },
];
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
  const settings = useReaderSettingsStore();
  const update = settings.update;
  const [open, setOpen] = useState<'readingMode' | 'background' | 'padding' | 'tapZones' | 'invert' | null>(null);

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <SectionTitle>General</SectionTitle>
        <NativeList variant="flat">
          <NativeList.Item
            title="Default reading mode"
            description={choiceLabel(READING_MODE_OPTIONS, settings.readingMode)}
            onPress={() => setOpen('readingMode')}
          />
        </NativeList>

        <SectionTitle>Display</SectionTitle>
        <NativeList variant="flat">
          <NativeList.Item
            title="Background color"
            description={choiceLabel(BACKGROUND_OPTIONS, settings.background)}
            onPress={() => setOpen('background')}
          />
          <NativeList.Item
            title="Keep screen on"
            toggle={{ value: settings.keepScreenOn, onValueChange: (keepScreenOn) => update({ keepScreenOn }) }}
          />
          <NativeList.Item
            title="Show page number"
            toggle={{ value: settings.showPageNumber, onValueChange: (showPageNumber) => update({ showPageNumber }) }}
          />
        </NativeList>

        <SectionTitle>Tap zones</SectionTitle>
        <NativeList variant="flat">
          <NativeList.Item
            title="Tap zones"
            description={choiceLabel(TAP_ZONE_OPTIONS, settings.tapZones)}
            onPress={() => setOpen('tapZones')}
          />
          <NativeList.Item
            title="Invert tap zones"
            description={choiceLabel(INVERT_OPTIONS, settings.invertTapZones)}
            disabled={settings.tapZones === 'disabled'}
            onPress={() => setOpen('invert')}
          />
          <NativeList.Item
            title="Show tap zones overlay"
            description="Briefly show when the reader opens"
            toggle={{
              value: settings.showTapZonesOverlay,
              onValueChange: (showTapZonesOverlay) => update({ showTapZonesOverlay }),
            }}
          />
        </NativeList>

        <SectionTitle>Long strip</SectionTitle>
        <NativeList variant="flat">
          <NativeList.Item
            title="Side padding"
            disabled={settings.readingMode.startsWith('paged')}
            description={`${settings.sidePadding}%`}
            onPress={() => setOpen('padding')}
          />
        </NativeList>
      </ScrollView>

      <ChoiceDialog
        open={open === 'readingMode'}
        onOpenChange={(isOpen) => !isOpen && setOpen(null)}
        title="Default reading mode"
        options={READING_MODE_OPTIONS}
        value={settings.readingMode}
        onChange={(readingMode) => update({ readingMode })}
      />
      <ChoiceDialog
        open={open === 'background'}
        onOpenChange={(isOpen) => !isOpen && setOpen(null)}
        title="Background color"
        options={BACKGROUND_OPTIONS}
        value={settings.background}
        onChange={(background) => update({ background })}
      />
      <ChoiceDialog
        open={open === 'tapZones'}
        onOpenChange={(isOpen) => !isOpen && setOpen(null)}
        title="Tap zones"
        options={TAP_ZONE_OPTIONS}
        value={settings.tapZones}
        onChange={(tapZones) => update({ tapZones })}
      />
      <ChoiceDialog
        open={open === 'invert'}
        onOpenChange={(isOpen) => !isOpen && setOpen(null)}
        title="Invert tap zones"
        options={INVERT_OPTIONS}
        value={settings.invertTapZones}
        onChange={(invertTapZones) => update({ invertTapZones })}
      />
      <ChoiceDialog
        open={open === 'padding'}
        onOpenChange={(isOpen) => !isOpen && setOpen(null)}
        title="Side padding"
        options={PADDING_OPTIONS}
        value={settings.sidePadding}
        onChange={(sidePadding) => update({ sidePadding })}
      />
    </ThemedView>
  );
};

export default Reader;
