# Watch e2e tests

One flow, `anime-watch`, in two files (`anime-watch-android.yaml`, `anime-watch-ios.yaml`) that do the same thing in the player. They differ only in setup: on Android, argent can't tap a landscape screen correctly, so the Android file turns the app's "Rotate to landscape" setting off for the run (and back on after). See Quirks.

The player: an episode from anime info, playback, the controls, the settings menu (speed, servers), the episodes panel, and leaving. The watch screen is fullscreen and landscape only. Every test starts with `../_shared/start-<platform>.yaml`. Read `../README.md` first.

| Flow | Steps | Touches | Back to back? | Platforms |
|---|---|---|---|---|
| `anime-watch` (Android) | Setup: Settings › Player › Rotate to landscape **off** (crop snapshot), More › Incognito **on**. First Trending anime → EP 1 → `watch-screen` → the time leaves 0:00 → show the controls → pause → settings → Rate → 1.5x → Back → value "1.5x" → close → settings → Server row → server list → close → episodes panel → Back closes it → `watch-back` → info. Teardown: Incognito off, Rotate to landscape on (crop snapshot) | network and a video stream. Incognito, so no progress or history is written. **Flips and restores** the incognito and rotate-to-landscape preferences: a run that dies midway leaves them flipped | Yes | Android, 2 passes |
| `anime-watch` (iOS) | First anime → EP 1 → `watch-screen` (rotates to landscape) → playback → controls (play, back, episodes, settings) → settings → speed 1.5x → Back → value 1.5 → close → reopen → back to 1x → close → reopen → Server row → server list → close → episodes panel → swipe it down → `watch-back` → info (back in portrait) | network and a video stream; the speed ends at 1x. Watch progress for EP 1 is saved (not incognito) | Yes | iOS, 2 passes |

## Bugs found

| Found | Bug | Where | Found by |
|---|---|---|---|
| 2026-11-14 | **The player's settings menu shows the raw view id as a title** ("PlaybackRate"), and its Back and Close buttons have no accessibility labels. | react-native-video-toolkit (Menu), not uwumi's `src/` | `anime-watch-android`, `anime-watch-ios` |
| 2026-11-14 | **The hidden up-next card and the hidden controls stay in the accessibility tree** from the first second of an episode ("UP NEXT … Playing in 5s"). | react-native-video-toolkit (UpNext, controls) | `anime-watch-android` |
| 2026-11-14 | On Android TV the player sometimes has no focus, and Back in a settings submenu closes the whole menu: see `../tv/README.md`. | toolkit `src/tv/TVPlayerFocus.tsx`; `src/components/watch/AppVideoProvider.tsx:12-18` | TV pass |

## Quirks

- **argent taps Android in portrait coordinates even when the screen is landscape** (argent 0.32). Every selector tap in the landscape player misses. So `anime-watch-android` turns Settings › Player › Rotate to landscape off for the run and back on at the end. Worth reporting to argent; until it's fixed, Android player tests need rotation off.
- **The first tap on a settings-menu row after the menu's Back is dropped** (both platforms; on Android an `adb` tap works, so it's argent's input path). Tests close the menu and reopen it instead of pressing Back and tapping on.
- The controls hide by sliding away, but stay in the tree. `video-title` (Android) or `video-settings-button` (iOS) being visible means they're up; tap `video` only under a `when:` that checks they're hidden, or the centre tap hits play/pause. Pausing keeps them up while driving menus.
- Gate on `watch-screen`, then `await: { hidden: { id: server-loading }, timeout: 45000 }` and an idle wait of up to 9 s for the rotation.
- The up-next card is in the tree (hidden) for the whole episode: don't assert it visible mid-episode.

## Not tested

- Movie playback (VegaMovies is installed; same shape via movie info).
- Next and previous episode, the up-next countdown at the real end, subtitles and adding subtitles, picture in picture, switching servers (it reloads the stream), the external player.
