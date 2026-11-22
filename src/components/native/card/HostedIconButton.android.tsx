import React from 'react';
import { IconButton, RNHostView } from '@expo/ui/jetpack-compose';
import { testID as testTag } from '@expo/ui/jetpack-compose/modifiers';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { isTV } from '@/utils/tv';
import { Button } from '../../Button';
import { IoniconsIcon } from '../../Icons';
import { HostedIcon, type HostedIconButtonProps } from './card';

// Compose's buttons show TV focus only as a faint circle, so TV gets the app's Button with its focus ring
export const HostedIconButton = ({ icon, label, onPress, testID, size = 20 }: HostedIconButtonProps) => {
  const { foreground } = useCurrentTheme();
  if (isTV) {
    return (
      <RNHostView matchContents>
        <Button testID={testID} isIconOnly variant="ghost" accessibilityLabel={label} onPress={onPress}>
          <IoniconsIcon name={icon} size={size} color={foreground} />
        </Button>
      </RNHostView>
    );
  }
  return (
    <IconButton onClick={onPress} modifiers={testID ? [testTag(testID)] : undefined}>
      <HostedIcon name={icon} size={size} color={foreground} label={label} />
    </IconButton>
  );
};
