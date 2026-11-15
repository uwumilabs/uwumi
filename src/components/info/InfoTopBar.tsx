import React from 'react';
import { Stack } from 'expo-router';
import type { SharedValue } from 'react-native-reanimated';
import { useInfoParams } from '@/utils/routes';
import { useShownTitle } from '@/hooks/queries/infoQueries';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import { shareMedia } from '@/utils/share';
import { useFavoriteToggle } from './useFavoriteToggle';

export interface InfoTopBarProps {
  /** The page's scroll offset */
  scrollY: SharedValue<number>;
  /** The page, which scrolls under the bar */
  children: React.ReactNode;
}

/** iOS: share and favorite in the native header, which draws its own scroll edge effect */
export const InfoTopBar = ({ children }: InfoTopBarProps) => {
  const { mediaType, id, type } = useInfoParams();
  const { title } = useShownTitle();
  const currentTheme = useCurrentTheme();
  const { isFavorited, toggleFavorite, label } = useFavoriteToggle();

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="square.and.arrow.up"
          accessibilityLabel="Share"
          onPress={() => shareMedia({ mediaType, id, type, title })}
        />
        <Stack.Toolbar.Button
          icon={isFavorited ? 'heart.fill' : 'heart'}
          tintColor={isFavorited ? currentTheme.default : undefined}
          accessibilityLabel={label}
          onPress={toggleFavorite}
        />
      </Stack.Toolbar>
      {children}
    </>
  );
};
