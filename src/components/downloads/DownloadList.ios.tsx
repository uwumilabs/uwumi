import React from 'react';
import { Button, HStack, Host, RNHostView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  accessibilityIdentifier,
  background,
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { createHostedIcon, INSET, listItems, RADIUS, withDividers } from '../native/list/shared';
import { ProgressLine } from '../native/progress/Progress';
import type { DownloadItemProps, DownloadListProps } from './shared';

export { LEADING_RADIUS } from './shared';

const HostedIcon = createHostedIcon(RNHostView);

const Item = ({ testID, overline, title, description, status, leading, progress, actions }: DownloadItemProps) => {
  const theme = useCurrentTheme();
  return (
    <HStack spacing={12} modifiers={[padding({ all: INSET }), ...(testID ? [accessibilityIdentifier(testID)] : [])]}>
      {leading ? <RNHostView matchContents>{leading}</RNHostView> : null}
      <VStack alignment="leading" spacing={3} modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
        {overline ? (
          <Text modifiers={[font({ size: 12 }), foregroundStyle(theme.muted), lineLimit(1)]}>{overline}</Text>
        ) : null}
        <Text modifiers={[font({ size: 16, weight: 'semibold' }), foregroundStyle(theme.foreground), lineLimit(1)]}>
          {title}
        </Text>
        {status || description ? (
          <HStack spacing={6}>
            {status ? <RNHostView matchContents>{status}</RNHostView> : null}
            {description ? (
              <Text modifiers={[font({ size: 13 }), foregroundStyle(theme.muted), lineLimit(1)]}>{description}</Text>
            ) : null}
          </HStack>
        ) : null}
        {progress?.indeterminate ? (
          <HStack spacing={8} modifiers={[padding({ top: 4 })]}>
            <ProgressLine indeterminate />
            <Text modifiers={[font({ size: 12 }), foregroundStyle(theme.foreground)]}>{progress.caption}</Text>
          </HStack>
        ) : progress ? (
          <VStack spacing={4} modifiers={[padding({ top: 4 }), frame({ maxWidth: Infinity })]}>
            <ProgressLine value={progress.value} />
            <HStack>
              <Text modifiers={[font({ size: 12 }), foregroundStyle(theme.foreground)]}>{progress.caption}</Text>
              <Spacer />
              {progress.detail ? (
                <Text modifiers={[font({ size: 12 }), foregroundStyle(theme.muted)]}>{progress.detail}</Text>
              ) : null}
            </HStack>
          </VStack>
        ) : null}
      </VStack>
      {actions.map((action) => (
        <Button
          key={action.testID}
          onPress={action.onPress}
          modifiers={[buttonStyle('plain'), accessibilityIdentifier(action.testID)]}>
          <HostedIcon name={action.icon} size={20} color={theme.foreground} label={action.label} />
        </Button>
      ))}
    </HStack>
  );
};

// ignoreSafeArea: in a ScrollView under the status bar, SwiftUI would push the rows down by the inset
const ListRoot = ({ children }: DownloadListProps) => {
  const { barBackground } = useCurrentTheme();
  const items = listItems(children);
  if (items.length === 0) return null;
  return (
    <Host matchContents={{ vertical: true }} ignoreSafeArea="container" style={{ width: '100%' }}>
      <VStack
        spacing={0}
        modifiers={[
          frame({ maxWidth: Infinity }),
          background(barBackground, shapes.roundedRectangle({ cornerRadius: RADIUS })),
        ]}>
        {withDividers(items)}
      </VStack>
    </Host>
  );
};

export const DownloadList = Object.assign(ListRoot, { Item });
