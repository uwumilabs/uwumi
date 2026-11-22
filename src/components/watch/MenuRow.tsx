import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu, Subtitle, Title, useVideoSelector } from 'react-native-video-toolkit';
import { IoniconsIcon, type IoniconProps } from '@/components/Icons';

interface MenuRowProps {
  testID: string;
  /** The view it opens */
  navigateTo: string;
  title: string;
  /** The opened view's header; the row's title by default */
  viewTitle?: string;
  value: string;
  icon?: IoniconProps['name'];
}

/** A settings menu row that opens a view, drawn as the toolkit's own rows */
export const MenuRow = ({ testID, navigateTo, title, viewTitle = title, value, icon }: MenuRowProps) => {
  const color = useVideoSelector((state) => state.theme.colors.menuText);
  const iconSize = useVideoSelector((state) => state.theme.iconSizes.sm);
  return (
    <Menu.Item testID={testID} navigateTo={navigateTo} title={viewTitle}>
      <View style={[styles.row, styles.spread]}>
        <View style={[styles.row, styles.label]}>
          {icon && <IoniconsIcon name={icon} size={iconSize} color={color} />}
          <Title text={title} style={{ color }} />
        </View>
        <Subtitle text={value} style={{ color }} />
      </View>
    </Menu.Item>
  );
};

/** A view's ScrollView style, so a long list scrolls inside the menu */
export const menuListStyle = { maxHeight: '100%' } as const;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  spread: { justifyContent: 'space-between' },
  label: { gap: 12 },
});
