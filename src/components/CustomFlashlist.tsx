import React, { forwardRef } from 'react';
import { FlashList, FlashListProps, type FlashListRef } from '@shopify/flash-list';
import { NoResults } from './ui-primitives';
import { View } from 'react-native';

export const CustomFlashlist = forwardRef(<T,>(props: FlashListProps<T>, ref: React.Ref<FlashListRef<T>>) => {
  return (
    <View className="h-full">
      <FlashList
        ref={ref}
        ListEmptyComponent={<NoResults />}
        ListFooterComponent={<View className="mb-8" />}
        showsVerticalScrollIndicator={true}
        {...props}
      />
    </View>
  );
}) as <T>(props: FlashListProps<T> & { ref?: React.Ref<FlashListRef<T>> }) => React.ReactElement;

export default CustomFlashlist;
