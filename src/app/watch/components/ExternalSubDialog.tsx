import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { Button, cn, ScrollShadow, Select, TextField } from 'heroui-native';
import { SUB_LANGUAGE } from '@/constants/config';
import { useCurrentTheme, useCustomBackHandler } from '@/hooks';
import { HUXStack, IoniconsIcon, RippleButton } from '@/components';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LanguageOption = {
  value: string;
  label: string;
};

interface ExternalSubDialogProps {
  externalSubtitleLanguage: string | null;
  setExternalSubtitleLanguage: (language: string | null) => void;
  isExternalSubtitlesLoading: boolean;
  setShouldFetchExternalSubs: (shouldFetch: boolean) => void;
  isFullscreen: boolean;
  onOpenDialog?: () => void;
}

export const ExternalSubDialog: React.FC<ExternalSubDialogProps> = memo(
  ({
    externalSubtitleLanguage,
    setExternalSubtitleLanguage,
    isExternalSubtitlesLoading,
    setShouldFetchExternalSubs,
    isFullscreen,
    onOpenDialog,
  }) => {
    const theme = useCurrentTheme();
    const inputRef = useRef<TextInput>(null);
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const insetTop = insets.top + 12;
    const maxDialogHeight = (height - insetTop) / 2;

    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useCustomBackHandler(open, () => {
      if (open) setOpen(false);
      return true;
    });

    const allLanguages = useMemo(() => Object.keys(SUB_LANGUAGE).sort((a, b) => a.localeCompare(b)), []);

    const filteredLanguages = useMemo(() => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return allLanguages;

      const terms = query.split(/\s+/).filter(Boolean);
      return allLanguages.filter((lang) => {
        const lower = lang.toLowerCase();
        return terms.every((t) => lower.includes(t));
      });
    }, [allLanguages, searchQuery]);

    const options = useMemo<LanguageOption[]>(
      () => filteredLanguages.map((lang) => ({ value: lang, label: lang })),
      [filteredLanguages],
    );

    const selectedOption = useMemo<LanguageOption | undefined>(() => {
      if (!externalSubtitleLanguage) return undefined;
      return { value: externalSubtitleLanguage, label: externalSubtitleLanguage };
    }, [externalSubtitleLanguage]);

    const handleOpenChange = useCallback(
      (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) {
          onOpenDialog?.();
          requestAnimationFrame(() => inputRef.current?.focus());
        } else {
          setSearchQuery('');
        }
      },
      [onOpenDialog],
    );

    const handleValueChange = useCallback(
      (option?: { value: string }) => {
        if (!option?.value) return;
        setExternalSubtitleLanguage(option.value);
      },
      [setExternalSubtitleLanguage],
    );

    const handleClearSearch = useCallback(() => {
      setSearchQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }, []);

    return (
      <Select
        value={selectedOption}
        onValueChange={handleValueChange}
        isOpen={open}
        onOpenChange={handleOpenChange}
        closeDelay={300}
        animation={{
          exiting: {
            type: 'timing',
            config: {
              duration: 250,
              easing: Easing.out(Easing.quad),
            },
          },
        }}>
        <Select.Trigger asChild>
          <RippleButton>
            <HUXStack className="items-center justify-center gap-3">
              <IoniconsIcon name="add-circle-outline" color={theme.foreground} size={16} />
              <Text className="text-foreground text-base font-semibold">Add External Subtitle</Text>
            </HUXStack>
          </RippleButton>
        </Select.Trigger>

        <Select.Portal>
          <Select.Overlay className="bg-black/50" />
          <Select.Content
            presentation="dialog"
            className={cn('relative rounded-3xl bg-background p-5')}
            style={{ height: maxDialogHeight }}>
            <View className="flex-1 gap-3">
              <View className="flex-row items-center justify-between">
                <Select.ListLabel>Subtitle language</Select.ListLabel>
                <Select.Close />
              </View>
              <TextField>
                <TextField.Input
                  ref={inputRef}
                  placeholder="Search languages..."
                  value={searchQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                  autoComplete="off"
                  placeholderTextColor={theme.divider}
                  onChangeText={setSearchQuery}>
                  <TextField.InputStartContent>
                    <IoniconsIcon name="search" size={18} color={theme.foreground} />
                  </TextField.InputStartContent>
                  <TextField.InputEndContent>
                    {searchQuery ? (
                      <IoniconsIcon name="close" size={16} color={theme.foreground} onPress={handleClearSearch} />
                    ) : null}
                  </TextField.InputEndContent>
                </TextField.Input>
              </TextField>

              <ScrollShadow
                className="flex-1"
                LinearGradientComponent={LinearGradient}
                // color={isDark ? themeColorSurface : themeColorOverlay}
              >
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}>
                  {options.map((item) => (
                    <Select.Item key={item.value} value={item.value} label={item.label}>
                      <View className="flex-row items-center gap-3 flex-1">
                        <Text className="text-base text-foreground flex-1">{item.label}</Text>
                      </View>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                  {options.length === 0 ? (
                    <Text className="text-foreground/70 text-center mt-8">No languages found</Text>
                  ) : null}
                </ScrollView>
              </ScrollShadow>
              <HUXStack className="self-stretch justify-between gap-4">
                <Select.Close asChild>
                  <Button
                    variant="danger-soft"
                    onPress={() => {
                      setExternalSubtitleLanguage(null);
                      setOpen(false);
                    }}>
                    Cancel
                  </Button>
                </Select.Close>

                <Select.Close asChild>
                  <Button
                    isDisabled={!externalSubtitleLanguage?.trim()}
                    onPress={() => {
                      if (externalSubtitleLanguage?.trim()) {
                        setShouldFetchExternalSubs(true);
                        // setOpen(false);
                      }
                    }}>
                    {isExternalSubtitlesLoading ? (
                      <HUXStack className="gap-2 items-center">
                        <ActivityIndicator size="small" />
                        <Button.Label>Fetching...</Button.Label>
                      </HUXStack>
                    ) : (
                      <Button.Label>Fetch Subtitles</Button.Label>
                    )}
                  </Button>
                </Select.Close>
              </HUXStack>
            </View>
          </Select.Content>
        </Select.Portal>
      </Select>
    );
  },
);

ExternalSubDialog.displayName = 'ExternalSubSelectDialog';
export default ExternalSubDialog;
