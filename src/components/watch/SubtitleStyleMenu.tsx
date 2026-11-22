import React from 'react';
import { ScrollView } from 'react-native';
import { Menu } from 'react-native-video-toolkit';
import {
  resetSubtitleStyle,
  useIsDefaultSubtitleStyle,
  useSubtitleSetting,
  useSubtitleStyle,
} from '@/hooks/stores/usePlayerSettingsStore';
import { SETTINGS_SCREENS } from '@/utils/routes';
import {
  SUBTITLE_STYLE_ROWS,
  subtitleChoice,
  subtitleStyleSummary,
  type SubtitleStyleRow,
} from '@/utils/subtitleStyle';
import { MenuRow, menuListStyle } from './MenuRow';

type ChoiceRow = Extract<SubtitleStyleRow, { kind: 'choice' }>;

const STYLE_VIEW = 'subtitle-style';
const choiceView = (row: ChoiceRow) => `${STYLE_VIEW}-${row.key}`;

export const SubtitleStyleItem = () => {
  const style = useSubtitleStyle();
  return (
    <MenuRow
      testID="video-settings-subtitle-style"
      navigateTo={STYLE_VIEW}
      title={SETTINGS_SCREENS.subtitles.title}
      value={subtitleStyleSummary(style)}
      icon="text-outline"
    />
  );
};

const ChoiceItem = ({ row }: { row: ChoiceRow }) => {
  const [value] = useSubtitleSetting(row.key);
  return (
    <MenuRow
      testID="video-settings-subtitle-style-setting"
      navigateTo={choiceView(row)}
      title={row.title}
      value={subtitleChoice(row.key, value).label}
    />
  );
};

const ToggleItem = ({ row }: { row: Extract<SubtitleStyleRow, { kind: 'toggle' }> }) => {
  const [checked, setChecked] = useSubtitleSetting(row.key);
  return (
    <Menu.CheckboxItem
      testID={`video-settings-subtitle-style-${row.id}`}
      checked={checked}
      onCheckedChange={setChecked}>
      {row.title}
    </Menu.CheckboxItem>
  );
};

const ChoiceView = ({ row }: { row: ChoiceRow }) => {
  const [value, setValue] = useSubtitleSetting(row.key);
  const selected = subtitleChoice(row.key, value).value;
  return (
    <Menu.SubContent viewId={choiceView(row)}>
      <ScrollView style={menuListStyle}>
        {row.options.map((option) => (
          <Menu.RadioItem
            key={option.value}
            testID="video-settings-subtitle-style-option"
            selected={option.value === selected}
            onSelect={() => setValue(option.value)}>
            {option.label}
          </Menu.RadioItem>
        ))}
      </ScrollView>
    </Menu.SubContent>
  );
};

/** Picks restyle the subtitles behind the menu */
export const SubtitleStyleViews = () => {
  const isDefault = useIsDefaultSubtitleStyle();

  return (
    <>
      <Menu.SubContent viewId={STYLE_VIEW}>
        <ScrollView style={menuListStyle}>
          {SUBTITLE_STYLE_ROWS.map((row) =>
            row.kind === 'choice' ? <ChoiceItem key={row.key} row={row} /> : <ToggleItem key={row.key} row={row} />,
          )}
          {!isDefault && (
            <Menu.Item testID="video-settings-subtitle-style-reset" autoClose={false} onPress={resetSubtitleStyle}>
              Reset to default
            </Menu.Item>
          )}
        </ScrollView>
      </Menu.SubContent>
      {SUBTITLE_STYLE_ROWS.map((row) => row.kind === 'choice' && <ChoiceView key={row.key} row={row} />)}
    </>
  );
};
