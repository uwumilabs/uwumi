import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { isTV } from '@/utils/tv';

export interface CardGridDimensions {
  numColumns: number;
  /** Each grid item's width, its padding included */
  itemWidth: number;
  /** The padding around each card */
  itemSpacing: number;
  horizontalPadding: number;
  verticalPadding: number;
  screenWidth: number;
  screenHeight: number;
}

export function useCardGridDimensions(): CardGridDimensions {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  return useMemo(() => {
    if (isTV) {
      const numColumns = 6;
      const horizontalPadding = 48;
      const itemSpacing = 10;
      const itemWidth = (screenWidth - horizontalPadding * 2) / numColumns;

      return {
        numColumns,
        itemWidth,
        itemSpacing,
        horizontalPadding,
        verticalPadding: 16,
        screenWidth,
        screenHeight,
      };
    }

    const numColumns = 3;
    const horizontalPadding = 8;
    const itemSpacing = 4;
    const itemWidth = (screenWidth - horizontalPadding * 2) / numColumns;

    return {
      numColumns,
      itemWidth,
      itemSpacing,
      horizontalPadding,
      verticalPadding: 4,
      screenWidth,
      screenHeight,
    };
  }, [screenWidth, screenHeight]);
}
