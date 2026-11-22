import React from 'react';
import { Card, Column, Host, IconButton, RNHostView, Row, Text } from '@expo/ui/jetpack-compose';
import { clip, fillMaxWidth, padding, Shapes, testID as testTag, weight } from '@expo/ui/jetpack-compose/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { isTV } from '@/utils/tv';
import { Button } from '../Button';
import { IoniconsIcon } from '../Icons';
import { createHostedIcon, INSET, listItems, RADIUS, withDividers } from '../native/list/shared';
import { ProgressLine } from '../native/progress/Progress';
import type { DownloadAction, DownloadItemProps, DownloadListProps } from './shared';

export { LEADING_RADIUS } from './shared';

const HostedIcon = createHostedIcon(RNHostView);

// Compose's buttons show TV focus only as a faint circle, so TV gets the app's Button with its focus ring
const ActionButton = ({ testID, icon, label, onPress }: DownloadAction) => {
  const { foreground } = useCurrentTheme();
  if (isTV) {
    return (
      <RNHostView matchContents>
        <Button testID={testID} isIconOnly variant="ghost" accessibilityLabel={label} onPress={onPress}>
          <IoniconsIcon name={icon} size={22} color={foreground} />
        </Button>
      </RNHostView>
    );
  }
  return (
    <IconButton onClick={onPress} modifiers={[testTag(testID)]}>
      <HostedIcon name={icon} size={20} color={foreground} label={label} />
    </IconButton>
  );
};

// Plain Row/Column, not Material's ListItem: ListItem measures its supporting slot more than once, and an
// RNHostView there (the status Chip) re-reports its layout on every pass, which loops forever (ANR)
const Item = ({ testID, overline, title, description, status, leading, progress, actions }: DownloadItemProps) => {
  const theme = useCurrentTheme();
  return (
    <Row
      verticalAlignment="center"
      horizontalArrangement={{ spacedBy: 12 }}
      modifiers={[fillMaxWidth(), padding(INSET, 12, 4, 12), ...(testID ? [testTag(testID)] : [])]}>
      {leading ? <RNHostView matchContents>{leading}</RNHostView> : null}
      <Column verticalArrangement={{ spacedBy: 3 }} modifiers={[weight(1)]}>
        {overline ? (
          <Text color={theme.muted} maxLines={1} overflow="ellipsis" style={{ fontSize: 12 }}>
            {overline}
          </Text>
        ) : null}
        <Text color={theme.foreground} maxLines={1} overflow="ellipsis" style={{ fontSize: 16, fontWeight: '600' }}>
          {title}
        </Text>
        {status || description ? (
          <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 6 }}>
            {status ? <RNHostView matchContents>{status}</RNHostView> : null}
            {description ? (
              <Text color={theme.muted} maxLines={1} overflow="ellipsis" style={{ fontSize: 13 }}>
                {description}
              </Text>
            ) : null}
          </Row>
        ) : null}
        {progress ? (
          <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth(), padding(0, 4, 0, 0)]}>
            <ProgressLine value={progress.value} indeterminate={progress.indeterminate} />
            <Row horizontalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
              <Text
                color={theme.foreground}
                maxLines={1}
                overflow="ellipsis"
                style={{ fontSize: 12 }}
                modifiers={[weight(1)]}>
                {progress.caption}
              </Text>
              {progress.detail ? (
                <Text color={theme.muted} maxLines={1} style={{ fontSize: 12 }}>
                  {progress.detail}
                </Text>
              ) : null}
            </Row>
          </Column>
        ) : null}
      </Column>
      {actions.length > 0 ? (
        <Row verticalAlignment="center">
          {actions.map((action) => (
            <ActionButton key={action.testID} {...action} />
          ))}
        </Row>
      ) : null}
    </Row>
  );
};

const ListRoot = ({ children }: DownloadListProps) => {
  const { barBackground } = useCurrentTheme();
  const items = listItems(children);
  if (items.length === 0) return null;
  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <Card colors={{ containerColor: barBackground }} modifiers={[fillMaxWidth(), clip(Shapes.RoundedCorner(RADIUS))]}>
        <Column modifiers={[fillMaxWidth()]}>{withDividers(items)}</Column>
      </Card>
    </Host>
  );
};

export const DownloadList = Object.assign(ListRoot, { Item });
