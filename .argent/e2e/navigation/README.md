# Navigation e2e tests

The home tabs (Anime, Manga, Movies, More), search, and browsing a feed's full list. Every test starts with `../_shared/start-<platform>.yaml` and ends on the Anime tab. Read `../README.md` first.

| Flow | Steps | Touches | Back to back? |
|---|---|---|---|
| `tabs` | Anime → Manga → Movies → More (snapshot `more-tab`) → Anime, each proven by its screen root | nothing | Yes |
| `search` | Anime: open search → type "naruto" without submitting → results in `search-list` → clear → leave (Android: Back twice, the first closes the keyboard; iOS: edge swipe). Movies: the same with "inception" | network. No recent search is added: nothing is submitted or opened | Yes |
| `browse` | Anime: the first feed's See more → `browse-screen` grid with cards → back. Movies: the same | network | Yes |

Both platforms have each flow (`<flow>-android.yaml`, `<flow>-ios.yaml`), passing twice in a row on 2026-11-14.

## Bugs found

| Found | Bug | Where | Found by |
|---|---|---|---|
| 2026-11-14 | **The search screen has no way back on iOS** except the edge swipe: no header and no back button. | `src/app/_layout.tsx:183` (`search/[mediaType]` takes the stack's `headerShown: false`), `src/app/search/[mediaType].tsx:59-76` | `search-ios` |
| 2026-11-14 | **Icon-font glyphs leak into accessibility labels**: "See more, ", ", Trailer", ", Webview". Screen readers read the private-use glyphs. | e.g. `src/components/MediaCarousel.tsx:87` (`feed-see-more`) | `browse-android` |

## Quirks

- Repeated cards share `media-card`, and actions pick the smallest matching frame, which is often a half-visible card. Anchor on a fixed element: `{ id: media-card, next: { text: { matches: '^Popular$' } } }`, `{ id: media-card, next: { id: BackButton } }`.
- Tapping a search result records a recent search (`onItemPress={recordLiveQuery}`); typing without submitting doesn't. Tests that open a result remove the recent search they added.
- After clearing a search the field keeps focus: on Android the first Back closes the keyboard.

## Not tested

- Submitting a search (it writes a recent search) and the recent-search rows themselves, except where `info/movie-info` and `info/manga-info` remove the one they add.
- Manga search, and the Manga tab's See more.
