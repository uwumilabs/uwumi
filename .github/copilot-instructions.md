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
Uwumi is a React Native media streaming application built with Expo, supporting anime, manga, and movies. It features a modular extension system, custom theming engine, and offline capabilities.

## Architecture & Core Concepts

### 1. Extension System (`src/hooks/stores/useExtensionStore.ts`)
- **Dynamic Loading:** Extensions are downloaded from a remote registry and cached locally using `react-native-fs`.
- **Execution:** `react-native-consumet` manages the execution of these extensions to fetch media content.
- **Provider Management:** `src/constants/provider.ts` maps installed extensions to active providers.
- **Key Path:** `src/hooks/stores/useExtensionStore.ts` is the brain of this system.

### 2. Theming Engine (`src/themes/`)
- **CSS-Driven:** Themes are defined in CSS files (e.g., `src/themes/cloudflare.css`) using `@variant` blocks.
- **Generation:** A script (`src/scripts/generate-themes.ts`) parses these CSS files to generate type-safe TypeScript definitions in `src/themes/theme.ts`.
- **Usage:** Components consume themes via `useThemeStore` and `uniwind` styling.
- **Workflow:** **ALWAYS** run `npm run generate-themes` after modifying any `.css` file in `src/themes/`.

### 3. State Management
- **App State (Zustand):** Used for global UI state, settings, and extension management. Stores live in `src/hooks/stores/`.
- **Server State (React Query):** Used for all data fetching. Query keys follow the pattern `['mediaType', 'operation', ...params]`.
- **Persistence:** `react-native-mmkv` is used for high-performance synchronous storage.

### 4. Native Modules (`modules/`)
- The project uses custom Expo modules for platform-specific functionality:
  - `storage-permission-module`: Handles Android storage permissions.
  - `fullscreen-module`: Manages immersive mode.

## Critical Workflows

### Theme Updates
When adding or modifying a theme:
1. Edit the `.css` file in `src/themes/`.
2. Run `npm run generate-themes` to update `src/themes/theme.ts`.
3. Restart the dev server to see changes.

### Build & Run
- **Dev:** `npm run start` (uses `expo start --localhost`).
- **Android:** `npm run android` (builds native app).
- **Post-install:** The `postinstall` script downloads necessary AARs (e.g., ffmpeg-kit). Ensure this runs successfully.

## Coding Conventions

### UI & Styling
- **Library:** Uses `heroui-native` for core components (Card, Button, etc.) and `tamagui` for layout primitives.
- **Styling:** Prefer `uniwind` classes (Tailwind-like) or Tamagui props.
- **Performance:** Heavily use `memo`, `useMemo`, and `useCallback` for UI components, especially in lists (`CustomFlashlist`).

### Data Fetching
- **Pattern:** Encapsulate queries in custom hooks (e.g., `useMediaInfo`, `useMediaFeed`).
- **Error Handling:** Use `sonner-native` for user-facing toast notifications on error.

### File Structure
- `src/app`: Expo Router screens.
- `src/modules`: Custom native modules.
- `src/themes`: CSS theme definitions.
- `src/scripts`: Build and utility scripts.

## Key Files to Know
- `src/app/_layout.tsx`: Global provider setup (QueryClient, Theme, Permissions).
- `src/constants/provider.ts`: Central registry for media providers.
- `src/hooks/stores/useExtensionStore.ts`: Extension lifecycle management.
- `src/scripts/generate-themes.ts`: Theming build script.

## Component Development

#### HeroUI Components
- [Accordion](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/accordion/accordion.md)
- [Avatar](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/avatar/avatar.md)
- [Button](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/button/button.md)
- [Card](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/card/card.md)
- [Checkbox](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/checkbox/checkbox.md)
- [Chip](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/chip/chip.md)
- [Dialog](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/dialog/dialog.md)
- [Divider](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/divider/divider.md)
- [Error View](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/error-view/error-view.md)
- [Form Field](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/form-field/form-field.md)
- [Popover](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/popover/popover.md)
- [Pressable Feedback](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/pressable-feedback/pressable-feedback.md)
- [Radio Group](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/radio-group/radio-group.md)
- [Scroll Shadow](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/scroll-shadow/scroll-shadow.md)
- [Select](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/select/select.md)
- [Skeleton](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/skeleton/skeleton.md)
- [Skeleton Group](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/skeleton-group/skeleton-group.md)
- [Spinner](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/spinner/spinner.md)
- [Surface](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/surface/surface.md)
- [Switch](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/switch/switch.md)
- [Tabs](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/tabs/tabs.md)
- [Text Field](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/text-field/text-field.md)
- [Toast](https://raw.githubusercontent.com/heroui-inc/heroui-native/refs/heads/beta/src/components/toast/toast.md)

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
