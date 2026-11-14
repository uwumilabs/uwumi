# More e2e tests

The More tab's switches (Incognito mode, Downloaded only) and the History, Favorites and Statistics screens it opens. Every test starts with `../_shared/start-<platform>.yaml`. Read `../README.md` first.

| Flow | Steps | Touches | Back to back? |
|---|---|---|---|
| `toggles` | Incognito on → the "Incognito mode" banner shows, also on the Anime tab → off → banner gone. Downloaded only on → off. Android checks each switch with cropped snapshots; iOS reads the switch value (`0`/`1`) from the accessibility tree | preferences `incognito` and `downloadedOnly`, both end off. Needs: both off at the start (the iOS simulator had Downloaded only on as user state) | Yes |
| `history` | More → History → Manga → Movies → Anime tabs → (iOS) Clear history dialog → Cancel → back | nothing (the dialog is cancelled) | Yes |
| `favorites` | More → Favorites → Manga → Movies → Anime tabs → back | nothing | Yes |
| `history-tv-android` | Android TV: rail → More → History → the header's Clear history → the dialog holds the D-pad through presses in every direction → Up, OK on its Close → History still open → back | nothing (the dialog is closed from its X) | Yes |
| `statistics` | More → Statistics → Manga ("Chapters read") → Movies → Anime ("Watched duration") → back | nothing | Yes |

Both platforms have each flow, passing twice in a row on 2026-11-14, except `toggles-ios` (one pass: its second run started with the simulator's own Downloaded only switched on, and the test expects both switches off). Android's `toggles`, `history` and `favorites` keep cropped snapshots of the switches and the selected tab in `__baselines__/`.

## Bugs found

| Found | Bug | Where | Found by |
|---|---|---|---|
| 2026-11-14 | **More's switches have no accessibility label on iOS**: VoiceOver reads only "0" or "1". | `src/components/native/list/List.ios.tsx` (the `Toggle` in `Item`'s toggle branch) | `toggles-ios` |
| 2026-11-14 | **Turning Incognito on while on More leaves a status-bar-tall gap above More's content** on iOS, until you leave More and come back. | `src/app/_layout.tsx:63-85` (`IncognitoFrame`: a stale top inset) | `toggles-ios` |
| 2026-11-14 | **The incognito banner has no testID**, so tests can only find it by its exact text, which More's row title shares on Android. | `src/app/_layout.tsx:72-81` | `toggles-*` |
| 2026-11-14 | **HorizontalTabs' tabs aren't exposed as tabs and have no selected state** (History, Favorites, Statistics, Extensions). | `src/components/HorizontalTabs.tsx:24-31` | `history-ios` |

## Quirks

- iOS: the rows here are SwiftUI, outside the runner's tree. Tests check them with raw `tool: await-ui-element` (`selector: { identifier: <row id> }`) and tap them with raw `tool: gesture-tap` at the describe frame's centre, then prove the destination with its RN screen root (`history-screen`…).
- iOS: row positions depend on layout: the incognito banner pushes rows down, and Settings / Player settings sit under the floating tab bar until More is scrolled to its end.
- iOS: about one tap in 16 is lost within a second of a native push or pop. `await: { idle: true, stableFor: 800 }` after each push, pop and snapshot fixed it.
- Android: with the incognito banner up, `more-row-settings`' centre sits behind the tab bar; go to Settings before turning incognito on.
- Switch state isn't selectable in YAML on Android; it's checked with cropped snapshots plus a behavioural check (the banner).

## Not tested

- History, Favorites and Continue rows themselves: opening, removing and clearing them would change user data.
- Download queue: see `../downloads/`.
- New episode notifications (the system permission prompt).
