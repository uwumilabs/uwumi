import React, { forwardRef } from 'react';
import { FlashList, FlashListProps, type FlashListRef } from '@shopify/flash-list';
import { NoResults } from './ui-primitives';
import { View } from 'react-native';
import { isTV } from '@/constants/utils';

export const CustomFlashlist = forwardRef(<T,>(props: FlashListProps<T>, ref: React.Ref<FlashListRef<T>>) => {
  const hasData = props.data && props.data.length > 0;
  return (
    <View className="h-full">
      <FlashList
        ref={ref}
        ListEmptyComponent={<NoResults />}
        ListFooterComponent={<View className="mb-32" />}
        showsVerticalScrollIndicator={true}
        {...props}
        numColumns={hasData ? props.numColumns : 1}
        removeClippedSubviews={isTV ? false : undefined}
      />
    </View>
  );
}) as <T>(props: FlashListProps<T> & { ref?: React.Ref<FlashListRef<T>> }) => React.ReactElement;

export default CustomFlashlist;
