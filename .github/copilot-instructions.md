# Copilot instructions (Uwumi)

## Project map
- Expo + Expo Router app: screens live in `src/app/**` (route groups like `(tabs)` / `(settings)` and dynamic routes like `[mediaType].tsx`).
- UI is Tamagui-first: prefer `View`, `Text`, `YStack`, `XStack`, `Sheet`, `Tabs`, etc. over React Native primitives.
- Shared UI components: `src/components/**` (examples: `HorizontalTabs.tsx`, `CustomSelect.tsx`, `ui-primitives.tsx`).
- “Server state” lives in React Query hooks: `src/hooks/queries/**`.
- “App state” lives in Zustand stores (often MMKV-backed): `src/hooks/stores/**` and re-exported via `src/hooks/stores/index.ts` + `src/hooks/index.ts`.

## Data flow & providers (important)
- Providers are extension-driven for anime/movies: `useConsumetExtensions()` (see `src/hooks/stores/useExtensionStore.ts`) builds a `ProviderManager/ExtractorManager` to execute installed extension code.
- Provider selection + persistence is centralized in `src/constants/provider.ts` (`useProviderStore`, `DEFAULT_PROVIDERS`, `PROVIDERS`). `PROVIDERS` is derived from installed extensions at runtime.
- Manga providers are currently hard-mapped via `createProviderInstance()` in `src/constants/provider.ts`.
- Example query keys: `['anime','episodes',id,provider]`, `[mediaType,'info',id,metaProvider,type,provider]` (see `src/hooks/queries/infoQueries.ts`).

## Styling conventions
- Use theme tokens (`$color`, `$color1`, `$color2`, spacing `$1..$10`) and Tamagui animations (`animation="quick"` etc.). Config lives in `tamagui.config.ts`; generated themes in `src/constants/theme-out.ts`.
- Prefer absolute imports via `@/…` (repo uses module-resolver).

## Gesture + Sheet gotcha (Android)
- In `Sheet` UIs, keep interactive headers (e.g., `Tabs.List`) OUTSIDE any `Sheet.ScrollView` to avoid pan/scroll gestures stealing taps.
- Put scrolling on the body only: `Sheet.Frame` → header → `Sheet.ScrollView` for the content.

## Workflows (scripts)
- Dev: `npm run start` (uses `expo start --localhost`).
- Native: `npm run android` / `npm run ios`; for adb reverse + run use `npm run android:reverse`.
- Lint/format: `npm run lint`, `npm run format`.
- Tests: `npm run test` (Jest Expo).
- Theme generation: `npm run generate-themes`.
- Note: `postinstall` runs an Android Gradle task to download an AAR (`android/:app:downloadAar`).

## When editing
- Match existing patterns: memoized components (`memo`, `useCallback`, `useMemo`) are common in UI-heavy components.
- Prefer updating existing stores/hooks over inventing new state paths; keep query keys stable.# GitHub Copilot Instructions for Uwumi

## Project Overview

Uwumi is a React Native media streaming application built with Expo, supporting anime, manga, and movies. The app uses a modular architecture with extension support for different content providers.

## Technology Stack

- **Framework**: React Native (0.81.4) with Expo (SDK 54)
- **Language**: TypeScript 5.9
- **UI Library**: Tamagui (1.134.2) - styled components with variants
- **State Management**: Zustand (5.0.1) - lightweight state management
- **Data Fetching**: TanStack Query (React Query 5.66.0)
- **Navigation**: Expo Router (6.0.10) - file-based routing
- **Video Player**: react-native-video (6.12.0)
- **Storage**: react-native-mmkv (3.1.0) - high-performance key-value storage
- **Media Provider**: react-native-consumet (1.1.0) - extensible media provider system
- **Animations**: react-native-reanimated (4.1.1)
- **Gestures**: react-native-gesture-handler (2.28.0)

## Architecture Patterns

### File Structure
```
src/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (onboarding)/      # Onboarding flow screens
│   ├── (settings)/        # Settings screens
│   ├── (tabs)/            # Main tab navigation
│   ├── info/              # Media info/details screens
│   ├── read/              # Manga reader
│   └── watch/             # Video player
├── components/            # Reusable UI components
├── constants/             # App constants, themes, types
├── hooks/                 # Custom hooks
│   ├── queries/          # React Query hooks
│   └── stores/           # Zustand stores
├── scripts/              # Build and utility scripts
└── svg/                  # SVG icons as React components
```

### State Management Guidelines

1. **Zustand for App State**: Use Zustand stores for global app state
   - Store files in `src/hooks/stores/`
   - Use MMKV for persistence when needed
   - Export stores from `src/hooks/stores/index.ts`

2. **React Query for Server State**: Use TanStack Query for API data
   - Query hooks in `src/hooks/queries/`
   - Use query keys: `['mediaType', 'operation', ...params]`
   - Enable caching and background refetching appropriately

3. **Component State**: Use `useState` for local component state

### Component Development

