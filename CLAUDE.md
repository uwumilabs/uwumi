# uwumi

Keep this file current: when a session finds a lasting gotcha, rule or workflow, add it to the matching section in the same turn, as a short bullet, and say so in the reply.

Anime, manga and movie/TV streaming app. Expo SDK 58 on `react-native-tvos` 0.88 (New Architecture), expo-router, for Android phones, Android TV (the same APK, via `plugins/withAndroidTV.js`) and iOS (sideloaded IPA). tvOS is shelved: several pods have no tvOS support.

Main libraries:
- **UI:** heroui-native, `@expo/ui` (Compose and SwiftUI, in `src/components/native`), uniwind (Tailwind `className`).
- **Animation and gestures:** Reanimated 4.7 with worklets, Gesture Handler v3 hooks.
- **Lists:** FlashList v2.
- **State and data:** zustand + MMKV, TanStack Query.
- **Media:** react-native-video (a git fork) with react-native-video-toolkit for the player, and `react-native-ffmpeg-kit` for downloads.

Content comes from `react-native-consumet` extensions.

## Sibling repos (the user maintains all of them)

- `../react-native-consumet`: the providers. Extensions load at runtime from a signed registry, so a provider fix ships through the registry (CI signs it after the user approves the `registry-signing` environment), with no app build.
- `../react-native-video-toolkit`: the player UI (`VideoProvider`, `useVideoSelector`, settings sheets).
- `../ffmpeg-kit/react-native`: the `react-native-ffmpeg-kit` fork (FFmpeg n6.0). Fix bugs in its source and bump its version so the user can publish a beta. Don't use patch-package or a `file:` dependency for it.

## Commands

```sh
yarn start                  # Metro on 127.0.0.1:8081 (LAN-IP URLs don't load here)
yarn android | yarn ios     # dev build
yarn prebuild:phone | yarn prebuild:tv
npx tsc --noEmit -p .       # typecheck
npx eslint <files>          # lint (yarn lint runs --fix over the whole repo)
npx prettier --check <files>
yarn perf                   # profiling harness (src/perf/perfHarness.tsx)
yarn dash                   # Next.js site in dash/ (own yarn install, excluded from root configs)
```

`android/` and `ios/` are generated (`expo prebuild --clean` wipes them). Native config belongs in `app.json` and `plugins/`.

## How the user wants work done

- **Git:**
  - Commit only when asked.
  - Never push, tag, release (`yarn release`) or publish an OTA (`yarn ota`). The user does those.
  - Commits are one line: `type(scope): subject`, lower-case, no body. The subject must be at least 10 chars with no trailing period, and the header at most 100 chars (types in `commitlint.config.js`).
  - No AI attribution in commits or PRs.
- **The pre-commit hook takes the whole tree.** It runs lint and format, then `git add .`.
  - To split commits, stash the other files first. Check for staged work, and use `git stash pop --index`.
  - Don't stash `ios/` or `android/` while a native build is running.
- **Secrets:** `.env` holds `GITHUB_TOKEN` and `UWUMI_KEYSTORE_PASSWORD`, and the release keystore lives outside the repo. Never print, copy or commit them.
- **Code style:**
  - Match the surrounding code.
  - Keep comments minimal: only a short *why* for code that isn't obvious, never on simple props.
  - Don't rename existing components.
- **Code layout:**
  - No barrel (`index.ts`) files: import each thing from the file that defines it. They made every UI primitive depend on every store.
  - Only routes go in `src/app/`. expo-router registers every file there as a screen, so a route's pieces live in `src/components/<feature>/` (`watch/`, `info/`, `episode-list/`).
  - Downloads are one feature folder, `src/downloads/` (`model.ts` types and status rules, store, FFmpeg arguments and probe, sprites, background service, file paths).
  - `src/utils/` holds pure helpers, split by what they're about: `tv.ts`, `format.ts`, `http.ts`, `files.ts` (app folders, file URIs), `share.ts`, `haptics.ts` (skips TV), `subtitles.ts`, `seekPreview.ts`, `manga.ts`, `media.ts` (`MediaItem`, titles, meta providers, `MEDIA_TABS`), `episodes.ts` (episode fields and labels, uniqueId format), `routes.ts` (every route's params, hooks and hrefs, the share link, `SETTINGS_SCREENS`).
  - App services that use stores live in `src/services/`: `backup.ts`, `episodeAlerts.ts` (scheduling and opening alerts), `cache.ts`, `notifications.ts`.
  - The reader's pieces are in `src/components/reader/`; the player's seek bar in `src/components/watch/slider/`.
  - Launch work goes in `src/bootstrap.ts`, which the root layout imports once. It must be safe to run twice (Fast Refresh).
