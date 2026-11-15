# Downloads e2e tests

Downloading an episode from the episode actions sheet, then the Download queue: the card, cancelling and removing. Every test starts with `../_shared/start-<platform>.yaml`. Read `../README.md` first.

| Flow | Steps | Touches | Back to back? |
|---|---|---|---|
| `download-episode` | First Trending (Android) / Popular (iOS) anime → long-press EP 1 → Download → server `megaplay-vidstream-1` → quality `auto` → back → More › Download queue → `download-card` shows → Cancel → confirm (`downloads-cancel-dialog`) → Remove → confirm (`downloads-remove-dialog`) → `downloads-empty` → back | network, FFmpeg and (Android) the download foreground service for a few seconds, a partial file that Remove deletes along with its empty show and season folders. The queue ends empty | Yes |

Both platforms, two passes in a row on 2026-11-14. Needs an empty queue at the start and an anime provider that lists `megaplay-vidstream-1` (AniKoto). The test picks vidstream because megaplay-hd downloads fail early (it puts a PNG in front of each HLS segment; see CLAUDE.md).

`../settings/downloads-<platform>.yaml` opens the queue screen from Settings.

## Bugs found

| Found | Bug | Where | Found by |
|---|---|---|---|
| 2026-11-14 | **"Storage Used" stayed at the cancelled download's size after removing it** (59.66 MB with nothing in the queue), until the screen was opened again. The size was only re-measured when the set of completed downloads changed. **Fixed:** it re-measures when any download is added, removed or changes status. | `src/downloads/useDownloadStore.ts` (`useDownloadsSize`) | `download-episode-android` |
| 2026-11-14 | **Removing a download left its show and season folders behind, empty** (`Inception/Season 1`, `JUJUTSU KAISEN`, …). **Fixed:** the last episode's folders go with it. Folders left by earlier removals stay until removed by hand. | `src/downloads/files.ts` (`deleteOutputFile`) | `download-episode-android` (checked with `adb shell run-as … ls`) |
| 2026-11-14 | **The download card's Remove (trash) button has no accessibility label.** | `src/app/(settings)/downloads.tsx:181-183` | `download-episode-*` |
| 2026-11-14 | **On Android TV the empty queue says "Long press an episode"**; on TV that's holding OK. | `src/app/(settings)/downloads.tsx:242` | TV pass |

## Quirks

- **`download-episode` removes the first download card it finds.** Only run it with an empty queue. On 2026-11-15 a run with another download in the queue deleted that download (JUJUTSU KAISEN E01) instead of its own.

- A cancelled card moves from the Downloading section to Failed ("Cancelled"). A tap during that move is lost: wait `await: { idle: true, stableFor: 800 }` before tapping Remove.
- The card can already have failed by the time the queue opens (a provider or FFmpeg error), so Cancel is under a `when:`; Remove works in every state.
- Server and quality rows share `episode-action-server` / `episode-action-quality`; pick one by its text (`megaplay-vidstream-1`, `auto`).
- iOS: More's Download queue row is SwiftUI, so it's a raw tap at its describe frame (y 0.572–0.637 with incognito off).

## Not tested

- A download running to completion (minutes per episode), playing it from the queue, opening it in another app, and the downloaded badge on the episode row.
- Clear completed / Clear all, several downloads queued at once, and downloads surviving an app restart.
- The background notification and its "Getting ready…" text.
