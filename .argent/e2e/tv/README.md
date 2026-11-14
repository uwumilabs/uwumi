# Android TV: screenshots and focus review

Argent has no e2e runner for Android TV, so this folder holds reference screenshots of every screen (1920×1080, Android_TV_14 emulator, API 34) and a D-pad review against mainstream TV apps (Netflix, YouTube, Google TV). Compare a new build by eye: drive each path below and check the screen against its picture. Read `../README.md` first.

Taken on 2026-11-14 with the dev client on Metro (`adb -s <tv> reverse tcp:8081 tcp:8081`, then the dev URL; see `../_shared/start-android.yaml`, which the TV can't run as a test). Keys: `D`/`U`/`L`/`R` = D-pad, `OK` = centre, `Back` = Back; "rail" is the left tab rail.

Side effects of the pass: network only. Frieren EP 1's progress moved (the player played), and two recent searches were added. Nothing was favourited, downloaded, cleared or changed in settings.

## Screenshots

| File | Screen | How to reach it (from a cold start on Anime) |
|---|---|---|
| tv-navigation-anime.png | Anime home, Continue watching focused | Cold start, then `U` `D` (the first Trending card has focus at launch) |
| tv-navigation-rail.png | Rail expanded | From any home content: `Back` (or `L` at a row's first card) |
| tv-navigation-manga.png | Manga home | Rail: `D` `OK` (focus jumps to the Continue reading card) |
| tv-navigation-movies.png | Movies home (one row, Trending, by design) | Rail: `D` `D` `OK`, then `D` |
| tv-navigation-search-recent.png | Search as it opens: IME up, Recent searches | Anime home: `U` `U` (search bar) `OK` |
| tv-navigation-search-results.png | Search results for "frieren" | Type with the IME (or `adb shell input text`), `D` `D` `D` `R`x6 to the IME's Search key, `OK`, then `D` |
| tv-navigation-browse.png | Browse "Trending Anime" (See all) | Anime home: Trending row, `R` to the end (10 cards, then the See all tile), `OK` |
| tv-info-anime-top.png | Anime info (Frieren), top | Search result `OK`, then `U` until the header shows |
| tv-info-anime-episodes.png | Anime info, episode list window | Info: `D` until an episode row has focus |
| tv-info-anime-more-like-this.png | Anime info, More like this (after the episodes) | Info: `D` x29 through the 28 episodes |
| tv-info-episode-actions.png | Episode actions sheet | Focus an episode row, hold `OK` |
| tv-info-episode-actions-servers.png | Sheet: Download, Select Server | Sheet: `D` `D` (Download) `OK` |
| tv-info-movie.png | Movie info (Inception) as it opens | Movies: `U` (search) `OK`, type "inception", Search key, `D` `OK` |
| tv-info-movie-top.png | Movie info, top | Movie info: `U` x3 |
| tv-info-provider-select.png | Provider Select sheet (one movie provider) | Movie info: `OK` on the VegaMovies dropdown (it has focus at open) |
| tv-info-manga-top.png | Manga info (Bireomeogeul Hwansaeng) | Manga home: `D` (Trending) `OK` |
| tv-info-manga-chapters.png | Manga info, chapter list | Manga info: `D` x6 (description, Trailer, More like this, provider, chapter) |
| tv-reader-reader.png | Reader, paged, Ch.001 (a webtoon page shown as a thin strip) | Manga info chapter row `OK` |
| tv-reader-error.png | Reader error state (MangaHere 404) | Manga home: Continue reading card `OK` (Jujutsu Kaisen) |
| tv-watch-playing.png | Player, playing, controls hidden (Skip intro shown) | Info episode row `OK`, wait for playback |
| tv-watch-controls.png | Player, controls shown | Player: `D` then `U` (see the bugs: the first key is sometimes lost) |
| tv-watch-settings.png | Player settings menu | Controls: `U` `U` (top row) `R` (settings) `OK` |
| tv-watch-settings-rate.png | Player settings, Rate submenu | Settings menu: `D` x4 (Rate) `OK` |
| tv-watch-episodes.png | Player episodes panel | Controls: `D` `D` (progress bar, then episodes button) `OK` |
| tv-watch-provider-selection.png | Provider Selection dialog | Episodes panel: `U` (provider chip) `OK` |
| tv-more-more.png | More tab | Rail: More (`D` x3) `OK`, `R`, then `U` to the top |
| tv-more-history.png | History | More: History row `OK` |
| tv-more-history-clear-dialog.png | Clear history confirm dialog | History: `D` `R` `U` `U` (Clear history icon) `OK` |
| tv-more-downloads.png | Download queue (empty) | More: Download queue `OK` |
| tv-more-favorites.png | Favorites (empty) | More: Favorites `OK` |
| tv-more-statistics.png | Statistics | More: Statistics `OK` |
| tv-settings-settings.png | Settings | More: Settings `OK` (no row focused at open) |
| tv-settings-appearance.png | Appearance | Settings: `D` (Appearance) `OK` |
| tv-settings-player.png | Player settings, top | Settings: `D` `D` `OK` |
| tv-settings-player-bottom.png | Player settings, bottom | Player settings: `D` x12 |
| tv-settings-reader.png | Reader settings | Settings: `D` x3 `OK` |
| tv-settings-downloads.png | Settings, Downloads (the same screen as Download queue) | Settings: `D` x4 `OK` |
| tv-settings-extensions.png | Extensions | More: Extensions `OK` (or Settings: `D` x5 `OK`) |
| tv-settings-extension-details.png | Extension details sheet | Extensions: an Uninstall button, `R` `U` (the (i) button) `OK` |
| tv-settings-data.png | Data and storage | More: Data and storage `OK` |
| tv-settings-choice-dialog.png | Choice dialog (Automatic backups) | Data: `D` x3 `OK` |
| tv-settings-about.png | About, top | Settings: `D` x7 `OK` |
| tv-settings-about-bottom.png | About, bottom | About: `D` x8 |

## Bugs found

| # | Found | Screen | Steps | Actual vs expected | Where |
|---|---|---|---|---|---|
| 1 | 2026-11-14 | Player | Open an episode (Continue watching card, or an episode row). Let the controls auto-hide, or press `D` right after it loads. | Intermittent, reproduced 3 times: nothing in the player has focus. `OK`, `U` and `D` do nothing (no controls, no pause). Only some later key (once `L`) brings the controls back. `Back` with the controls up then leaves the player at once instead of hiding them. Expected: the player holds focus from the moment it opens, so `OK` always shows the controls or pauses, and `Back` hides the controls first. On the other runs it worked. | Toolkit `src/tv/TVPlayerFocus.tsx`: nothing gives the player initial focus (`surfacePreferred` at :46 needs target `'surface'`, which starts `null`). The "controls hid, so focus the surface" rule at :139 only runs when `getHolder() !== null`. The Back handler (:149) falls through when the holder is `null`. uwumi's watch screen (`app/watch/[mediaType].tsx`) requests no focus either. |
| 2 | 2026-11-14 | Player settings menu | Controls, then settings `OK`, then Rate `OK`, then `Back`. | `Back` closes the whole menu instead of going back to the settings list. The menu is a half-height bottom sheet, so its header (title, X) scrolls away once focus moves down. Expected: Back goes up one level (the toolkit's TV menu does this), and on TV the menu is the toolkit's right-hand side panel. | `src/components/watch/AppVideoProvider.tsx:12-18`: `VideoSheet` swaps in uwumi's native `BottomSheet` (`@expo/ui` modal), which takes Back as dismiss before the toolkit's `BackHandler` (toolkit `Menu.tsx:236-240`) sees it. It also replaces the TV side panel (toolkit `BottomSheet.tsx:188-198`). |
| 3 | 2026-11-14 | Confirm dialog (History "Clear history"; also Data and storage, Downloads) | History: focus the Clear history icon, `OK`, then `D`. | The dialog opens but focus stays on the icon behind it. `D` moves focus behind the dialog (Movies tab, then a Remove button), then into the dialog (X, Clear), then out again. `OK` on a background row would act behind the dialog. Expected: focus starts on Cancel and is trapped in the dialog. The dialog's X has no accessibility label (describe shows "(no label)"). | `src/components/ConfirmDialog.tsx:27-31`: heroui `Dialog` in a portal, with no focus trap and no preferred focus. `UpdateDialog.tsx:14-18` is built the same way: today's fix only hides it in debug builds (`useUpdateChecker.tsx`), so release builds still have the update dialog focus escape. |
| 4 | 2026-11-14 | Choice dialog (Data: Automatic backups; every `ChoiceRow`) | Data: Automatic backups `OK`, then `U` from the first option, or `D` past the last. | Focus starts on the selected option (good), but `U` goes to the header Back button behind the dialog, and `D` goes into the settings list behind it (it scrolled to "Downloads" / "Clear cache"). Expected: focus is trapped in the dialog. | `src/components/ChoiceDialog.tsx:29-34`: heroui `Dialog`, no `TVFocusGuideView` with `trapFocus*` around the options. |
| 5 | 2026-11-14 | Reader (paged, TV) | Manga info, chapter row `OK`. Press `R`, `D`, `L`, `U`. | Focus sits on the header Back button and never enters the pages. The page pill stays at "1 / 19", so there's no way to turn a page, and `OK` leaves the reader. A webtoon page in paged mode renders as a narrow strip about 160 px wide, which can't be read. Expected: the page takes focus at open, `L`/`R` (or `U`/`D`) turn pages, and tall pages fit the width or scroll. | `app/read/[id].tsx:170-176` (TV paged returns the bare page, no initial focus). `components/reader/ReaderPage.tsx:58` (`focusable={isTV}` is never reached from the header). This is the "Manga reader not built for TV" flag from 2026-10-25, still open. |
| 6 | 2026-11-14 | More (and Settings) | More: open Download queue, Favorites, Extensions or Statistics, then `Back`. | Focus comes back to History, the first row of that list group, not the row you opened. On Settings it always comes back to Appearance. Expected: Back returns focus to the row that opened the screen, as Google TV does. | `app/(tabs)/more.tsx:63-101`, `app/(settings)/settings.tsx:15`: each `NativeList` is a Compose `Host` (`components/native/list/List.android.tsx:163-176`). Android restores focus to the host view, and Compose then focuses its first item. |
| 7 | 2026-11-14 | Extensions | Extensions: `D` from the Anime tab. | The first press lands on the "ANIME" label chip (a label, not a control). The (i) details button has no accessibility label (describe shows an empty name). Expected: chips aren't focusable (as on the info screen), and (i) reads "Details" or "About AniKoto". | `app/(settings)/extensions.tsx:124` (`Chip` with no `focusable={isTV ? false : undefined}`; also the chips at :109, :114, :140). The (i) `RippleButton` at :148 has no `accessibilityLabel`. |
| 8 | 2026-11-14 | Extension details sheet | Extensions: (i) `OK`. | Focus lands on the "STABLE" status chip with no visible focus ring, and the sheet scrolls so the extension's name and icon at the top are cut off. Moving down goes from chip to chip (DUB, MegaPlay), also with no ring. Expected: the sheet opens at its top, with focus on a visible control (Close or Install/Uninstall), or as a plain scroll view. | `app/(settings)/extensions.tsx:267-324` (status, content-type, extractor and NSFW chips are focusable on TV). |
| 9 | 2026-11-14 | Manga chapter list | Manga info: `D` to a chapter row. | The full-width row scales up 1.05x on focus, so its focus ring runs off both screen edges (visible in tv-info-manga-chapters.png). Expected: no scale on full-width rows, as EpisodeList's rows do with `focusScale={1}`. | `src/components/info/Chapters.tsx:47`: `RippleButton` with the default `focusScale` (1.05). |
| 10 | 2026-11-14 | Downloads empty state (TV) | More: Download queue. | It says "Long press an episode to access download options." That's phone wording; on TV it's "hold OK". The 2026-10-25 pass said the TV hint mentions the TV action, but there's no TV branch now. | `app/(settings)/downloads.tsx:242` |

## UX flags

Not bugs, but places where uwumi feels different from mainstream TV apps.

| # | Screen | Steps | What happens vs what TV apps do | Where |
|---|---|---|---|---|
| F1 | Info (anime, movie) | Open a title. | Focus starts on the Continue chip (with progress) or the provider dropdown (without). The page scrolls straight past the artwork and title, so you never see the hero unless you press `U` 3-4 times (tv-info-movie.png). Netflix and Google TV open details with the hero visible and focus on Play/Resume. A movie has no Play button at all: you have to go `D` to its single episode row and press `OK`. | `components/episode-list/EpisodeList.tsx:574-586` (Continue gets `hasTVPreferredFocus`), `:640-647` (page snaps to the controls) |
| F2 | Info, Continue chip | `OK` on "Continue · EP 1". | It only scrolls to and pulses the episode, and focus stays on the chip. Resuming takes `OK`, `D`, `OK` (3 presses). TV apps resume on one press of Resume. | `EpisodeList.tsx:458-466` (`scrollToContinue`) |
| F3 | Episode actions | Episode row. | The actions sheet (mark watched, download, external player, share) only opens with a long press of OK, and nothing on screen says so. Google TV uses long-press too, but shows a hint or a ⋮ button. | `EpisodeList.tsx:90-93` |
| F4 | Manga info | Open a manga. | No initial focus (describe: Focused (none)); the first `D` goes to the description. "More like this" comes before the chapter list, so you scroll through the description, Trailer, the recommendations row and the provider to reach chapter 1 (6 presses). Anime has this fixed (recommendations after episodes). | `app/info/[mediaType].tsx:16` (`withRecommendations={isManga}`), `components/info/Chapters.tsx:178-183` (preferred focus only on Continue) |
| F5 | Info episode list | Reach "More like this" on a 28-episode show. | 29 presses of `D`; there's no range picker under about 30 episodes and no jump past the list. | `EpisodeList.tsx` (`useListJump`) |
| F6 | Settings, Downloads screen | Open them. | No row has focus at open (Settings: the first `D` lands on Appearance; Downloads has nothing focusable). Data, Player, Reader, About, History, Extensions and Statistics do open with focus. | `app/(settings)/settings.tsx:15`, `app/(settings)/downloads.tsx` |
| F7 | More | Rail: More `OK`, then `R`. | Focus stays on the rail after `OK` on More, but jumps into the content after `OK` on Manga (first visit). `R` from the rail lands on the row level with the rail item (Download queue), not the first row, and the logo header scrolls away for good. | `components/TVTabs.tsx`, `components/CardList.tsx:116` (first card's `hasTVPreferredFocus` grabs focus on a tab's first mount) |
| F8 | Row ends | Search results: `R` past the last result in the row. Appearance: `R` past Cotton-Candy. | Focus escapes up to the search ✕ button / the Light-Dark switch instead of stopping at the row end. Home rows trap correctly (TVRow). | `app/search/[mediaType].tsx:78-86` (CardList grid has no TVRow trap), `app/(settings)/appearance.tsx` |
| F9 | Search | `OK` on the IME's Search key. | Focus stays in the text field; one `D` reaches results (better than the 2026-10-25 jump to Back). The results grid is 6 columns with a wide empty right margin (about 200 px). Recent-search rows sit behind the IME and weren't tried. | `hooks/useCardGridDimensions.ts:22` |
| F10 | Player overlay | Intro playing. | "Skip intro" shows but doesn't take focus; reaching it took `D`/`U` presses. Netflix focuses Skip Intro when it appears. | `components/watch/PlayerOverlay.tsx` |
| F11 | Player settings | Menu open. | Every row is listed, but on a half-height sheet only 4-5 fit, and the header goes with the first `D` (see bug 2). | `AppVideoProvider.tsx:12-18` |
| F12 | Reader error | Continue reading on a chapter that 404s. | Focus goes to the header Back, not to Retry; `OK` leaves. Expected: Retry focused. | `app/read/[id].tsx:236-252` (`reader-retry` without preferred focus) |
| F13 | Provider Select sheet | Movie info: provider `OK`. | The sheet has no title (just "VegaMovies ✓"). With one provider, the dropdown is a dead end, yet it takes the initial focus (F1). | `components/Select.tsx` |
| F14 | Statistics | `D` from the tabs. | The page scrolls, but with an invisible focus (describe "(no label)"); fine for a read-only page, noted for consistency. | `app/(settings)/statistics.tsx` |
| F15 | Extensions focus | Install/Uninstall buttons. | The focus ring is a thin dark-blue border on a light-blue button: low contrast from 3 m. | `components/Button.tsx` (TV ring colour on non-primary variants) |

Things that worked well: the rail (Back from content goes to the rail, Back on the rail goes to Anime, `R` from the rail returns to the last card); home rows trap and remember the last card; See all tile; Back from Browse/Search/Info restores the card; the episodes panel (opens on Now playing, Back closes it); the native Provider Selection dialog holds focus; the episode actions sheet (focus on its first action, Back from Select Server closes the sheet); History, Favorites, Statistics and Extensions open on their first tab; About opens on Check for updates; Choice dialog starts on the selected option.

## Not covered

- Webview and Trailer buttons (info): they open an external browser, which an Android TV may not have; not pressed, so the app wasn't left.
- Favourite toggle (header heart): reachable (`U` from Webview), but not pressed, to leave data unchanged; so Favorites is shot empty. The heart reads "(no label)" in describe, though the code sets `accessibilityLabel` (`InfoHeader.tsx:104-110`); worth a check with TalkBack.
- Downloads with items, the download queue, cancel/remove: not started (no files written).
- Player: server menu, captions/audio/video submenus, next/previous episode, Up next countdown at the real end of an episode, seeking by holding `L`/`R`. The toolkit lists the up-next card's "Play now"/"Cancel" in the tree while it's invisible mid-episode; I didn't see it steal focus, but didn't prove it can't.
- Long-strip reader mode and reader settings changes; another manga provider (only MangaHere tried).
- Appearance changes, settings toggles, backup create/restore, clear cache: not changed on purpose.
- History's Manga/Movies tabs, Favorites/Statistics Movies tabs: opened only the Anime tab.
- Recent-search rows on the Search screen (behind the IME).
- Movie playback (VegaMovies) and the movie episode sheet.
- iOS/tvOS: out of scope (tvOS shelved).

## Tooling quirks

- `describe` on Android TV only lists some focusables (and often "(no label)"); confirm with screenshots. On the player it falls back to the full UI tree with no focus info.
- `uiautomator dump` fails on this emulator (no file written), and `dumpsys activity top` doesn't show Fabric views' focus, so neither can stand in for describe.
- Long press: `input keyevent --longpress` doesn't reach react-native-tvos' long-press detector. A virtual uinput device does: push a JSON script and run `adb shell /system/bin/uinput /data/local/tmp/hold.json`, with `register` (configuration `{"type":100,"data":[1]}`, `{"type":101,"data":[28,353]}`), `delay` 1500, `inject` `[1,353,1,0,0,0]`, `delay` 1200, `inject` `[1,353,0,0,0,0]`.
- Typing: `adb shell input text "…"` types into the focused field; then the IME's Search key is `D` `D` `D` `R`x6 from "q".
- The first `am start` after force-stop sometimes leaves the TV launcher on top; a second `am start -W` brings the app forward.
