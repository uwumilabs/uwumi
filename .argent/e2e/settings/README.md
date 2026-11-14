# Settings e2e tests

Settings and every screen it opens: Appearance, Player, Reader, Downloads, Extensions, Data and storage, About. Every test starts with `../_shared/start-<platform>.yaml`. Read `../README.md` first.

| Flow | Steps | Touches | Back to back? |
|---|---|---|---|
| `settings` | More → Settings (snapshot) → back | nothing | Yes |
| `appearance` | Settings → Appearance (theme, accents, pure black present; snapshot) → back | nothing | Yes |
| `player` | Settings → Player (snapshot) → Default playback speed dialog (`choice-dialog`) → dismiss without choosing (Android: Back; iOS: tap the overlay) → value unchanged → back | nothing | Yes |
| `reader` | Settings → Reader (reading mode row present; snapshot) → back | nothing | Yes |
| `downloads` | Settings → Downloads (the queue loads) → back. No snapshot: the queue is user data | nothing | Yes |
| `extensions` | Settings → Extensions → Movies tab (chips read MOVIES) → Anime tab (ANIME) → Installed only on (Install buttons gone) → off → back | network (the registry); the switch is screen state | Yes |
| `data` | Settings → Data and storage (create backup, clear cache rows present) → back. No snapshot: sizes and the last backup time change | nothing | Yes |
| `about` | Settings → About (version, check for updates rows) → back. No snapshot: the update status line changes with releases | nothing | Yes |

Every flow has an `-android.yaml` and an `-ios.yaml`. On iOS, More → Settings is the shared fragment `../_shared/open-settings-ios.yaml`, because those rows need raw taps there.

All pass on both platforms (2026-11-14). Snapshots of the static screens are in `__baselines__/`.

## Bugs found

| Found | Bug | Where | Found by |
|---|---|---|---|
| 2026-11-14 | **Every Android debug build offered "The stable release" of its own version at launch** (the `-debug` suffix counted as a pre-release). **Fixed.** | `src/hooks/useUpdateChecker.tsx` (`isPreRelease`) | setting up these tests |
| 2026-11-14 | **"Installed only" only toggles on the switch itself on phones**: tapping the label does nothing (the row's `onPress` is TV-only). On iOS the row is one accessibility element whose activation does nothing, and the switch inside is hidden from VoiceOver. | `src/app/(settings)/extensions.tsx:414-425` | `extensions-android`, `extensions-ios` |
| 2026-11-14 | **The extension Details (i) button has no accessibility label.** | `src/app/(settings)/extensions.tsx:148-150` | `extensions-*` |
| 2026-11-14 | **Appearance's accent cards have no label or selected state** (the name is a sibling Text). | `src/app/(settings)/appearance.tsx:105-111` | `appearance-ios` |
| 2026-11-14 | **Choice dialogs have no Cancel button**: only Back or a tap outside closes them, unlike Aniyomi's list dialogs. | `src/components/ChoiceDialog.tsx:28-60` | `player-android`, `player-ios` |
| 2026-11-14 | **The Download card's Remove button has no accessibility label.** | `src/app/(settings)/downloads.tsx:181-183` | `downloads-android` |

## Quirks

- iOS: every row on these screens is SwiftUI, outside the runner's tree. Rows are checked with raw `tool: await-ui-element` and tapped with raw `tool: gesture-tap` at the describe frame's centre (commented in each file); the destination is proven with its RN screen root (`appearance-screen`, `about-screen`…).
- iOS: SwiftUI switches show in `describe` as `AXButton value="0|1" id=<row id>`; a raw `await-ui-element` with `condition: text` and `expectedText` reads their state.
- iOS: give each push and pop `await: { idle: true, stableFor: 800 }` before the next tap; without it about one tap in 16 is lost.
- Android: snapshots of whole screens are stable; for switch state, crop with `cropOn` and pair with a behavioural check.

## Not tested

- Anything that writes: theme and accent changes, backup create/restore, clear cache/history/progress/searches, extension install/uninstall/update.
- Check for updates and the OTA download (network and a real release).
- Example (a dev-only screen).
