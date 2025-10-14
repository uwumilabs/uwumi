import React, { forwardRef } from 'react';
import { FlashList, FlashListProps, type FlashListRef } from '@shopify/flash-list';
import { View } from 'tamagui';
import { NoResults } from './ui-primitives';

export const CustomFlashlist = forwardRef(<T,>(props: FlashListProps<T>, ref: React.Ref<FlashListRef<T>>) => {
  return (
    <View height="100%">
      <FlashList
        ref={ref}
        ListEmptyComponent={<NoResults />}
        ListFooterComponent={<View height={100} />}
        showsVerticalScrollIndicator={true}
        {...props}
      />
    </View>
  );
}) as <T>(props: FlashListProps<T> & { ref?: React.Ref<FlashListRef<T>> }) => React.ReactElement;

export default CustomFlashlist;
