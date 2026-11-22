import React from 'react';
import { HStack, RNHostView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { accessibilityIdentifier, font, foregroundStyle, frame, lineLimit, padding } from '@expo/ui/swift-ui/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { HostedIconButton } from '../native/card/HostedIconButton';
import { NativeCard } from '../native/card/NativeCard';
import { ProgressLine } from '../native/progress/Progress';
import { ROW, type DownloadItemProps, type DownloadListProps } from './shared';

const Item = ({ testID, overline, title, description, status, leading, progress, actions }: DownloadItemProps) => {
  const theme = useCurrentTheme();
  const caption = progress ? (
    <Text modifiers={[font({ size: ROW.captionSize }), foregroundStyle(theme.foreground), lineLimit(1)]}>
      {progress.caption}
    </Text>
  ) : null;
  return (
    <HStack spacing={ROW.gap} modifiers={[padding({ horizontal: ROW.paddingStart, vertical: ROW.paddingVertical })]}>
      {leading ? <RNHostView matchContents>{leading}</RNHostView> : null}
      {/* The row's id goes on its texts: on the HStack, SwiftUI would give it to the buttons too, over their own */}
      <VStack
        alignment="leading"
        spacing={ROW.textGap}
        modifiers={[
          frame({ maxWidth: Infinity, alignment: 'leading' }),
          ...(testID ? [accessibilityIdentifier(testID)] : []),
        ]}>
        {overline ? (
          <Text modifiers={[font({ size: ROW.overlineSize }), foregroundStyle(theme.muted), lineLimit(1)]}>
            {overline}
          </Text>
        ) : null}
        <Text
          modifiers={[
            font({ size: ROW.titleSize, weight: 'semibold' }),
            foregroundStyle(theme.foreground),
            lineLimit(1),
          ]}>
          {title}
        </Text>
        {status || description ? (
          <HStack spacing={ROW.statusGap}>
            {status ? <RNHostView matchContents>{status}</RNHostView> : null}
            {description ? (
              <Text modifiers={[font({ size: ROW.descriptionSize }), foregroundStyle(theme.muted), lineLimit(1)]}>
                {description}
              </Text>
            ) : null}
          </HStack>
        ) : null}
        {/* iOS's indeterminate progress is a spinner, which sits beside its caption rather than above it */}
        {progress?.indeterminate ? (
          <HStack spacing={8} modifiers={[padding({ top: ROW.progressGap })]}>
            <ProgressLine indeterminate />
            {caption}
          </HStack>
        ) : progress ? (
          <VStack
            spacing={ROW.progressGap}
            modifiers={[padding({ top: ROW.progressGap }), frame({ maxWidth: Infinity })]}>
            <ProgressLine value={progress.value} />
            <HStack>
              {caption}
              <Spacer />
              {progress.detail ? (
                <Text modifiers={[font({ size: ROW.captionSize }), foregroundStyle(theme.muted), lineLimit(1)]}>
                  {progress.detail}
                </Text>
              ) : null}
            </HStack>
          </VStack>
        ) : null}
      </VStack>
      {actions.map((action) => (
        <HostedIconButton key={action.testID} {...action} size={ROW.iconSize} />
      ))}
    </HStack>
  );
};

export const DownloadList = Object.assign(({ children }: DownloadListProps) => <NativeCard>{children}</NativeCard>, {
  Item,
});
