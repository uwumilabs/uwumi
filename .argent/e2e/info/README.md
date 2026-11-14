# Info e2e tests

Anime, movie/TV and manga info screens: the episode list and its display modes, the episode actions sheet, seasons, the chapter list, favorites, and the cover preview. Every test starts with `../_shared/start-<platform>.yaml`. Read `../README.md` first.

| Flow | Steps | Touches | Back to back? | Platforms (all 2 passes, 2026-11-14) |
|---|---|---|---|---|
| `anime-info` | First Trending (Android) / Popular (iOS) anime → episode list → display mode full → title only → number only → full (read from the first row's label) → long-press EP 1 → actions sheet (watched, external player, download, share rows) → close → header "Add to favorites" → "Remove from favorites" → cover → image preview → close → back | network. Favorites and display mode end as they started (iOS unfavorites first under a `when:` if an earlier run died midway). Needs: that anime isn't a favorite yet, display mode on full | Yes | Android, iOS |
| `movie-info` | Movies search "breaking bad" → first result → episode list → season select Season 2 → Season 1 → back → clear the search → remove the "breaking bad" recent search the result tap added → leave | network, a movie provider (VegaMovies). Recent searches end as they started; the season is session state and is set back | Yes | Android, iOS |
| `manga-info` | Manga search "sousou no frieren" → first result → chapter list → scroll to chapter 1 → order toggle → newest first → back to first-chapter-first → back, clear the search, remove the recent search the result tap added → leave (iOS: edge swipe) | network, a manga provider with the title (rows read "Ch.001" on MangaHere, "Chapter 1" on MangaPill). Recent searches end as they started | Yes | Android, iOS |

## Bugs found

| Found | Bug | Where | Found by |
|---|---|---|---|
| 2026-11-14 | **Share says "Watch <title> on uwumi" for manga too.** | `src/utils/share.ts:54` | `manga-info-android` (header Share on a manga) |
| 2026-11-14 | **The episode display-mode toggle has no accessibility label or role**: an icon-only hand-rolled `Pressable`, read as nothing by TalkBack and VoiceOver. | `src/components/episode-list/EpisodeList.tsx:552-566` | `anime-info-android`, `anime-info-ios` |
| 2026-11-14 | **The episode actions sheet's Close/Back button has no accessibility label.** | `src/components/episode-list/EpisodeActionsSheet.tsx:310-318` | `anime-info-android`, `anime-info-ios` |
| 2026-11-14 | **Episode rows' accessibility labels contain icon-font glyphs** between the parts: "EP 1, , , , Oct 20, 1999". | `src/components/episode-list/EpisodeList.tsx:90-99` (the row aggregates Ionicons glyph text) | `anime-info-*` |
| 2026-11-14 | **The cover preview doesn't hide the screen behind it from screen readers**: the info screen, the episode rows and the header's Share and favorite stay reachable. | `src/components/ImagePreview.tsx:47-52` | `anime-info-android` |
| 2026-11-14 | **The hidden "Back to top" button stays in the accessibility tree** (opacity 0, `pointerEvents` none, still focusable). | `src/components/ListJumpBar.tsx:30-33` | `manga-info-android` |

## Quirks

- The info screen scrolls under the transparent native header, so a control under the header gets the header's tap. Scroll targets below it first (the manga test scrolls to Ch.1).
- Episode rows share `episode-row`; pick one by its label: `{ id: episode-row, text: { matches: '^EP 1,' } }`. The label encodes the display mode (`^EP \d+, [^-]` full, number-only `^EP \d+, [-], `).
- Glyph characters (U+E000-U+F8FF) appear in row text, so regexes must allow for them.
- Android `NativeList` rows put the id on the row and the text on a child: `{ text: x, within: { id: recent-search } }`.
- The header's Share and favorite are native toolbar items: `{ text: Share }`, `{ text: Add to favorites }`, `{ text: Remove from favorites }`.

## Not tested

- Webview and Trailer: they open an external browser.
- The episode sheet's actions themselves (mark watched, external player, share): `downloads/` covers the download action.
- Provider switching on the info screen.
