import { View, Text, useWindowDimensions } from 'react-native';
import React, { useState } from 'react';
import { Button, Card, cn } from 'heroui-native';
import { HUXStack, IoniconsIcon, Dialog } from '@/components';
import { useProviders, useProviderStore, useActiveProvider } from '@/constants/provider';
import { MediaType } from '@/constants/types';
import { create } from 'zustand';
import { usePureBlackBackground } from '@/hooks';

export interface ProviderSelectionState {
  dub: boolean;
  isEmbed: boolean;
  setDub: (dub: boolean) => void;
  setIsEmbed: (isEmbed: boolean) => void;
}

// Material 3 caps dialogs at 560dp
const DIALOG_MAX_WIDTH = 560;

export const useProviderSelectionStore = create<ProviderSelectionState>((set) => ({
  dub: false,
  isEmbed: true,
  setDub: (dub: boolean) => set({ dub }),
  setIsEmbed: (isEmbed: boolean) => set({ isEmbed }),
}));

/** A provider that only offers embed or direct forces it; otherwise the user's last choice applies. */
export const useEmbedMode = (mediaType: MediaType, provider: string) => {
  const isEmbed = useProviderSelectionStore((state) => state.isEmbed);
  const providers = useProviders();
  const capabilities = providers[mediaType]?.find(({ value }) => value === provider);
  if (capabilities?.embed && !capabilities.nonEmbed) return true;
  if (capabilities && !capabilities.embed && capabilities.nonEmbed) return false;
  return isEmbed;
};

const ProviderSelection = ({ mediaType, isDubbed }: { mediaType: MediaType; isDubbed?: string }) => {
  const [open, setOpen] = useState(false);
  const setProvider = useProviderStore((state) => state.setProvider);
  const { dub, setDub, setIsEmbed } = useProviderSelectionStore();
  const currentProvider = useActiveProvider(mediaType);
  const isEmbed = useEmbedMode(mediaType, currentProvider);
  const providers = useProviders();
  // const mediaType = MediaType.ANIME; // for testing
  // const isDubbed = dub ? 'true' : 'false'; // for testing
  const pureBlackBackground = usePureBlackBackground();
  const { width: windowWidth } = useWindowDimensions();
  const selectedName = providers[mediaType]?.find(({ value }) => value === currentProvider)?.name;
  return (
    <View>
      <Button variant="secondary" onPress={() => setOpen(true)}>
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
            <Button isIconOnly variant="ghost" onPress={() => setOpen(false)}>
              <IoniconsIcon name="close" size={24} className="text-foreground" />
            </Button>
          </HUXStack>
          <Card className={cn(pureBlackBackground && 'bg-black')}>
            <Card.Body className="pt-2 px-0">
              {mediaType === MediaType.ANIME &&
                [{ label: 'Sub', key: 'sub' }, isDubbed === 'true' && { label: 'Dub', key: 'dub' }]
                  .filter(
                    (row): row is { label: string; key: string } =>
                      !!row && providers[mediaType].some((p) => (row.key === 'sub' ? p.subbed : p.dubbed)),
                  )
                  .map(({ label, key }, index) => (
                    <HUXStack key={`${key}-${index}`} className="items-center justify-between mb-2 px-4">
                      {key && <Text className="text-foreground font-bold w-12.5">{label}:</Text>}
                      <HUXStack className="flex-wrap flex-1 gap-1">
                        {providers[mediaType].map(({ name, value, subbed, dubbed }) => {
                          const isAvailable = key === 'sub' ? subbed : key === 'dub' ? dubbed : false;
                          const isSelected = currentProvider === value && dub === (key === 'dub');
                          if (!isAvailable) return null;
                          return (
                            <Button
                              key={value}
                              onPress={() => {
                                setDub(key === 'dub');
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
              {mediaType === MediaType.MOVIE &&
                [
                  { label: 'Embed', key: 'embed' },
                  { label: 'Direct', key: 'nonEmbed' },
                ]
                  .filter(({ key }) => providers[mediaType].some((p) => (key === 'embed' ? p.embed : p.nonEmbed)))
                  .map(({ label, key }) => (
                    <HUXStack key={key} className="items-center justify-between mb-2 px-4">
                      {key && <Text className="text-foreground font-bold w-12.5">{label}:</Text>}
                      <HUXStack className="flex-wrap flex-1 gap-1">
                        {providers[mediaType].map(({ name, value, embed, nonEmbed }) => {
                          const isAvailable = key === 'embed' ? embed : key === 'nonEmbed' ? nonEmbed : false;
                          const isSelected =
                            currentProvider === value &&
                            ((key === 'embed' && isEmbed) || (key === 'nonEmbed' && !isEmbed));
                          // console.log('isEmbed:', isEmbed, isSelected);

                          if (!isAvailable) return null;

                          return (
                            <Button
                              key={`${value}-${key}`}
                              onPress={() => {
                                setProvider(mediaType, value);
                                setIsEmbed(key === 'embed');
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
