/**
 * useCardGridDimensions - Computes all layout values for the card grid
 * based on current screen dimensions and TV vs mobile mode.
 *
 * Single source of truth for columns, item sizes, padding, and spacing.
 */

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { isTV } from '@/constants/utils';

export interface CardGridDimensions {
  /** Number of columns in the grid */
  numColumns: number;
  /** Width of each grid item (including its padding) */
  itemWidth: number;
  /** Inner padding around each card */
  itemSpacing: number;
  /** Horizontal padding on the list container */
  horizontalPadding: number;
  /** Vertical padding on the list container */
  verticalPadding: number;
  /** Current screen width */
  screenWidth: number;
  /** Current screen height */
  screenHeight: number;
  /** Aspect ratio string for cards */
  cardAspectRatio: string;
}

export function useCardGridDimensions(): CardGridDimensions {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  return useMemo(() => {
    if (isTV) {
      // TV: landscape widescreen — more columns, generous spacing
      const numColumns = 6;
      const horizontalPadding = 48;
      const itemSpacing = 10;
      const itemWidth = (screenWidth - horizontalPadding * 2) / numColumns;
      const cardAspectRatio = '2/3';

      return {
        numColumns,
        itemWidth,
        itemSpacing,
        horizontalPadding,
        verticalPadding: 16,
        screenWidth,
        screenHeight,
        cardAspectRatio,
      };
    }

    // Mobile: portrait — 3 columns, tight spacing
    const numColumns = 3;
    const horizontalPadding = 8;
    const itemSpacing = 4;
    const itemWidth = (screenWidth - horizontalPadding * 2) / numColumns;
    const cardAspectRatio = '2/3';

    return {
      numColumns,
      itemWidth,
      itemSpacing,
      horizontalPadding,
      verticalPadding: 4,
      screenWidth,
      screenHeight,
      cardAspectRatio,
    };
  }, [screenWidth, screenHeight]);
}