- **testIDs** (for argent e2e tests in `.argent/e2e/`), kebab-case:
  - Every screen's root view: `<screen>-screen` (`anime-screen`, `info-screen`, `watch-screen`, `downloads-screen`, …).
  - Controls: `<screen>-<what>` (`downloads-clear-all`, `search-input`). A shared component uses its own name (`media-card`, `episode-row`), not a screen's.
  - Repeated items (cards, rows, chips) share one id. Never put an index, a data id, a title or a count in a testID; a test picks one item by id plus text.
  - `NativeList.Item`, `Select`, `ChoiceRow` and `ConfirmDialog` take a `testID` prop. `Select` options get `<testID>-option`, a dialog's buttons `<testID>-confirm`/`-cancel`, a row's action button `<testID>-action`.
  - A component that renders a pressable for its caller accepts `testID` and passes it on. Tabs are `tab-anime`, `tab-manga`, `tab-movies`, `tab-more` (phone and TV).
  - The player's own parts have the toolkit's ids (`video-play-button`, `video-settings-rate`, `video-up-next`, …; listed in the toolkit's docs/content/docs/testing.mdx). Rows uwumi adds to its settings menu use the same `video-settings-` prefix (`video-settings-server`); uwumi's other player buttons are `watch-<what>` (`watch-back`, `watch-next`).
- **UI primitives:**
  - Use heroui-native first (`Button` with `size`/`variant`; RN `ActivityIndicator` for spinners). Use the components in `src/components/native` for native controls.
  - For player panels, use the toolkit's `gestureProps`.
  - No hand-rolled Pressable chips, and no BottomSheet or portal hacks.
- **Visible behaviour:**
  - Don't change or remove existing animations as part of perf work. Report the trade-off instead.
  - Don't redesign the tabs. Phones keep NativeTabs; TV has the left rail in `src/components/TVTabs.tsx`. Both draw from `TABS` in `src/components/homeTabs.ts`.
- **Aniyomi and Mihon** are the UI reference (screenshots in `docs/aniyomi-reference/`). Copy the look but keep uwumi's data model: anime / manga / movies (TMDB), favorites instead of a library, no trackers or categories.
- **TV testing:** report anything that feels unintuitive compared with mainstream TV apps (focus, Back, press count), not just bugs.

## Gotchas

**Dependencies and patches**
- `yarn remove` (and some other dependency changes) skips `postinstall`, which silently reverts `patches/`. Run `npx patch-package`, then check each patch with `patch --dry-run -R -p1 -s -f < patches/<file>`.
- `react-native-video` is a git fork, so `patch-package` diffs it against npm and produces garbage. Write its patch by hand.
- Expo modules marked 📦 in the Android build log link prebuilt AARs, so patches to their Kotlin do nothing. Add the module to `expo.autolinking.android.buildFromSource` in `package.json` (`expo-ui` is already there).
- RN 0.86+ removed `StyleSheet.absoluteFillObject`. A library that spreads it collapses to 0 size without a warning.

**Android builds**
- R8 is on. Classes reached through reflection or JNI need keep rules in `app.json` → expo-build-properties `extraProguardRules`; `proguard-rules.pro` gets regenerated. After changing dependencies, launch a release APK to check.
- `src/scripts/build-android.sh` re-signs release APKs with key rotation (lineage file in `signing/`).

**iOS builds**
- Keep `usePrecompiledModules: false`. Expo's precompiled modules crash on react-native-tvos.
- After `yarn install`, run `bash node_modules/expo-modules-jsi/apple/scripts/create-stub-xcframework.sh`, then `pod install`. Yarn deletes the ffmpeg-kit xcframeworks and the stub.
- If linking fails on `RCTPackagerConnection`, or launch crashes on a missing `CDPDebugAPI`, Release core or Hermes frameworks were left in Pods. See `plugins/withRnCoreFlavorMarker.js`; `build-ios.sh` restores Debug on exit.
- A build that breaks right after an Xcode update with "Please submit a bug report" is a compiler crash. Check the expo-modules-core changelog before patching anything.

**Metro and Fast Refresh**
- When you add a new `X.ios.tsx` or `X.android.tsx`, the running Metro doesn't pick it up. `touch` the importing file or restart with `--clear`. Keep the base file platform-neutral.
- `babel-plugin-module-resolver` (just `@` → `src`) stays only for `src/scripts/build-android.sh`'s `npx react-native bundle`: the community CLI doesn't read tsconfig paths, while Expo's CLI does. That path's Metro cache (`$TMPDIR/metro-cache`) also ignores `babel.config.js` changes, so clear it after editing the Babel config.
- Fast Refresh can keep stale code for zustand store modules (`src/hooks/stores/*`, `src/downloads/useDownloadStore.ts`). After editing one, do a full reload (double R, or dev menu → Reload) before testing. A LogBox frame pointing at a comment line means the app is running old code.

**UI**
- No Reanimated layout animations (`entering`, `exiting`, `layout`, `sharedTransitionTag`) on FlashList cells or on views that mount and unmount in bulk. They crash Fabric with `addViewAt IndexOutOfBounds`.
  - Use heroui `Skeleton` with `animation={false}`.
  - For fire-and-forget effects, prefer Reanimated CSS animations (`css.keyframes`).
- Import `Easing` from `react-native-reanimated`, not `react-native`, inside worklets.
- uniwind only styles RN core views and `withUniwind` wrappers. A third-party native view styled with `className` renders 0×0, so wrap it.
- Every inline iOS SwiftUI `Host` in a scrolling screen needs `ignoreSafeArea="container"`.
- uwumi renders the player's seek bar itself: it passes its own `Slider` (`src/components/watch/slider`) to the toolkit through `videoComponents`. Player additions to the seek bar go there, for example `SeekPreview`.
  - Seek previews come from `useSeekPreviewStore`: the provider's `thumbnails.vtt` while streaming, or the sprites saved beside a download.
- The toolkit's `VideoProvider` is global (`src/components/watch/AppVideoProvider.tsx`, in the root layout), and its `ended` flag stays true until the next source loads. So the watch screen only renders `VideoPlayer.UpNext` once its own source has loaded (`phase === 'playing'`). Otherwise a new episode counts down to the one after it before it plays.
  - Saved progress that's completed, or within 10 s of the end, starts the episode from 0. Resuming at the end would end it at once and set off the same chain.
  - `@expo/ui`'s Compose `Slider` takes a plain `value` and a JS `onValueChange` (58.0.27). Its `useNativeState` and `useWorkletCallback` only work with `TextField`, `SyncSwitch`, `LoadingIndicator` and some modifiers.
- Read zustand stores with selectors, never `useXStore()` whole. In the player, use `useVideoSelector`, not `useVideo`. Rows read small stores rather than taking new props.
- Don't call `openBrowserAsync` directly. Use `openBrowser()` from `src/utils/share.ts`, or Android shows a second task in recents.
- Pure black is resolved once, and only in dark themes: use `useCurrentTheme()`'s `screenBackground`, `sheetBackground` and `railBackground` for colours, and its `isPureBlack` for `bg-black` classes, rather than reading `usePureBlackBackground`.
- Routes go through `src/utils/routes.ts`: read params with `useShowParams`/`useInfoParams`/`useWatchParams`/`useReaderParams`/`useBrowseParams`, build hrefs with `infoHref`, `watchHref`, `episodeWatchHref`, `readerHref`, `browseHref`, `searchHref`, and settings screens with `SETTINGS_SCREENS` (the stack titles, More and Settings rows). Continue watching and downloads save `watchHref(...).params` to open the episode again.
- The info screen's title and poster are `useShownTitle()`: the card's until the info loads (a shared link may carry neither).
- Home rows use `CardRow` (`src/components/TVRow.tsx`) with `ROW` and `rowCardWidth`; media tabs (favorites, history, statistics) map `MEDIA_TABS`.
- Pick-one setting rows are `ChoiceRow` inside a `ChoiceRowHost`. A heroui Dialog can't sit inside a `NativeList`: its root `View` would land in the Compose/SwiftUI host.
- Watch history keeps its own rules: `useWatchProgressStore.savePlayback` (incognito, forward only, the watched percent setting) and `toggleWatched`, and Continue watching's `record` skips incognito too. Don't write `progresses` from screens.
- Worklet runtimes (`runOnRuntimeAsync`) are only for pure, high-frequency work whose input is already off the JS thread. The FFmpeg progress parsing is the only current case.

**Downloads (FFmpeg n6.0, `src/downloads/`)**
- FFmpeg n6.0 has no `-extension_picky`. Use `-allowed_extensions ALL` for disguised HLS segments, but only when the probe says the input is HLS. For a direct file (VegaMovies' MKVs), FFmpeg rejects HLS options with "Option … not found".
- `session.getOutput()` is every log line joined together, so decoder errors land inside FFprobe's JSON. Parse only the `Level.AV_LOG_STDERR` entries.
- `ReturnCode` is an object: use `getValue()` in messages.
- When FFmpeg 6.0 converts a source's own subtitles to `mov_text`, it writes their language as `und`, so players list them as "Track 1, 2". MP4 also drops track titles. The download command sets each subtitle's language explicitly (`-metadata:s:s:N language=…`), from the probe for embedded tracks and from the provider for external ones.
- Some CDNs (NetflixMirror's) break FFmpeg's reused HLS connections, so only the first (audio) playlist loads. When the probe finds no video, it retries with `-http_persistent 0`.
- Some servers (megaplay-hd) put a 1×1 PNG in front of each HLS segment's MPEG-TS data. ExoPlayer resyncs past it, so streaming works. FFmpeg 6 reads the segments as a `png` picture with no audio, and has no option to force the segment format. Such downloads fail early with "Try another server" (megaplay-vidstream works).
- Downloads live in app storage (`UWUMI_DIR/downloads`). There's no migration from the old shared folder.
- A download is `downloading` from the moment its probe starts. FFmpeg's `sessionId` (in memory only) appears once it runs; `isPreparing()` tells "Getting ready…" from real progress, and `isActive()` is running or queued.
- `download()` records failures on the download instead of throwing, so read the status it resolves with. FFmpeg sessions outlive a JS reload; `initialize()` cancels them and fails the records they leave behind.

**Backup**
- `src/services/backup.ts` lists every value a backup keeps in its `LIBRARY`, `SETTINGS` and `PREFERENCES` tables. A new persisted setting isn't backed up until it has an entry there. Keep the file format (`FORMAT`) readable by older backups.

**Consumet and extensions**
- When a provider doesn't find the title, the episode has no `id`. It still opens; the watch screen and the episode actions sheet show "Not on <provider>" (`notOnProvider()` in `src/utils/episodes.ts`).
- Installed extensions are `useExtensionStore`'s `installed` state (with `installedExtensions()` and `updateAvailable()`). Don't read the `ext_` MMKV keys for that; only the store's actions write them.
- Providers' sources come from `watchQueries` already cleaned up (`PlayableSource`: subtitles typed, the thumbnails track split out, headers as strings). The player, the episode sheet and downloads all take that shape.
- Don't rename the registry key `extension_registry_v2`. Keep the watch screen's `listedEpisode` lookup: it maps old Continue Watching keys.
- The app runs providers from the registry cache and checks their sha256, so rsyncing consumet into `node_modules` doesn't change a provider. To try an unpublished provider fix in a dev build:
  1. Build its bundle in a scratch copy of consumet (`tsc -p tsconfig.dist.json && node scripts/build-extensions.js && node scripts/hermes-safe-dist.js`).
  2. Push it to `files/uwumi-dev/dev-extensions/<id>.js` (`adb push`, then `run-as com.x2004durgesh.uwumi cp`).
  3. Reload. `readDevExtension` in `useExtensionStore.ts` runs it unverified.
  - Extractors still come from the registry.
  - Delete the folder when you're done.

**OTA and links**
- OTA bundles are assets on GitHub release `v<version>`. A new bundle only loads in a fresh process (Force stop, open, then Force stop and open again). About shows the stored bundle, not the running one.
- Share links are `https://uwumi.vercel.app/info/<mediaType>?…`, with the same query as `uwumi://info/…`.

## Testing on devices

- **Android emulators:**
  - `Pixel_10` (phone) and `Android_TV_14` (D-pad on the Mac keyboard).
  - Serials follow boot order, so check with `adb -s <serial> emu avd name` and always pass `-s`. With both running, `adb -s <serial> reverse tcp:8081 tcp:8081`.
  - Package `com.x2004durgesh.uwumi`.
- **Deep link to an info page:** `adb -s <serial> shell "am start -a android.intent.action.VIEW -d 'uwumi://info/movie?id=27205&metaProvider=tmdb&type=Movie&title=Inception' com.x2004durgesh.uwumi"`. The provider is the saved one; switch it from the dropdown.
- **Turn off the dev menu's Tools button** (the floating gear) when testing. It intercepts taps and D-pad focus, and broke iOS player rotation.
- **LogBox toasts** sit over the bottom of the screen and swallow taps. Dismiss them.
- **zsh** expands `ReactNativeJS:*` as a file pattern. Quote logcat filters: `adb logcat -s 'ReactNativeJS:*'`.
- **TV emulator stale clock:** a quick-booted TV can resume with an old clock, which breaks providers' TLS. Fix with `adb -s <serial> shell cmd alarm set-time $(($(date +%s) * 1000))`.
- **iOS simulator:** you can't tap it. Take screenshots with `xcrun simctl io booted screenshot` and ask the user to navigate.
  - If reload fails with "no permission to save ReactNativeDevBundle.js", delete that file from the app container's `tmp/` and relaunch.
- **Sharing devices:** one session drives an emulator at a time. If the user is tapping, stop driving it, and capture logs instead. A logcat dump can run in the background; logcat keeps its buffer from the last `-c`.
- **Device-only checks:** say what is still untested (iOS, TV, release builds) rather than implying it works.
