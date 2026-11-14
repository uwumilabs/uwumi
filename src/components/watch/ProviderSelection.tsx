import { View, Text, useWindowDimensions } from 'react-native';
import { useCurrentTheme } from '@/hooks/useCurrentTheme';
import React, { useState } from 'react';
import { Card, cn } from '@/components/heroui';
import { Button } from '@/components/Button';
import { HUXStack } from '@/components/ui-primitives';
import { IoniconsIcon } from '@/components/Icons';
import { Dialog } from '@/components/native/dialog/Dialog';
import {
  useActiveProvider,
  useProviders,
  useProviderSelectionStore,
  useProviderStore,
} from '@/hooks/stores/useProviderStore';
import { MediaType } from '@/constants/types';

// Material 3 caps dialogs at 560dp
const DIALOG_MAX_WIDTH = 560;

/** A row of providers: anime has one for sub and one for dub, other media types one for all */
type ProviderRow = { key: string; label?: string; dub?: boolean };

const rowsFor = (mediaType: MediaType, isDubbed?: string): ProviderRow[] =>
  mediaType === MediaType.ANIME
    ? [
        { key: 'sub', label: 'Sub', dub: false },
        ...(isDubbed === 'true' ? [{ key: 'dub', label: 'Dub', dub: true }] : []),
      ]
    : [{ key: 'all' }];

const ProviderSelection = ({ mediaType, isDubbed }: { mediaType: MediaType; isDubbed?: string }) => {
  const [open, setOpen] = useState(false);
  const setProvider = useProviderStore((state) => state.setProvider);
  const dub = useProviderSelectionStore((state) => state.dub);
  const setDub = useProviderSelectionStore((state) => state.setDub);
  const currentProvider = useActiveProvider(mediaType);
  const providers = useProviders();
  const offers = (provider: (typeof providers)[MediaType][number], row: ProviderRow) =>
    row.dub === undefined || (row.dub ? provider.dubbed : provider.subbed);
  const pureBlackBackground = useCurrentTheme().isPureBlack;
  const { width: windowWidth } = useWindowDimensions();
  const selectedName = providers[mediaType]?.find(({ value }) => value === currentProvider)?.name;
  return (
    <View>
      <Button testID="provider-select-button" variant="secondary" onPress={() => setOpen(true)}>
        {selectedName ?? 'Provider Selection'}
      </Button>
      {/* The buttons' percent widths need a definite width; the dialog sizes itself to its content */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        contentContainerProps={{ style: { width: Math.min(windowWidth - 48, DIALOG_MAX_WIDTH) } }}>
        <View className={cn(pureBlackBackground && 'bg-black', 'w-full')}>
          <HUXStack className="items-center justify-between px-4 mb-2">
            <Text className="text-lg font-bold text-foreground">Provider Selection</Text>
            <Button testID="provider-select-close" isIconOnly variant="ghost" onPress={() => setOpen(false)}>
              <IoniconsIcon name="close" size={24} className="text-foreground" />
            </Button>
          </HUXStack>
          <Card className={cn(pureBlackBackground && 'bg-black')}>
            <Card.Body className="pt-2 px-0">
              {rowsFor(mediaType, isDubbed)
                .filter((row) => providers[mediaType].some((provider) => offers(provider, row)))
                .map((row) => (
                  <HUXStack key={row.key} className="items-center justify-between mb-2 px-4">
                    {row.label && <Text className="text-foreground font-bold w-12.5">{row.label}:</Text>}
                    <HUXStack className="flex-wrap flex-1 gap-1">
                      {providers[mediaType]
                        .filter((provider) => offers(provider, row))
                        .map(({ name, value }) => {
                          const isSelected = currentProvider === value && (row.dub === undefined || dub === row.dub);
                          return (
                            <Button
                              key={value}
                              testID="provider-option"
                              onPress={() => {
                                if (row.dub !== undefined) setDub(row.dub);
                                setProvider(mediaType, value);
                              }}
                              className={cn(
                                'w-48/100 grow shrink-0 justify-center bg-accent-soft-foreground',
                                isSelected && 'bg-accent',
                              )}>
                              <HUXStack className="items-center">
                                {isSelected && <IoniconsIcon name="checkmark" className="text-accent-foreground" />}
                                <Button.Label>{name}</Button.Label>
                              </HUXStack>
                            </Button>
                          );
                        })}
                    </HUXStack>
                  </HUXStack>
                ))}
            </Card.Body>
          </Card>
        </View>
      </Dialog>
    </View>
  );
};

export default ProviderSelection;
