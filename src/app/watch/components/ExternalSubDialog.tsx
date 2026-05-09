import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Button, cn, Input, ScrollShadow, TextField } from 'heroui-native';
import { SUB_LANGUAGE } from '@/constants/config';
import { useCurrentTheme, useCustomBackHandler } from '@/hooks';
import { HUXStack, IoniconsIcon, RippleButton, CustomDialog } from '@/components';
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
      <View>
        <RippleButton onPress={() => handleOpenChange(true)}>
          <HUXStack className="items-center justify-center gap-3">
            <IoniconsIcon name="add-circle-outline" color={theme.foreground} size={16} />
            <Text className="text-foreground text-base font-semibold">Add External Subtitle</Text>
          </HUXStack>
        </RippleButton>

        <CustomDialog open={open} onOpenChange={handleOpenChange}>
          <View
            className={cn('relative rounded-3xl bg-background p-5 w-[85vw] max-w-[400px]')}
            style={{ height: maxDialogHeight }}>
            <View className="flex-1 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">Subtitle language</Text>
                <Button isIconOnly variant="ghost" onPress={() => handleOpenChange(false)}>
                  <IoniconsIcon name="close" size={24} className="text-foreground" />
                </Button>
              </View>
              <TextField>
                <View className="absolute z-10 left-3.5 inset-y-0 justify-center">
                  <IoniconsIcon name="search" size={16} color={theme.foreground} />
                </View>
                <Input
                  ref={inputRef}
                  placeholder="Search languages..."
                  // value={searchQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                  autoComplete="off"
                  placeholderTextColor={theme.separator}
                  onChangeText={setSearchQuery}
                  style={{ paddingHorizontal: 32 }}
                />

                <View className="absolute right-3.5 inset-y-0 justify-center">
                  {searchQuery ? (
                    <IoniconsIcon name="close" size={16} color={theme.foreground} onPress={handleClearSearch} />
                  ) : null}
                </View>
              </TextField>

              <ScrollShadow className="flex-1" LinearGradientComponent={LinearGradient}>
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}>
                  {options.map((item) => {
                    const isSelected = item.value === externalSubtitleLanguage;
                    return (
                      <RippleButton key={item.value} onPress={() => handleValueChange(item)}>
                        <View className="flex-row items-center gap-3 flex-1 py-3 px-2">
                          <Text className="text-base text-foreground flex-1">{item.label}</Text>
                          {isSelected && <IoniconsIcon name="checkmark" size={20} className="text-accent" />}
                        </View>
                      </RippleButton>
                    );
                  })}
                  {options.length === 0 ? (
                    <Text className="text-foreground/70 text-center mt-8">No languages found</Text>
                  ) : null}
                </ScrollView>
              </ScrollShadow>
              <HUXStack className="self-stretch justify-between gap-4">
                <Button
                  size="md"
                  isIconOnly={false}
                  variant="danger-soft"
                  onPress={() => {
                    setExternalSubtitleLanguage(null);
                    handleOpenChange(false);
                  }}>
                  Cancel
                </Button>

                <Button
                  size="md"
                  isIconOnly={false}
                  isDisabled={!externalSubtitleLanguage?.trim()}
                  onPress={() => {
                    if (externalSubtitleLanguage?.trim()) {
                      setShouldFetchExternalSubs(true);
                      // handleOpenChange(false);
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
              </HUXStack>
            </View>
          </View>
        </CustomDialog>
      </View>
    );
  },
);

ExternalSubDialog.displayName = 'ExternalSubSelectDialog';
export default ExternalSubDialog;
