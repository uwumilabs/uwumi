import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SearchField } from 'heroui-native';
import { Button } from '@/components/Button';
import { Menu, useMenuContext } from 'react-native-video-toolkit';
import { IoniconsIcon, type IoniconProps } from '@/components';
import { SUB_LANGUAGE } from '@/constants/config';

// The menu header shows a view's id, capitalized
const ADD_VIEW = 'add subtitles';
const LANGUAGE_VIEW = 'subtitle language';

export interface SubtitleLanguage {
  name: string;
  code: string;
}

export type SubtitleSearchResult = 'added' | 'none' | 'failed';

const LANGUAGES: SubtitleLanguage[] = Object.entries(SUB_LANGUAGE)
  .filter(([name]) => name !== 'ALL')
  .map(([name, code]) => ({ name, code }))
  .sort((a, b) => a.name.localeCompare(b.name));

const RESULT_LABELS: Record<Exclude<SubtitleSearchResult, 'added'>, string> = {
  none: 'None found',
  failed: 'Couldn’t reach OpenSubtitles',
};

/** Sits above the Captions list as a button. Titles OpenSubtitles can't search (anime) only take a file. */
export const AddSubtitlesItem = ({ canSearch, onAddFile }: { canSearch: boolean; onAddFile: () => void }) => {
  const { navigateTo, closeSettings } = useMenuContext();

  return (
    <View className="px-3 pb-3 pt-1">
      <Button
        variant="secondary"
        onPress={() => {
          if (canSearch) return navigateTo(ADD_VIEW);
          closeSettings();
          onAddFile();
        }}>
        <IoniconsIcon name="add" size={20} className="text-accent-soft-foreground" />
        <Button.Label>{canSearch ? 'Add subtitles' : 'Add subtitle file'}</Button.Label>
      </Button>
    </View>
  );
};

const SourceButton = ({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: IoniconProps['name'];
  label: string;
  hint: string;
  onPress: () => void;
}) => (
  <Button variant="secondary" onPress={onPress} className="h-auto flex-1 flex-col gap-1.5 rounded-2xl py-5">
    <IoniconsIcon name={icon} size={26} className="text-accent-soft-foreground" />
    <Button.Label>{label}</Button.Label>
    <Text className="text-xs text-foreground/60">{hint}</Text>
  </Button>
);

const AddChoices = ({ onAddFile }: { onAddFile: () => void }) => {
  const { navigateTo, closeSettings } = useMenuContext();
  return (
    <View className="flex-row gap-3 p-3">
      <SourceButton
        icon="document-text-outline"
        label="From a file"
        hint=".srt, .vtt or .ttml"
        onPress={() => {
          closeSettings();
          onAddFile();
        }}
      />
      <SourceButton
        icon="globe-outline"
        label="Search OpenSubtitles"
        hint="Any language"
        onPress={() => navigateTo(LANGUAGE_VIEW)}
      />
    </View>
  );
};

const LanguageSearch = ({ onSearch }: { onSearch: (language: SubtitleLanguage) => Promise<SubtitleSearchResult> }) => {
  const { closeSettings } = useMenuContext();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<{ code: string; label: string } | null>(null);
  const searching = status?.label === 'Searching…';

  const languages = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text ? LANGUAGES.filter(({ name }) => name.toLowerCase().includes(text)) : LANGUAGES;
  }, [query]);

  const search = async (language: SubtitleLanguage) => {
    if (searching) return;
    setStatus({ code: language.code, label: 'Searching…' });
    const result = await onSearch(language);
    if (result === 'added') {
      setStatus(null);
      closeSettings();
    } else {
      setStatus({ code: language.code, label: RESULT_LABELS[result] });
    }
  };

  return (
    <View className="flex-1">
      <SearchField value={query} onChange={setQuery} className="mx-3 mb-2">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input
            placeholder="Search languages"
            autoCapitalize="none"
            autoCorrect={false}
            disableFullscreenUI
            returnKeyType="search"
          />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: '100%' }}>
        {languages.map((language) => (
          <Menu.Item key={language.code} autoClose={false} onPress={() => search(language)}>
            {status?.code === language.code ? `${language.name} · ${status.label}` : language.name}
          </Menu.Item>
        ))}
      </ScrollView>
    </View>
  );
};

/** Menu views behind "Add subtitles": a file, or OpenSubtitles in a language searched for. */
export const AddSubtitlesViews = ({
  onAddFile,
  onSearch,
}: {
  onAddFile: () => void;
  onSearch: (language: SubtitleLanguage) => Promise<SubtitleSearchResult>;
}) => (
  <>
    <Menu.SubContent viewId={ADD_VIEW}>
      <AddChoices onAddFile={onAddFile} />
    </Menu.SubContent>
    <Menu.SubContent viewId={LANGUAGE_VIEW}>
      <LanguageSearch onSearch={onSearch} />
    </Menu.SubContent>
  </>
);
