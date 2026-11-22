import React from 'react';
import { Column, RNHostView, Row, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, testID as testTag, weight } from '@expo/ui/jetpack-compose/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { HostedIconButton } from '../native/card/HostedIconButton';
import { NativeCard } from '../native/card/NativeCard';
import { ProgressLine } from '../native/progress/Progress';
import { ROW, type DownloadItemProps, type DownloadListProps } from './shared';

// IconButton's 48dp touch target already pads its icon, so the row's end needs little more
const END_PADDING = 4;

// Plain Row/Column, not Material's ListItem: ListItem measures its supporting slot more than once, and an
// RNHostView there (the status Chip) re-reports its layout on every pass, which loops forever (ANR)
const Item = ({ testID, overline, title, description, status, leading, progress, actions }: DownloadItemProps) => {
  const theme = useCurrentTheme();
  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement={{ spacedBy: ROW.gap }}
      modifiers={[
        fillMaxWidth(),
        padding(ROW.paddingStart, ROW.paddingVertical, END_PADDING, ROW.paddingVertical),
        ...(testID ? [testTag(testID)] : []),
      ]}>
      {leading ? <RNHostView matchContents>{leading}</RNHostView> : null}
      <Column verticalArrangement={{ spacedBy: ROW.textGap }} modifiers={[weight(1)]}>
        {overline ? (
          <Text color={theme.muted} maxLines={1} overflow="ellipsis" style={{ fontSize: ROW.overlineSize }}>
            {overline}
          </Text>
        ) : null}
        <Text
          color={theme.foreground}
          maxLines={1}
          overflow="ellipsis"
          style={{ fontSize: ROW.titleSize, fontWeight: '600' }}>
          {title}
        </Text>
        {status || description ? (
          <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: ROW.statusGap }}>
            {status ? <RNHostView matchContents>{status}</RNHostView> : null}
            {description ? (
              <Text color={theme.muted} maxLines={1} overflow="ellipsis" style={{ fontSize: ROW.descriptionSize }}>
                {description}
              </Text>
            ) : null}
          </Row>
        ) : null}
        {progress ? (
          <Column
            verticalArrangement={{ spacedBy: ROW.progressGap }}
            modifiers={[fillMaxWidth(), padding(0, ROW.progressGap, 0, 0)]}>
            <ProgressLine value={progress.value} indeterminate={progress.indeterminate} />
            <Row horizontalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
              <Text
                color={theme.foreground}
                maxLines={1}
                overflow="ellipsis"
                style={{ fontSize: ROW.captionSize }}
                modifiers={[weight(1)]}>
                {progress.caption}
              </Text>
              {progress.detail ? (
                <Text color={theme.muted} maxLines={1} style={{ fontSize: ROW.captionSize }}>
                  {progress.detail}
                </Text>
              ) : null}
            </Row>
          </Column>
        ) : null}
      </Column>
      <Row verticalAlignment="center">
        {actions.map((action) => (
          <HostedIconButton key={action.testID} {...action} size={ROW.iconSize} />
        ))}
      </Row>
    </Row>
  );
};

export const DownloadList = Object.assign(({ children }: DownloadListProps) => <NativeCard>{children}</NativeCard>, {
  Item,
});
