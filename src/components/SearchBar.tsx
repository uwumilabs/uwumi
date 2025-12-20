import { useCurrentTheme, useSearchStore, useTabsStore } from '@/hooks';
import { X } from 'lucide-react-native';
import React, { useCallback, useRef } from 'react';
import { TextInput, View } from 'react-native';
import { HUXStack } from './ui-primitives';
import { Button } from 'heroui-native';

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
    <View className="w-full">
      <HUXStack className="border-2 border-border rounded-2xl p-2 mt-4 mx-4 items-center">
        <TextInput
          ref={inputRef}
          onChangeText={handleTextChange}
          value={searchQuery}
          keyboardType="web-search"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          placeholderTextColor={currentTheme?.foreground}
          placeholder="Search..."
          style={{
            color: currentTheme?.foreground,
            padding: 10,
            flex: 1,
            fontWeight: 700,
            height: 50,
          }}
          focusable
        />
        {searchQuery && (
          <Button className="" onPress={handleClear}>
            <X size={20} />
          </Button>
        )}
      </HUXStack>
    </View>
  );
};

export default SearchBar;
