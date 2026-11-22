import React from 'react';
import { ScrollView } from 'react-native';
import { Menu, useMenuContext } from 'react-native-video-toolkit';
import type { ServerFailure } from '@/hooks/useServerRotation';
import { MenuRow, menuListStyle } from './MenuRow';
import { serverLabel } from './ServerStatus';

const SERVERS_VIEW = 'servers';

export const ServerMenuItem = ({ current }: { current?: string }) => (
  <MenuRow
    testID="video-settings-server"
    navigateTo={SERVERS_VIEW}
    title="Server"
    viewTitle="Servers"
    value={current ?? 'None'}
    icon="server-outline"
  />
);

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
      <ScrollView style={menuListStyle}>
        {servers.map((name) => (
          <Menu.CheckboxItem
            key={name}
            testID="video-settings-server-option"
            checked={name === current}
            onCheckedChange={() => {
              if (name === current) return;
              // The player remounts for the new server, so close the menu first
              closeSettings();
              onPick(name);
            }}>
            {serverLabel(name, failed[name])}
          </Menu.CheckboxItem>
        ))}
      </ScrollView>
    </Menu.SubContent>
  );
};
