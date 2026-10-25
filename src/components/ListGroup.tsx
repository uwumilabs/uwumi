import React, { forwardRef } from 'react';
import { ListGroup as HeroListGroup } from 'heroui-native';
import { isTV } from '@/constants/utils';
import TVFocusWrapper from './TVFocusWrapper';

type ItemProps = React.ComponentProps<typeof HeroListGroup.Item>;

// heroui's ListGroup.Item is a plain Pressable, which can't show the TV focus ring. On TV a wrapper takes the
// focus and the press instead, and rows with nothing to do aren't focus stops at all
const TVListGroupItem = forwardRef<React.ComponentRef<typeof HeroListGroup.Item>, ItemProps>(
  ({ onPress, disabled, ...props }, ref) => {
    const item = <HeroListGroup.Item ref={ref} {...props} disabled={disabled} focusable={false} />;
    if (!onPress || disabled) return item;
    return (
      <TVFocusWrapper onPress={onPress} focusScale={1}>
        {item}
      </TVFocusWrapper>
    );
  },
);
TVListGroupItem.displayName = 'ListGroup.Item';

const TVListGroupRoot = forwardRef<
  React.ComponentRef<typeof HeroListGroup>,
  React.ComponentProps<typeof HeroListGroup>
>((props, ref) => <HeroListGroup ref={ref} {...props} />);
TVListGroupRoot.displayName = 'ListGroup';

// Phones use heroui's ListGroup as is
export const ListGroup: typeof HeroListGroup = isTV
  ? (Object.assign(TVListGroupRoot, {
      Item: TVListGroupItem,
      ItemPrefix: HeroListGroup.ItemPrefix,
      ItemContent: HeroListGroup.ItemContent,
      ItemTitle: HeroListGroup.ItemTitle,
      ItemDescription: HeroListGroup.ItemDescription,
      ItemSuffix: HeroListGroup.ItemSuffix,
    }) as unknown as typeof HeroListGroup)
  : HeroListGroup;
