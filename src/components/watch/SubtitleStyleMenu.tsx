import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Menu, Subtitle, Title, useVideoSelector } from 'react-native-video-toolkit';
import { useShallow } from 'zustand/react/shallow';
import { IoniconsIcon } from '@/components/Icons';
import { usePlayerSettingsStore } from '@/hooks/stores/usePlayerSettingsStore';
import {
  DEFAULT_SUBTITLE_STYLE,
  pickSubtitleStyle,
  SUBTITLE_STYLE,
  SUBTITLE_STYLE_KEYS,
  subtitleStyleOption,
  subtitleStyleSummary,
  type SubtitleStyleKey,
} from '@/utils/subtitleStyle';

const STYLE_VIEW = 'subtitle-style';
const settingView = (setting: SubtitleStyleKey) => `${STYLE_VIEW}-${setting}`;

/** The Captions view's "Subtitle style" row, under the tracks */
export const SubtitleStyleItem = () => {
  const color = useVideoSelector((state) => state.theme.colors.menuText);
  const size = useVideoSelector((state) => state.theme.iconSizes.sm);
  const style = usePlayerSettingsStore(useShallow(pickSubtitleStyle));

  return (
    <Menu.Item testID="video-settings-subtitle-style" navigateTo={STYLE_VIEW} title="Subtitle style">
      <View style={[styles.row, styles.spread]}>
        <View style={[styles.row, styles.label]}>
          <IoniconsIcon name="text-outline" size={size} color={color} />
          <Title text="Subtitle style" />
        </View>
        <Subtitle text={subtitleStyleSummary(style)} />
      </View>
    </Menu.Item>
  );
};

const SettingItem = ({ setting }: { setting: SubtitleStyleKey }) => {
  const value = usePlayerSettingsStore((state) => state[setting]);
  const { title } = SUBTITLE_STYLE[setting];
  return (
    <Menu.Item testID="video-settings-subtitle-style-setting" navigateTo={settingView(setting)} title={title}>
      <View style={[styles.row, styles.spread]}>
        <Title text={title} />
        <Subtitle text={subtitleStyleOption(setting, value).label} />
      </View>
    </Menu.Item>
  );
};

const SettingView = ({ setting }: { setting: SubtitleStyleKey }) => {
  const value = usePlayerSettingsStore((state) => state[setting]);
  const update = usePlayerSettingsStore((state) => state.update);
  const selected = subtitleStyleOption(setting, value).value;
  return (
    <Menu.SubContent viewId={settingView(setting)}>
      <ScrollView style={styles.list}>
        {SUBTITLE_STYLE[setting].options.map((option) => (
          <Menu.RadioItem
            key={option.value}
            testID="video-settings-subtitle-style-option"
            selected={option.value === selected}
            onSelect={() => update({ [setting]: option.value })}>
            {option.label}
          </Menu.RadioItem>
        ))}
      </ScrollView>
    </Menu.SubContent>
  );
};

/** The style's views: each setting, Bold, All caps and Reset; picks restyle the subtitles behind the menu */
export const SubtitleStyleViews = () => {
  const bold = usePlayerSettingsStore((state) => state.subtitleBold);
  const caps = usePlayerSettingsStore((state) => state.subtitleCaps);
  const update = usePlayerSettingsStore((state) => state.update);

  return (
    <>
      <Menu.SubContent viewId={STYLE_VIEW}>
        <ScrollView style={styles.list}>
          {SUBTITLE_STYLE_KEYS.map((setting) => (
            <SettingItem key={setting} setting={setting} />
          ))}
          <Menu.CheckboxItem
            testID="video-settings-subtitle-style-bold"
            checked={bold}
            onCheckedChange={(checked) => update({ subtitleBold: checked })}>
            Bold
          </Menu.CheckboxItem>
          <Menu.CheckboxItem
            testID="video-settings-subtitle-style-caps"
            checked={caps}
            onCheckedChange={(checked) => update({ subtitleCaps: checked })}>
            All caps
          </Menu.CheckboxItem>
          <Menu.Item
            testID="video-settings-subtitle-style-reset"
            autoClose={false}
            onPress={() => update(DEFAULT_SUBTITLE_STYLE)}>
            Reset to default
          </Menu.Item>
        </ScrollView>
      </Menu.SubContent>
      {SUBTITLE_STYLE_KEYS.map((setting) => (
        <SettingView key={setting} setting={setting} />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  spread: { justifyContent: 'space-between' },
  label: { gap: 12 },
  list: { maxHeight: '100%' },
});
