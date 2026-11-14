import React, { forwardRef } from 'react';
import { FlashList, FlashListProps, type FlashListRef } from '@shopify/flash-list';
import { NoResults } from './ui-primitives';
import { View } from 'react-native';
import { isTV } from '@/utils/tv';

const ListView = <T,>(props: FlashListProps<T>, ref: React.Ref<FlashListRef<T>>) => {
  const hasData = props.data && props.data.length > 0;
  return (
    <View className="h-full">
      <FlashList
        ref={ref}
        ListEmptyComponent={<NoResults />}
        ListFooterComponent={<View className="mb-32" />}
        showsVerticalScrollIndicator={true}
        {...props}
        // A grid's empty state would get one column's width
        numColumns={hasData ? props.numColumns : 1}
        // The D-pad can't move focus to a view that's been detached off screen
        removeClippedSubviews={isTV ? false : undefined}
      />
    </View>
  );
};

export const List = forwardRef(ListView) as <T>(
  props: FlashListProps<T> & { ref?: React.Ref<FlashListRef<T>> },
) => React.ReactElement;
