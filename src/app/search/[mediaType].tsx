import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SearchField, Separator } from 'heroui-native';
import { ListGroup } from '@/components/ListGroup';
import { Button } from '@/components/Button';
import { CardList, HUXStack, HUYStack, IoniconsIcon, RippleButton, ThemedView } from '@/components';
import { getMetaProvider, mediaTypeLabel } from '@/components/MediaBrowser';
import { MediaType } from '@/constants/types';
import { isTV } from '@/constants/utils';
import { useCurrentTheme, useDebouncedValue, useRecentSearchesStore } from '@/hooks';

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;
const EMPTY: string[] = [];

const Search = () => {
  const router = useRouter();
  const { mediaType } = useLocalSearchParams<{ mediaType: MediaType }>();
  const currentTheme = useCurrentTheme();
  const metaProvider = getMetaProvider(mediaType);
  const label = mediaTypeLabel(mediaType).toLowerCase();

  const [query, setQuery] = useState('');
  // Set by submit or by picking a recent search, so results load without waiting for the debounce
  const [submitted, setSubmitted] = useState<string | null>(null);
  const debounced = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const trimmed = query.trim();
  const liveQuery = !trimmed ? '' : (submitted ?? (debounced.length >= MIN_QUERY_LENGTH ? debounced : ''));

  const recent = useRecentSearchesStore((state) => state.recent[mediaType] ?? EMPTY);
  const addRecentSearch = useRecentSearchesStore((state) => state.addRecentSearch);
  const removeRecentSearch = useRecentSearchesStore((state) => state.removeRecentSearch);
  const clearRecentSearches = useRecentSearchesStore((state) => state.clearRecentSearches);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    setSubmitted(null);
  }, []);

  const runSearch = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value) return;
      setQuery(value);
      setSubmitted(value);
      addRecentSearch(mediaType, value);
    },
    [addRecentSearch, mediaType],
  );

  const recordLiveQuery = useCallback(
    () => addRecentSearch(mediaType, liveQuery),
    [addRecentSearch, mediaType, liveQuery],
  );

  const removeButton = (item: string) => (
    <Button
      variant="ghost"
      size="sm"
      isIconOnly
      accessibilityLabel={`Remove ${item} from recent searches`}
      onPress={() => removeRecentSearch(mediaType, item)}>
      <IoniconsIcon name="close" size={18} color={currentTheme?.foreground} />
    </Button>
  );

  return (
    <ThemedView>
      <HUXStack className="items-center gap-1 px-2 py-2">
        <RippleButton onPress={router.back}>
          <IoniconsIcon name="chevron-back" size={24} color={currentTheme?.foreground} />
        </RippleButton>
        <SearchField value={query} onChange={handleChange} className="flex-1">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input
              autoFocus
              hasTVPreferredFocus={isTV}
              placeholder={`Search ${label}`}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => runSearch(query)}
            />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </HUXStack>

      {liveQuery ? (
        <View className="flex-1">
          <CardList
            mediaFeedType="search"
            mediaType={mediaType}
            metaProvider={metaProvider}
            searchQuery={liveQuery}
            onItemPress={recordLiveQuery}
          />
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="px-4 pt-2 pb-32 gap-2">
          {recent.length > 0 ? (
            <>
              <HUXStack className="items-center justify-between">
                <Text className="text-foreground text-base font-semibold">Recent searches</Text>
                <Button variant="ghost" size="sm" onPress={() => clearRecentSearches(mediaType)}>
                  <Button.Label>Clear all</Button.Label>
                </Button>
              </HUXStack>
              <ListGroup>
                {recent.map((item, index) => (
                  <React.Fragment key={item}>
                    {index > 0 && <Separator className="mx-4" />}
                    {/* On TV the remove button sits beside the row: the D-pad can't move into a focused row */}
                    <HUXStack className="items-center">
                      <View className="flex-1">
                        <ListGroup.Item onPress={() => runSearch(item)}>
                          <ListGroup.ItemPrefix>
                            <IoniconsIcon name="time-outline" size={20} color={currentTheme?.foreground} />
                          </ListGroup.ItemPrefix>
                          <ListGroup.ItemContent>
                            <ListGroup.ItemTitle>{item}</ListGroup.ItemTitle>
                          </ListGroup.ItemContent>
                          <ListGroup.ItemSuffix>{!isTV && removeButton(item)}</ListGroup.ItemSuffix>
                        </ListGroup.Item>
                      </View>
                      {isTV && removeButton(item)}
                    </HUXStack>
                  </React.Fragment>
                ))}
              </ListGroup>
            </>
          ) : (
            <HUYStack className="items-center gap-2 pt-24">
              <IoniconsIcon name="search" size={40} color={currentTheme?.muted} />
              <Text className="text-muted text-base text-center">Search {label} by title</Text>
            </HUYStack>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
};

export default Search;
