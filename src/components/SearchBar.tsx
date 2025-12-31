import { useCurrentTheme, useSearchStore, useTabsStore } from '@/hooks';
import React, { useCallback, useRef } from 'react';
import { TextInput, View } from 'react-native';
import { Button, TextField } from 'heroui-native';
import { IoniconsIcon } from './Icons';

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
      <TextField className="p-2 mt-4 mx-4">
        <TextField.Input
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
            // padding: 10,
            // flex: 1,
            fontWeight: 700,
            // height: 50,
          }}
          focusable>
          <TextField.InputEndContent>
            {searchQuery && (
              <Button variant="ghost" onPress={handleClear}>
                <IoniconsIcon name="close" size={20} />
              </Button>
            )}
          </TextField.InputEndContent>
        </TextField.Input>
      </TextField>
    </View>
  );
};

export default SearchBar;
