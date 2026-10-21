import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Menu, Subtitle, Title, useMenuContext, useVideoSelector } from 'react-native-video-toolkit';
import { IoniconsIcon } from '@/components';
import type { ServerFailure } from '@/hooks';
import { FAILURE_LABELS } from './ServerStatus';

// The menu header shows a view's id, capitalized
const SERVERS_VIEW = 'servers';

/** The settings menu's "Server" row, above Audio. */
export const ServerMenuItem = ({ current }: { current?: string }) => {
  const color = useVideoSelector((state) => state.theme.colors.menuText);
  const size = useVideoSelector((state) => state.theme.iconSizes.sm);

  return (
    <Menu.Item navigateTo={SERVERS_VIEW}>
      <View style={[styles.row, styles.spread]}>
        <View style={[styles.row, styles.label]}>
          <IoniconsIcon name="server-outline" size={size} color={color} />
          <Title text="Server" />
        </View>
        <Subtitle text={current ?? 'None'} />
      </View>
    </Menu.Item>
  );
};

export const ServerMenuView = ({
  servers,
  current,
  failed,
  onPick,
}: {
  servers: string[];
  current?: string;
  failed: Record<string, ServerFailure>;
  onPick: (name: string) => void;
}) => {
  const { closeSettings } = useMenuContext();

  return (
    <Menu.SubContent viewId={SERVERS_VIEW}>
      <ScrollView style={styles.list}>
        {servers.map((name) => (
          <Menu.CheckboxItem
            key={name}
            checked={name === current}
            onCheckedChange={() => {
              if (name === current) return;
              // The player remounts for the new server, so close the menu first
              closeSettings();
              onPick(name);
            }}>
            {failed[name] ? `${name} · ${FAILURE_LABELS[failed[name]]}` : name}
          </Menu.CheckboxItem>
        ))}
      </ScrollView>
    </Menu.SubContent>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  spread: { justifyContent: 'space-between' },
  label: { gap: 12 },
  list: { maxHeight: '100%' },
});
