import { useCurrentTheme, useSearchStore, useTabsStore } from '@/hooks';
import { X } from '@tamagui/lucide-icons';
import React, { useCallback, useRef } from 'react';
import { TextInput } from 'react-native';
import { Button, View, XStack } from 'tamagui';

export const SearchBar: React.FC = () => {
  const searchQuery = useSearchStore((state) => state.searchQuery);
  const setSearchQuery = useSearchStore((state) => state.setSearchQuery);
  const setDebouncedQuery = useSearchStore((state) => state.setDebouncedQuery);
  const setCurrentTab = useTabsStore((state) => state.setCurrentTab);
  const currentTheme = useCurrentTheme();
  const inputRef = useRef<TextInput>(null);

  const handleTextChange = useCallback((text: string) => {
    setSearchQuery(text);
    setDebouncedQuery(text);
  }, []);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  // Handle manual search submission
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      setSearchQuery(searchQuery.trim());
      setDebouncedQuery(searchQuery.trim());
    }
    setCurrentTab('tab3');
  }, [searchQuery]);

  return (
    <View width="100%">
      <XStack
        borderWidth={2}
        borderColor="$color2"
        borderRadius={10}
        padding="$2"
        marginTop="$4"
        marginHorizontal="$4"
        alignItems="center">
        <TextInput
          ref={inputRef}
          onChangeText={handleTextChange}
          value={searchQuery}
          keyboardType="web-search"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          placeholderTextColor={currentTheme?.color1}
          placeholder="Search..."
          style={{
            color: currentTheme?.color1,
            padding: 10,
            flex: 1,
            fontWeight: 700,
            // height:50
          }}
          focusable
        />
        {searchQuery && <Button icon={X} circular onPress={handleClear} />}
      </XStack>
    </View>
  );
};

export default SearchBar;