#### Tamagui Components
- Use Tamagui components (`View`, `Text`, `Button`, etc.) instead of React Native primitives
- Leverage Tamagui's theme system and variants
- Use `$` prefix for theme tokens: `color="$color"`, `backgroundColor="$color2"`
- Use styled components for complex styling:
  ```typescript
  const StyledView = styled(View, {
    padding: '$4',
    variants: {
      active: {
        true: { backgroundColor: '$color4' }
      }
    }
  });
  ```

#### Performance Optimization
- Use `memo()` for expensive components that receive stable props
- Use `useMemo()` for expensive computations
- Use `useCallback()` for functions passed as props
- Use FlashList instead of FlatList for long lists
- Lazy load heavy components with `React.lazy()` where appropriate

#### Component Patterns
```typescript
// Preferred component structure
import React, { memo, useMemo, useCallback } from 'react';
import { View, Text } from 'tamagui';

interface ComponentProps {
  // Define props interface
  id: string;
  onPress?: () => void;
}

const Component: React.FC<ComponentProps> = memo(({ id, onPress }) => {
  // Hooks first
  const data = useSomeHook(id);
  
  // Memoized values
  const processedData = useMemo(() => {
    return expensiveComputation(data);
  }, [data]);
  
  // Callbacks
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);
  
  // Render
  return (
    <View>
      <Text>{processedData}</Text>
    </View>
  );
});

export default Component;
```

### Navigation

- Use Expo Router file-based routing
- Dynamic routes: `[paramName].tsx`
- Route groups: `(groupName)/`
- Use `useLocalSearchParams()` for route params
- Use `router.push()`, `router.replace()`, `router.back()`
- Type route params with TypeScript:
  ```typescript
  const { id, mediaType } = useLocalSearchParams<{
    id: string;
    mediaType: MediaType;
  }>();
  ```

### Data Fetching

#### React Query Hooks
```typescript
// Query pattern
export function useMediaInfo({ id, provider }: Params) {
  return useQuery({
    queryKey: ['anime', 'info', id, provider],
    queryFn: async () => {
      const instance = createProviderInstance(MediaType.ANIME, provider);
      return await instance.fetchMediaInfo(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Infinite query pattern
export function useMediaFeed({ mediaType, feedType }: Params) {
  return useInfiniteQuery({
    queryKey: ['media', mediaType, feedType],
    queryFn: async ({ pageParam = 1 }) => {
      return await fetchData(pageParam);
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
}
```

### Zustand Store Pattern
```typescript
import { create } from 'zustand';
import { storage } from '@/hooks/stores/MMKV';

interface StoreState {
  value: string;
  setValue: (value: string) => void;
}

const STORAGE_KEY = 'store_key';

export const useStore = create<StoreState>((set) => ({
  value: storage.getString(STORAGE_KEY) ?? '',
  
  setValue: (value) => {
    storage.set(STORAGE_KEY, value);
    set({ value });
  },
}));
```

### Styling Guidelines

1. **Use Tamagui Theme System**
   - Primary text: `color="$color"`
   - Secondary text: `color="$color1"`
   - Backgrounds: `$color2`, `$color3`, `$color4`, `$color5`
   - Spacing: `$1` to `$10` (4px increments)

2. **Responsive Design**
   - Use `useWindowDimensions()` for dynamic sizing
   - Support both portrait and landscape orientations
   - Use `flex` and relative units over fixed pixel values

3. **Dark/Light Theme Support**
   - Use theme tokens instead of hardcoded colors
   - Check `useCurrentTheme()` hook for current theme values
   - Support pure black mode via `usePureBlackBackground()`

### Type Safety

1. **Import Types from Constants**
   ```typescript
   import { MediaType, MediaFeedType } from '@/constants/types';
   import { IAnimeResult, IMovieResult } from 'react-native-consumet';
   ```

2. **Generic Components**
   ```typescript
   const CustomFlashlist = <T,>(props: FlashListProps<T>) => {
     // Component implementation
   };
   ```

3. **Strict Null Checks**
   - Always check for null/undefined: `data?.property`
   - Use optional chaining and nullish coalescing
   - Provide fallback values: `value ?? defaultValue`

### Error Handling

1. **Use Toast for User Feedback**
   ```typescript
   import { toast } from 'sonner-native';
   
   toast.error('Error Title', { 
     description: 'Error details here' 
   });
   ```

2. **React Query Error Handling**
   ```typescript
   const { data, isLoading, error } = useQuery({
     // ...config
   });
   
   if (error) {
     toast.error('Failed to load', {
       description: error.message
     });
   }
   ```

3. **Try-Catch for Async Operations**
   ```typescript
   try {
     await asyncOperation();
   } catch (error) {
     console.error('Operation failed:', error);
     toast.error('Operation failed');
   }
   ```

### Performance Best Practices

1. **Image Optimization**
   - Use `expo-image` for better performance
   - Lazy load images with `contentFit="cover"`
   - Use appropriate image sizes

