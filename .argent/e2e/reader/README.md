# Reader e2e tests

The manga reader: opening a chapter from manga info, its pages, and chapter navigation. Every test starts with `../_shared/start-<platform>.yaml`. Read `../README.md` first.

| Flow | Steps | Touches | Back to back? | Platforms |
|---|---|---|---|---|
| `reader` | Incognito on (More) → Manga → Popular See more → first manga → chapter list (scroll to chapter 1) → newest first → open the newest chapter → pages (`reader-page`) → swipe to the chapter-start page → Previous chapter → its pages → back to info → back to Manga → incognito off | network. Incognito is on for the run, so no reading progress is saved; it ends off (Android first turns it off if a failed run left it on). Chapter order is screen state | Yes | Android, iOS (2 passes each, 2026-11-14) |

## Bugs found

None on the phone runs. On Android TV the reader can't be used at all (focus never reaches the pages): see `../tv/README.md`.

## Quirks

- The default reading mode is paged. `scroll-to` can't turn pages (momentum-free swipes snap back), so reaching the last page needs one swipe per page. The test uses Previous chapter from the chapter-start page instead (`swipe: right` from page 1).
- The chapter list renders rows only near the screen, so `scroll-to` chapter 1 (the row under the order toggle) instead of waiting for a row to exist. Plain `scroll-to` a `chapter-row` overshoots past the toggle.
- Providers fail on their own: MangaHere returned 404 for a Jujutsu Kaisen chapter ("Couldn't load this chapter", with Retry). That's a provider failure, not an app bug; pick a title the provider still serves (MangaHere removed One Piece).

## Not tested

- Next chapter (one swipe per page in paged mode), long-strip mode, zoom, tap zones, and the reader settings changing behaviour.
