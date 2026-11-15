import React from 'react';
import { Stack } from 'expo-router';
import { useInfoActions } from './useInfoActions';
import type { InfoTopBarProps } from './InfoTopBar';

/** Share and favorite in the native header, which draws its own scroll edge effect */
export const InfoTopBar = ({ children }: InfoTopBarProps) => {
  const { share, favorite } = useInfoActions();

  return (
    <>
      <Stack.Toolbar placement="right">
        {share && (
          <Stack.Toolbar.Button icon="square.and.arrow.up" accessibilityLabel={share.label} onPress={share.onPress} />
        )}
        <Stack.Toolbar.Button
          icon={favorite.active ? 'heart.fill' : 'heart'}
          tintColor={favorite.tint}
          accessibilityLabel={favorite.label}
          onPress={favorite.onPress}
        />
      </Stack.Toolbar>
      {children}
    </>
  );
};