2. **List Optimization**
   - Use FlashList for long lists
   - Provide `keyExtractor`
   - Memoize `renderItem` functions
   - Use `removeClippedSubviews` for very long lists

3. **Avoid Inline Functions**
   ```typescript
   // Bad
   <Button onPress={() => doSomething(id)} />
   
   // Good
   const handlePress = useCallback(() => {
     doSomething(id);
   }, [id]);
   
   <Button onPress={handlePress} />
   ```

4. **Minimize Re-renders**
   - Use `memo()` for pure components
   - Split large components into smaller ones
   - Use stable references for callbacks and objects

### Android-Specific Guidelines

1. **Back Button Handling**
   - Use `useCustomBackHandler()` hook
   - Handle fullscreen mode appropriately
   - Don't override system back behavior unnecessarily

2. **System UI**
   - Use `react-native-edge-to-edge` for edge-to-edge content
   - Handle safe areas with `useSafeAreaInsets()`
   - Update navigation bar colors to match theme

3. **Build Configuration**
   - ProGuard rules in `android/app/proguard-rules.pro`
   - Build variants in `android/app/build.gradle`
   - Enable R8 minification for release builds

### Video Player Guidelines

1. **Use react-native-video**
   - Memoize video source object
   - Include textTracks in source dependencies
   - Handle playback state properly
   - Save/restore playback progress

2. **Subtitle Handling**
   - Support both internal and external subtitles
   - Map subtitle formats to TextTrackType.VTT
   - Handle language codes properly

3. **Orientation Management**
   - Lock portrait in non-fullscreen mode
   - Switch to landscape in fullscreen
   - Handle orientation changes gracefully

### Extension System

1. **Provider Pattern**
   - Extensions provide media sources
   - Use `createProviderInstance()` to instantiate providers
   - Store provider preferences in Zustand store
   - Support multiple providers per media type

2. **Extension Installation**
   - Extensions installed to local storage
   - Metadata cached in MMKV
   - Support version updates
   - Handle installation failures gracefully

### Code Quality

1. **ESLint Configuration**
   - Follow existing ESLint rules
   - Use Prettier for formatting
   - Run `yarn lint` before committing

2. **Git Workflow**
   - Use Conventional Commits format
   - Run lint-staged pre-commit hooks
   - Keep commits atomic and focused

3. **Documentation**
   - Document complex algorithms
   - Add JSDoc for public APIs
   - Keep README.md updated

### Testing (Future Enhancement)

- Consider adding tests for critical paths
- Test utility functions and hooks
- Test navigation flows
- Test API integration

## Common Code Snippets

### Creating a New Screen
```typescript
// src/app/new-screen.tsx
import { ThemedView } from '@/components/ThemedView';
import { Text } from 'tamagui';

export default function NewScreen() {
  return (
    <ThemedView useSafeArea>
      <Text>New Screen</Text>
    </ThemedView>
  );
}
```

### Creating a Zustand Store
```typescript
// src/hooks/stores/useNewStore.ts
import { create } from 'zustand';
import { storage } from './MMKV';

interface NewStoreState {
  value: string;
  setValue: (value: string) => void;
}

export const useNewStore = create<NewStoreState>((set) => ({
  value: storage.getString('key') ?? '',
  setValue: (value) => {
    storage.set('key', value);
    set({ value });
  },
}));
```

### Creating a React Query Hook
```typescript
// src/hooks/queries/newQuery.ts
import { useQuery } from '@tanstack/react-query';

export function useNewData({ id }: { id: string }) {
  return useQuery({
    queryKey: ['new', id],
    queryFn: async () => {
      const response = await fetch(`/api/${id}`);
      return response.json();
    },
    enabled: !!id,
  });
}
```

## Debugging Tips

1. **React Query Devtools**: Enabled in dev mode
2. **Flipper**: Use for network and Redux debugging
3. **Console Logs**: Will be stripped in production builds
4. **Error Boundaries**: Wrap critical sections

## Important Notes

- This is an Expo app - use `expo run:android` not `react-native run-android`
- New Architecture is enabled (`newArchEnabled=true`)
- Hermes is the JS engine
- Target SDK: Android 36
- Minimum SDK: 23 (Android 6.0)

## When Writing Code

1. **Always** use TypeScript with proper types
2. **Always** use Tamagui components over React Native primitives
3. **Always** memoize expensive operations and callbacks
4. **Always** handle loading and error states
5. **Always** check for null/undefined values
6. **Prefer** React Query for server state
7. **Prefer** Zustand for app state
8. **Prefer** functional components with hooks
9. **Avoid** inline styles and functions
10. **Avoid** prop drilling - use context or state management
11. **Avoid** unnecessary making .md files unless told otherwise

## Resources

- Expo Docs: https://docs.expo.dev
- Tamagui Docs: https://tamagui.dev
- React Query Docs: https://tanstack.com/query
- Zustand Docs: https://github.com/pmndrs/zustand
