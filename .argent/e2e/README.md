# Argent e2e tests: runbook and lessons learned

Replayable UI tests for uwumi, run with [argent](https://github.com/software-mansion/argent). Every test is a YAML file, one per platform: `<flow>-android.yaml` and `<flow>-ios.yaml`. Android TV tests (`<flow>-tv-android.yaml`) replay on the TV emulator with `--platform android`, driving the D-pad with raw `tool: tv-remote` steps (argent's docs say Android TV isn't supported, but replay works); `tv/` also has reference screenshots and the focus review.

```
.argent/e2e/
  README.md          this file: setup, running, writing tests, selectors and platform quirks
  _shared/           start-android.yaml, start-ios.yaml: cold-start uwumi on the Anime tab. Every test runs one first
  navigation/        home tabs, search, browse a feed
  info/              anime, movie and manga info: episode and chapter lists, the episode actions sheet, favorites
  watch/             the player: playback, controls, settings menu, servers, episodes panel
  reader/            the manga reader
  more/              More tab toggles, History, Favorites, Statistics
  settings/          Settings and every sub-screen
  downloads/         downloading an episode, the queue
  tv/                Android TV screenshots of every screen, with the TV focus review
  */__baselines__/   reviewed snapshot images, per test, platform and screen size
```

Each folder has its own README: what every test covers, what it touches, and the bugs found on the way.

## Coverage

Every flow has an Android and an iOS file with the same name. Status on 2026-11-14 (2 = two passes in a row):

| Folder | Flow | Android | iOS |
|---|---|---|---|
| navigation | tabs, search, browse | 2 | 2 |
| info | anime-info, movie-info, manga-info | 2 | 2 |
| watch | anime-watch | 2 | 2 |
| reader | reader | 2 | 2 |
| more | favorites, history, statistics | 2 | 2 |
| more | toggles | 2 | 1 (needs both switches off at the start) |
| settings | settings, appearance, player, reader, downloads, extensions, data, about | 1–2 | 1–2 |
| downloads | download-episode | 2 | 2 |
| navigation, more | tabs-tv-android, history-tv-android (Android TV, D-pad) | 1 each | — |
| tv | screenshots + focus review | 43 screens | — |

Not covered anywhere yet: a download running to completion, movie playback, next/previous episode, subtitles, and anything that writes data (backup, restore, clearing, theme changes). Each folder's README has its own "Not tested" list.

---

## 1. Before you run anything

| Requirement | Why | How to check / fix |
|---|---|---|
| **Metro running from this repo on 8081** (`yarn start`) | Tests load the dev bundle from `127.0.0.1:8081`. | `lsof -iTCP:8081 -sTCP:LISTEN` |
| **Android: `adb reverse tcp:8081 tcp:8081`** on each emulator | The dev client otherwise tries the LAN IP, which doesn't load (see the project memory note on Metro). | `adb -s <serial> reverse --list` |
| **A debug build of the current native code** on each device | `yarn android --device Pixel_10 --no-bundler`, `yarn ios --device "iPhone 18 Pro" --no-bundler`. The TV takes the same APK (`adb -s <tv> install -r android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk`). | About shows the version |
| **At least one anime and one movie extension installed** | Info, watch and download tests need a provider. | More › Extensions › Installed only |
| **Network** | Feeds, info, sources and AniSkip are live. Provider failures (a 404 chapter, a dead server) fail the playback tests without an app bug. | Retry, or try another provider |

Devices used while authoring: Android emulator **Pixel_10** (API 37, `emulator-5556`), iOS simulator **iPhone 18 Pro, iOS 27.2** (`AF03D990-064D-429B-9141-D6E4BD8DA73C`), Android TV **Android_TV_14** (API 34, `emulator-5554`). `argent run list-devices` shows what's running.

---

## 2. Running tests

Run one file at a time and pin the device:

```bash
argent e2e run .argent/e2e/navigation/tabs-android.yaml --platform android --device emulator-5556
argent e2e run .argent/e2e/navigation/tabs-ios.yaml     --platform ios     --device <ios-udid>
```

The path must end in `.yaml`. Don't point it at a folder: Android and iOS files sit side by side.

Sweep one platform:

```bash
for f in $(ls .argent/e2e/*/*-android.yaml | grep -v tv-android); do printf "%-55s " "$f"
  argent e2e run "$f" --platform android --device emulator-5556 2>&1 | grep -E "^(PASS|FAIL)"; done
```

Every test cold-starts the app through `_shared/start-<platform>.yaml` (launch, then open the dev URL so the bundle loads from Metro), so tests don't depend on each other's end state. Tests that change something (a toggle, a favorite, a download) change it back before they end.

Add `--json` for a machine-readable report. When a run fails, the device is still on the failing screen: `argent run screenshot --args '{"udid":"<id>"}'`.

**Snapshots.** `snapshot:` steps compare against `<folder>/__baselines__/<test>/<name>__<platform>-<w>x<h>.png`. Seed or refresh them with `--update-baselines` from a known-good state, look at every image, and commit them only after review. Snapshots are only on static screens (More, Settings and its sub-screens); feeds, posters and the player change all the time.

---

## 3. Writing a test

1. Start from `- run: ../_shared/start-<platform>.yaml`.
2. Explore the screen live (`argent run describe --args '{"udid":"<id>"}'`), then add one step at a time: an action, then an identity `await` that only the destination has, then `await: { idle: true }`.
3. Replay the whole file, fix the first failure, and call it done after two passes in a row.
4. If a screen needs a control without a testID, add one in `src/` following CLAUDE.md's testID rules rather than selecting by position.

The recorder (`e2e-start-recording`, `e2e-add-step`, `e2e-finish-recording`) works too. It writes the take at the top of `.argent/e2e/`; move the polished file into its folder.

---

## 4. Selectors and platform quirks

### Both platforms
- **Select by testID** (`{ id: settings-row-appearance }`). The rules are in CLAUDE.md: `<screen>-screen` on every screen root, `<screen>-<what>` for controls, one shared id for repeated items (`media-card`, `episode-row`, `chapter-row`). Pick one repeated item by id plus text, or take the first.
- **Prove a screen with its root id** (`anime-screen`, `info-screen`, `watch-screen`). Both runners resolve them even where `describe` doesn't list them.
- **Never gate on live data** (titles, episode names, counts). Feeds and search results change.
- **The player's own parts have the toolkit's ids** (`video`, `video-play-button`, `video-settings-button`, `video-settings-rate-1.5`, `video-up-next`…; the list is in the toolkit's `docs/content/docs/testing.mdx`). Its controls hide a few seconds into playback; tap `video` to show them.
- **The watch screen is fullscreen and landscape only.** The app rotates to landscape when it opens and back to portrait on leaving. Take coordinates from a `describe` made after the rotation, wait for `watch-screen` plus `await: { idle: true, timeout: 9000 }` before touching the player, and wait for the previous screen again after Back. No snapshots there.
- **The first tap on a player settings-menu row after the menu's Back is dropped**: close the menu and reopen it instead.
- **Providers differ per device**: the iOS simulator's manga provider labels rows "Chapter 1", Android's MangaHere "Ch.001". Match both.
- **The info screen's Share and favorite buttons** carry accessibility labels ("Share", "Add to favorites" / "Remove from favorites"). On iOS they're native header items without testIDs. On Android the header is a Compose top app bar (`src/components/info/InfoTopBar.android.tsx`) whose buttons also have `info-back`, `info-share` and `info-favorite`.

### iOS
- **About one tap in 16 is dropped within a second of a native push or pop.** Hold `await: { idle: true, stableFor: 800 }` after each screen change and snapshot.
- **The runner reads the UIView tree, which has no SwiftUI content.** Every `NativeList` row (More, Settings, all settings sub-screens) is SwiftUI on iOS, so its id and text can't be selected in YAML. `describe` and `await-ui-element` read the accessibility tree and do see them.
- **No hardware Back.** The native header's back button is `{ id: BackButton }`.

### Android
- **argent taps in portrait coordinates even when the screen is landscape** (argent 0.32), so selector taps in the landscape player miss. `watch/anime-watch-android` turns the app's Rotate to landscape setting off for the run.
- **The native tab bar's inner views share generic ids** (`navigation_bar_item_*`), so the recorder picks those. Always tap `{ id: tab-<name> }`.
- **System Back** is a raw `tool: button` with `button: back`.
- **`describe` flattens layout-only views**, so screen roots don't appear in it, but the runner still resolves them.

---

## 5. Bugs found

Each folder's README lists the bugs its tests found, with dates and code locations. The biggest:

| Area | Bug | README |
|---|---|---|
| TV | The player sometimes has no focus: OK does nothing, and Back leaves instead of hiding the controls (toolkit, open) | `tv/` |
| TV | Manga info, Settings and Downloads open with nothing focused (open) | `tv/` |
| iOS | The search screen has no way back except the edge swipe | `navigation/` |
| iOS | Turning incognito on from More leaves a status-bar gap until you leave More | `more/` |
| Both | Share says "Watch …" for manga | `info/` |
| Both | Missing accessibility labels: episode display toggle, episode sheet close, extension details, download remove, More switches (iOS), accent cards, player menu (toolkit) | `info/`, `settings/`, `more/`, `watch/` |
| Both | The cover preview and the hidden "Back to top" button leave hidden controls reachable by screen readers | `info/` |

Fixed while setting up:

| Found | Bug | Fix |
|---|---|---|
| 2026-11-14 | Every Android debug build offered "The stable release" of its own version at launch: the `-debug` version suffix counted as a pre-release. The dialog also covered the screen for tests. | `src/hooks/useUpdateChecker.tsx`: `isPreRelease` ignores the build suffix |
| 2026-11-14 | Downloads' "Storage Used" kept a removed download's size until the screen was reopened. | `src/downloads/useDownloadStore.ts`: `useDownloadsSize` re-measures on any status change |
| 2026-11-14 | Removing a download left its empty show and season folders behind. | `src/downloads/files.ts`: `deleteOutputFile` removes them |
| 2026-11-14 | TV: dialogs let D-pad focus escape behind them; Back in a player submenu closed the whole menu; the reader couldn't be used; label chips took focus. | `DialogContent`, the toolkit's TV menu panel, reader page focus, non-focusable `Chip` (see `tv/README.md`) |
| 2026-11-14 | Icon glyphs leaked into screen-reader labels, and several icon-only buttons and the iOS switches had no labels. | `Icons.tsx` icons are decorative; labels on the display toggle, sheet close, download remove, extension details, accent cards, iOS list switches |
