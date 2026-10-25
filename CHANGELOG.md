# Changelog

## [4.0.0-rc.2](https://github.com/uwumilabs/uwumi/compare/v4.0.0-rc.1...v4.0.0-rc.2) (2026-10-25)

### Features

* **dash:** move to clerk v7 for the vercel.app proxy and load the middleware from src ([9d08657](https://github.com/uwumilabs/uwumi/commit/9d08657e04d712cfcd7a20b9925fb0583a1b7043))
* **info:** jump to a shared episode on open and pulse the row it lands on ([a5d5d77](https://github.com/uwumilabs/uwumi/commit/a5d5d77d4d2bc9639b8b4f055712b01421ceb6c4))
* share shows and episodes as links that open in the app or on the dash ([623b422](https://github.com/uwumilabs/uwumi/commit/623b4228baa07778789b5f2b3eb4956f46a164be))
* **watch:** give servers unlimited time to load ([ee2df29](https://github.com/uwumilabs/uwumi/commit/ee2df29ffc45b108efb57e3721e83fce06bb475a))
* **watch:** go into picture-in-picture when leaving a playing video ([28b1fff](https://github.com/uwumilabs/uwumi/commit/28b1ffff24fcfb3181f88e9e679b75d1044eca7b))
* **watch:** pick servers from the player settings and drop the load timeout ([35340f8](https://github.com/uwumilabs/uwumi/commit/35340f884b1800bfc19c9b4ee573aed5d8f4871b))
* **watch:** rotate to the next server when one fails ([9c361b5](https://github.com/uwumilabs/uwumi/commit/9c361b58327eae574311f3414a0ce7ee9d3aba1c))
* **watch:** show +85s when aniskip has no skip times ([70570b7](https://github.com/uwumilabs/uwumi/commit/70570b7569f00d567a6a253ddb2c8ae82a94894c))
* **watch:** youtube-style episodes strip and heroui server chips ([46b8fed](https://github.com/uwumilabs/uwumi/commit/46b8fed675f02c34e7d9d9c27bb09fc9f66439e7))

### Bug Fixes

* open links in the app's task so recents shows one uwumi ([2beaa33](https://github.com/uwumilabs/uwumi/commit/2beaa3385cc14d7006b8925adcf733ccd76847b7))
* upgrade uniwind to 1.13 and heroui native to 1.0.11 so assets load on rn 0.88 ([fe718f3](https://github.com/uwumilabs/uwumi/commit/fe718f371fc8e0f6350b2a22018b425912aa7036))
* **watch:** cap the playback buffer by memory so long streams don't run out of heap ([aca42db](https://github.com/uwumilabs/uwumi/commit/aca42dbb46c50f5b6c1c0ed7d42c58a19b8843a1))

### Performance Improvements

* add a profiling harness and cut startup, episode list and background renders ([b902dc1](https://github.com/uwumilabs/uwumi/commit/b902dc1ec201019b53a3c7116cb8cdd9d59a027c))

## [4.0.0-rc.1](https://github.com/uwumilabs/uwumi/compare/v4.0.0-rc.0...v4.0.0-rc.1) (2026-10-19)

### Features

* **about:** add support links, pull to refresh and a footer ([607d8df](https://github.com/uwumilabs/uwumi/commit/607d8dfbdf69fd4eb68bb2ab2c6d3d04fdbb26b5))
* **about:** redesign the about screen and stop offering a downgrade ([ab7d80c](https://github.com/uwumilabs/uwumi/commit/ab7d80c92269c84c0ce84f1fb3aa239821311831))
* add provider error states, continue watching and chapter list jumps ([41c867f](https://github.com/uwumilabs/uwumi/commit/41c867f4eeef66eaa94a3bd6d4d510e335811b55))
* consumet 2.0, external subtitle setting and watch-screen fixes ([a9f2f76](https://github.com/uwumilabs/uwumi/commit/a9f2f76dc4e31a25f28dea14c079da1b8db96c39))
* **episodes:** add edge fades, back to top and episode ranges ([a0dfb9f](https://github.com/uwumilabs/uwumi/commit/a0dfb9f88f3a8c2b931c77a5fe4005695119d82c))
* **ota:** host ota bundles on the app's github release ([a4aa822](https://github.com/uwumilabs/uwumi/commit/a4aa8224c305bff4ff5c887c21d0a4b7f729d8c3))
* **ota:** number ota versions per release instead of timestamps ([019947f](https://github.com/uwumilabs/uwumi/commit/019947f37d71cdcc6d79a6b637d008e479ed50c6))
* **ota:** show download progress and a restart prompt ([59fc8b0](https://github.com/uwumilabs/uwumi/commit/59fc8b0dbf7e471973ee88d547c7fb54b52936f5))
* **watch:** add subtitles from a file or an opensubtitles search ([5aebf37](https://github.com/uwumilabs/uwumi/commit/5aebf376e61cec3cfb7d79f2e9179ea9914b0f17))
* **watch:** fullscreen player with episodes panel, skip times and up next ([419ff70](https://github.com/uwumilabs/uwumi/commit/419ff706111a10d0a5ba6a5623ba02ef666c0925))

### Bug Fixes

* **downloads:** list real downloads instead of the preview data ([7b8221e](https://github.com/uwumilabs/uwumi/commit/7b8221ef1712816b81d138edf47cabb535f056dc))
* drop finished anime from continue watching and center progress bars ([9c3a006](https://github.com/uwumilabs/uwumi/commit/9c3a00639ec356213ada74c2b560dc167832e49d))
* **ios:** record the prebuilt react core flavor after pod install ([b71adeb](https://github.com/uwumilabs/uwumi/commit/b71adeb5b49bc3c10e9431ee19fe688075a9b35d))
* **watch:** skip extractor lookup for direct-source and single-server providers ([69649f8](https://github.com/uwumilabs/uwumi/commit/69649f81ce9a572f82aae5b7af432a62a962acd4))

### Performance Improvements

* **ota:** hold restart during downloads and publish without downloading ([18a8b56](https://github.com/uwumilabs/uwumi/commit/18a8b5646467fa521c8959febb16e0cf070e960e))

## 4.0.0-rc.0 (2026-10-12)

* chore: log release build output to files so release-it doesn't kill the hooks ([c3be3cd](https://github.com/uwumilabs/uwumi/commit/c3be3cd))
* feat: add github-hosted ota updates and upgrade mmkv to v4 ([1b0af51](https://github.com/uwumilabs/uwumi/commit/1b0af51))
* feat(home): replace media tabs with carousels, "See more" and a search screen ([a26cfb5](https://github.com/uwumilabs/uwumi/commit/a26cfb5))
* feat(info): make the info screen one scrolling page, with native progress bars ([56107c2](https://github.com/uwumilabs/uwumi/commit/56107c2))
* refactor(components): group native views under components/native and drop "Custom" names ([ef4f449](https://github.com/uwumilabs/uwumi/commit/ef4f449))

## 3.12.0 (2026-10-10)

* feat: keep android native config alive across expo prebuild ([36a742c](https://github.com/uwumilabs/uwumi/commit/36a742c))
* feat: ship an unsigned .ipa alongside the apk's in yarn release ([ea24854](https://github.com/uwumilabs/uwumi/commit/ea24854))
* feat: update image assets and enhance layout for settings screen' ([364f52b](https://github.com/uwumilabs/uwumi/commit/364f52b))
* feat(ios): switch ios target from tvos to iphone and fix xcode 26 build ([8677fe4](https://github.com/uwumilabs/uwumi/commit/8677fe4))
* refactor(tv): drive d-pad focus rings with reanimated pseudo selectors ([a8043b8](https://github.com/uwumilabs/uwumi/commit/a8043b8))
* fix(ios): make extensions and downloads work after reinstall ([a0009df](https://github.com/uwumilabs/uwumi/commit/a0009df))
* fix(player): make video player usable on rn-0.86 with native sheet and slider ([de7f217](https://github.com/uwumilabs/uwumi/commit/de7f217))
* chore: update rn and expo to latest ([d7fd30d](https://github.com/uwumilabs/uwumi/commit/d7fd30d))

## 3.11.0 (2026-09-21)

* feat: optimize use-effect dependencies and improve animation handling in card-list ([7cb9102](https://github.com/uwumilabs/uwumi/commit/7cb9102))

## 3.10.0 (2026-09-20)

* feat: update ffmpeg-kit and remove sonner ([5475fa5](https://github.com/uwumilabs/uwumi/commit/5475fa5))
* feat: update react-native-consumet to version 1.5.0 and adjust related files ([2a0159e](https://github.com/uwumilabs/uwumi/commit/2a0159e))
* chore: upgrade rnc ([63e7a53](https://github.com/uwumilabs/uwumi/commit/63e7a53))

## 3.9.0 (2026-05-09)

* feat: introduce expo ui ([b68a2a2](https://github.com/uwumilabs/uwumi/commit/b68a2a2))
* feat: reactive providers + activity tabs + cleanup modules ([5d402d5](https://github.com/uwumilabs/uwumi/commit/5d402d5))

## <small>3.8.2 (2026-04-26)</small>

* chore: bump rnvt version ([e611457](https://github.com/uwumilabs/uwumi/commit/e611457))

## <small>3.8.1 (2026-04-19)</small>

* chore: upgrade rnvt ([d596e40](https://github.com/uwumilabs/uwumi/commit/d596e40))

## 3.8.0 (2026-04-19)

* fix(android): tv-support work started ([ded98fe](https://github.com/uwumilabs/uwumi/commit/ded98fe))
* fix(card-skeleton): adjust width calculation for skeleton items ([bcce00f](https://github.com/uwumilabs/uwumi/commit/bcce00f))
* feat: add android tv d-pad navigation and focus management ([00070c6](https://github.com/uwumilabs/uwumi/commit/00070c6))
* feat(video-player): new version of rnvt ([3532aff](https://github.com/uwumilabs/uwumi/commit/3532aff))
* chore: add new image assets and update tab icons in layout ([8f6f8c9](https://github.com/uwumilabs/uwumi/commit/8f6f8c9))

## <small>3.7.2 (2026-02-28)</small>

* chore: add missing theme variables and update dependencies ([9106c2a](https://github.com/uwumilabs/uwumi/commit/9106c2a))
* chore: upgrade expo version to latest ([137486c](https://github.com/uwumilabs/uwumi/commit/137486c))
* fix: resolve zustand state reactivity issues across components ([960a674](https://github.com/uwumilabs/uwumi/commit/960a674))

## <small>3.7.1 (2026-02-26)</small>

* fix: resolve flashlist addviewat crash on empty search results ([f0736da](https://github.com/uwumilabs/uwumi/commit/f0736da))

## 3.7.0 (2026-02-08)

* refactor: fix react compiler hooks violations and ux polish ([c3c8cbc](https://github.com/uwumilabs/uwumi/commit/c3c8cbc))
* refactor: improve performance and resolve bugs ([f0fab65](https://github.com/uwumilabs/uwumi/commit/f0fab65))
* feat: improve query client initialization, and enhance custom-image component ([693df39](https://github.com/uwumilabs/uwumi/commit/693df39))

## 3.6.0 (2026-02-01)

* feat(player): add episode navigation and resolve video controls bug ([4c9e107](https://github.com/uwumilabs/uwumi/commit/4c9e107))

## 3.5.0 (2026-01-31)

* feat(video): theme video player and improve ui ([7bcf64a](https://github.com/uwumilabs/uwumi/commit/7bcf64a))
* feat(watch-screen): add seek forward button and improve provider selection ([642903f](https://github.com/uwumilabs/uwumi/commit/642903f))

## 3.5.0-rc.2 (2026-01-18)

* chore(release-it): update release-it deps ([c808401](https://github.com/uwumilabs/uwumi/commit/c808401))
* refactor: enhance babel configuration, improve external subtitles handling, and optimize hooks ([918b371](https://github.com/uwumilabs/uwumi/commit/918b371))
* refactor: optimize imports, memoize components, and remove logs ([3ab472b](https://github.com/uwumilabs/uwumi/commit/3ab472b))
* refactor: remove unused react-native-system-navigation-bar and update theme colors ([d3828d2](https://github.com/uwumilabs/uwumi/commit/d3828d2))
* refactor(player): integrate react-native-video-toolkit for video playback ([be03a37](https://github.com/uwumilabs/uwumi/commit/be03a37))
* feat: implement provider selection dialog and other ui tweaks ([640cc98](https://github.com/uwumilabs/uwumi/commit/640cc98))

## 3.5.0-rc.1 (2025-12-31)

* refactor(ui): migrate customsheet to heroui bottomsheet ([ae24c23](https://github.com/uwumilabs/uwumi/commit/ae24c23))

## 3.5.0-rc.0 (2025-12-28)

* chore: generate raw files ([569a7bc](https://github.com/uwumilabs/uwumi/commit/569a7bc))
* chore: wip partial work for 3.5.0 (do not merge) ([218f04b](https://github.com/uwumilabs/uwumi/commit/218f04b))
* feat: replace lucide-react-native icons with ionicons and materialicons ([5f8f9d0](https://github.com/uwumilabs/uwumi/commit/5f8f9d0))
* refactor: update theming system and ui components ([aa36e49](https://github.com/uwumilabs/uwumi/commit/aa36e49))

## <small>3.4.1 (2025-12-12)</small>

* fix(ui): improve touch handling and watch controls ([869c798](https://github.com/uwumilabs/uwumi/commit/869c798))

## 3.4.0 (2025-12-05)

* refactor: upgrade deps and improve components ([7fe7ce9](https://github.com/uwumilabs/uwumi/commit/7fe7ce9))
* feat(android): migrate to vector drawables and update assets ([df0f786](https://github.com/uwumilabs/uwumi/commit/df0f786))

## 3.3.0 (2025-11-12)

* feat: add new icons for anime, manga, movies, and more; update tab layout to use drawable resources ([dec7f79](https://github.com/uwumilabs/uwumi/commit/dec7f79))
* feat: refactor tab layout and add new icons for navigation ([829ccaf](https://github.com/uwumilabs/uwumi/commit/829ccaf))
* feat(app): refactor animations and improve downloads ([0ce6db0](https://github.com/uwumilabs/uwumi/commit/0ce6db0))

## 3.2.0 (2025-11-08)

* feat: add notification support and improve episode list ([646acf8](https://github.com/uwumilabs/uwumi/commit/646acf8))
* feat: improve downloads and ui ([ddac04d](https://github.com/uwumilabs/uwumi/commit/ddac04d))
* chore: improve release-it configuration with clean working dir checks ([3ffee84](https://github.com/uwumilabs/uwumi/commit/3ffee84))

## 3.1.0 (2025-11-01)

* chore: update react-native-consumet to version 1.2.0 ([9f70c73](https://github.com/uwumilabs/uwumi/commit/9f70c73))

## 3.0.0 (2025-10-28)

* feat: add download management screen with ffmpeg and filesystem cleanup ([075bd3a](https://github.com/uwumilabs/uwumi/commit/075bd3a))
* feat(player): add external player watch progress sync ([af85cb7](https://github.com/uwumilabs/uwumi/commit/af85cb7))
* chore: release 3.0.0-rc.3 ([fad07d0](https://github.com/uwumilabs/uwumi/commit/fad07d0))
* chore(docs): update readme ([4d237a1](https://github.com/uwumilabs/uwumi/commit/4d237a1))

## 3.0.0-rc.3 (2025-10-22)

* feat: add download store and integrate with example component ([c84803c](https://github.com/uwumilabs/uwumi/commit/c84803c))
* feat(download): migrate file system from expo to rnfs and add native permissions ([1714299](https://github.com/uwumilabs/uwumi/commit/1714299))
* feat(downloads): add background download support with media info store ([acc44a4](https://github.com/uwumilabs/uwumi/commit/acc44a4))
* feat(player): add external player watch progress sync ([af85cb7](https://github.com/uwumilabs/uwumi/commit/af85cb7))
* chore: update .gitignore to include ffmpeg aar ([cb33968](https://github.com/uwumilabs/uwumi/commit/cb33968))
* test: temporary backup before amend ([176f5df](https://github.com/uwumilabs/uwumi/commit/176f5df))

## 3.0.0-rc.2 (2025-10-15)

* refactor: clean up imports and improve code consistency across components ([ccf37d7](https://github.com/uwumilabs/uwumi/commit/ccf37d7))
* refactor: components and consolidate ui primitives ([637b3bb](https://github.com/uwumilabs/uwumi/commit/637b3bb))
* refactor: improve server handling and extension logic ([2ac407f](https://github.com/uwumilabs/uwumi/commit/2ac407f))
* refactor: introduce custom-flashlist and improve ui ([2a63adb](https://github.com/uwumilabs/uwumi/commit/2a63adb))
* refactor: use extensions for providers and schedule-on-rn for worklets ([2f2733f](https://github.com/uwumilabs/uwumi/commit/2f2733f))
* refactor(wavy-animation): use new css animation ([1426b34](https://github.com/uwumilabs/uwumi/commit/1426b34))
* feat: add episode actions sheet and external player support ([6adaab9](https://github.com/uwumilabs/uwumi/commit/6adaab9))
* feat: introduce extension architecture with streamlined playback and state management ([f698aa4](https://github.com/uwumilabs/uwumi/commit/f698aa4))
* feat: upgrade app to expo v54 and new file-system ([25899be](https://github.com/uwumilabs/uwumi/commit/25899be))
* feat(player): add server selection and improve navigation ([1529c89](https://github.com/uwumilabs/uwumi/commit/1529c89))
* feat(player): improve video buffering and fix episode-list refs & re-renders ([aa72c8f](https://github.com/uwumilabs/uwumi/commit/aa72c8f))
* feat(ui): add new icons and optimize layout performance ([354abd3](https://github.com/uwumilabs/uwumi/commit/354abd3))
* feat(video): enhance video quality selection and display 'auto' for automatic resolution ([f3bba6b](https://github.com/uwumilabs/uwumi/commit/f3bba6b))
* chore: config changes ([b288968](https://github.com/uwumilabs/uwumi/commit/b288968))
* chore: format and lint ([aa6faea](https://github.com/uwumilabs/uwumi/commit/aa6faea))
* fix: sync-versions and watch-query ([1272d3c](https://github.com/uwumilabs/uwumi/commit/1272d3c))

## 3.0.0-rc.1 (2025-10-10)

* chore: format and lint ([aa6faea](https://github.com/uwumilabs/uwumi/commit/aa6faea))
* fix: sync-versions and watch-query ([1272d3c](https://github.com/uwumilabs/uwumi/commit/1272d3c))
* feat: introduce extension architecture with streamlined playback and state management ([f698aa4](https://github.com/uwumilabs/uwumi/commit/f698aa4))
* feat: upgrade app to expo v54 and new file-system ([25899be](https://github.com/uwumilabs/uwumi/commit/25899be))
* feat(player): add server selection and improve navigation ([1529c89](https://github.com/uwumilabs/uwumi/commit/1529c89))
* feat(player): improve video buffering and fix episode-list refs & re-renders ([aa72c8f](https://github.com/uwumilabs/uwumi/commit/aa72c8f))
* feat(ui): add new icons and optimize layout performance ([354abd3](https://github.com/uwumilabs/uwumi/commit/354abd3))
* feat(video): enhance video quality selection and display 'auto' for automatic resolution ([f3bba6b](https://github.com/uwumilabs/uwumi/commit/f3bba6b))
* refactor: improve server handling and extension logic ([2ac407f](https://github.com/uwumilabs/uwumi/commit/2ac407f))
* refactor: use extensions for providers and schedule-on-rn for worklets ([2f2733f](https://github.com/uwumilabs/uwumi/commit/2f2733f))

## 2.7.0 (2025-07-29)

* feat(onboarding): add onboarding flow with custom ui and state handling ([cd623d5](https://github.com/uwumilabs/uwumi/commit/cd623d5))
* feat(providers): update anime sources and add multistream movie support ([8675ce6](https://github.com/uwumilabs/uwumi/commit/8675ce6))

## 2.6.0 (2025-07-11)

* refactor: enhance update checking mechanism with loading and error handling ([071aa87](https://github.com/uwumilabs/uwumi/commit/071aa87))
* refactor: streamline imports by consolidating hooks and code cleanup ([6ecee5b](https://github.com/uwumilabs/uwumi/commit/6ecee5b))
* feat: configure edge-to-edge support ([44ef537](https://github.com/uwumilabs/uwumi/commit/44ef537))
* feat: implement a dialog to choose external subtitle language ([32c077c](https://github.com/uwumilabs/uwumi/commit/32c077c))
* feat: implement external subtitle fetching and enhance subtitle handling in video player ([6795d4e](https://github.com/uwumilabs/uwumi/commit/6795d4e))
* feat: refactor external links and improve edge-to-edge support in layout ([529099d](https://github.com/uwumilabs/uwumi/commit/529099d))
* fix: downgrade react-native-video version and improve header navigation in settings layout ([bf28d20](https://github.com/uwumilabs/uwumi/commit/bf28d20))
* chore: update dependencies and improve code structure ([b8f7161](https://github.com/uwumilabs/uwumi/commit/b8f7161))
* chore(debug): add debug config, revert ripple, and stub external subtitles ([019806c](https://github.com/uwumilabs/uwumi/commit/019806c))
* docs(readme): add contact section ([c338a00](https://github.com/uwumilabs/uwumi/commit/c338a00))

## <small>2.5.3 (2025-06-24)</small>

* refactor: revert back to the old episode fetching logic,update react-native-consumet,update readme ([2694f77](https://github.com/2004durgesh/uwumi/commit/2694f77))
* refactor(episodes, providers): parallel episode fetching and improved provider handling ([e061f7d](https://github.com/2004durgesh/uwumi/commit/e061f7d))

## <small>2.5.2 (2025-06-20)</small>

* feat: add audio track support to controls-overlay and watch components ([6e11286](https://github.com/2004durgesh/uwumi/commit/6e11286))

## <small>2.5.1 (2025-06-10)</small>

* chore(update): update react-native-consumet to version 0.7.1, fixes multimovies stream-play ([9b09ea0](https://github.com/2004durgesh/uwumi/commit/9b09ea0))

## 2.5.0 (2025-05-26)

* feat: implement manga chapter functionality ([a3131c7](https://github.com/2004durgesh/uwumi/commit/a3131c7))

## <small>2.4.1 (2025-05-25)</small>

* refactor: optimize components and gestures; add advanced ripple-button ([ef1aaaa](https://github.com/2004durgesh/uwumi/commit/ef1aaaa))
* fix(slider): using skia for better performant slider ([944909d](https://github.com/2004durgesh/uwumi/commit/944909d))

## 2.4.0 (2025-05-09)

* feat(himovies): add new movie provider ([a19943e](https://github.com/2004durgesh/uwumi/commit/a19943e))
* feat(netflixmirror): new movie provider ([c35b0e0](https://github.com/2004durgesh/uwumi/commit/c35b0e0))

## 2.3.0 (2025-04-27)

* feat: add version synchronization script for android and ios ([9530a23](https://github.com/2004durgesh/uwumi/commit/9530a23))
* feat: integrate react-native-consumet and tweak media queries & about ui ([6feb2d0](https://github.com/2004durgesh/uwumi/commit/6feb2d0))     
* feat: new animepahe provider and major changes for react-native-consumet ([fbdc32a](https://github.com/2004durgesh/uwumi/commit/fbdc32a))     

## <small>2.2.1 (2025-04-10)</small>

* chore: changes for new version ([4c50428](https://github.com/2004durgesh/uwumi/commit/4c50428))
* refactor: remove tv-support from main branch ([47bf34d](https://github.com/2004durgesh/uwumi/commit/47bf34d))
* fix(about, tabs): memoize heavy tasks in about and tabs layout ([3918647](https://github.com/2004durgesh/uwumi/commit/3918647))

## <small>2.1.1 (2025-04-05)</small>

* fix(release): use absolute path for build script and improve script directory handling ([222bd83](https://github.com/2004durgesh/uwumi/commit/222bd83))
* feat(about,update-checker): implement about screen and update checker hook ([4c090b5](https://github.com/2004durgesh/uwumi/commit/4c090b5))
* chore(readme): add env.local and update readme ([8dda059](https://github.com/2004durgesh/uwumi/commit/8dda059))


## v2.0.0 (2025-03-26)

### Chore

- *(release)* Bump version to 2.0.0 (fa72462)


### Features

- *(tvos)* Implement android tv feature (070f7fa)

## v1.0.1 (2025-03-20)

### Bug Fixes

- *(controls)* Adjust visibility logic and improve ripple button duration (9e0729e)

- *(controls | player)* Add auto-hide in controls and fixes in player and episodelist (76fe07d)


### Chore

- *(release)* Update version to 1.0.1 and regenerate changelog (6fba30e)

- *(changelog)* Update changelog with recent enhancements and organization improvements (5c87bd5)


### Features

- *(changelog)* Enhance changelog generation and organization; update pre-commit hook (a2a827c)

## v1.0.0 (2025-03-18)

### Features

- *(update)* Version comparison and download request dialog for new stable release (7149699)

- Add custom-slider component and integrate it into controls (030140a)

- Update theme handling and improve server initialization and ui-fixes (888432d)

- Make embed type boolean in watch queries; add season store & fix multi-season issue (dd9a367)

- Replace anime images with svg; update player & queries for movies (929f1de)

## v1.0.0-rc (2025-03-02)

### Chore

- Clean up build artifacts and add .gitignore for fullscreen module (2fbdee6)


### Features

- Update fullscreen module to set navigation and status bar colors to transparent (653fda7)

- Update fullscreen module configuration and clean up related code (2716d74)

- Enhance pre-commit hook for version consistency checks and update package version to rc (ebbbf3a)

- Complete husky setup with commitlint and lint-staged (6d22e94)

- Add fullscreen module with initial setup and configuration (eea7d08)

- Add favorites functionality, including favorites management and UI updates, and integrate lottie-react-native for animations (0472bd4)

- Update episode handling by enforcing uniqueId usage, refactor related state management, and clean up console logs (716203d)

- Enhance server and episode management, update type definitions, and clean up imports (235cb3b)

- Add server management functionality, including server selection and state management (c049e73)

- Update movie provider constants, enhance episode handling, and refactor related components (955db78)

- Add episode display mode enum, implement provider selection component, and refactor episode store (8114740)

- Enhance episode and movie season handling, update UI components (8f503f6)

- Update build scripts, enhance provider constants, and adjust package dependencies (0379b0b)

- Refactor SearchBar color handling , some ui changes in episodelist and clean up imports in read chapter component (3af13b2)

- Add read chapter functionality and improve chapters display (32260bd)

- Work on chapters has started (d158a72)

- Resuable tabs component, improve theme color for bottom-tabs (04d7868)

- Improve Settings layout, add RippleButton, and enhance splash screen visuals (d7428e2)

- Enhance theme handling by consolidating hook imports and adding pure black background support; update components for improved styling (4f01c48)

- Add pure black background option and hex to RGB utility; update theme handling in components and new ui for accent switching (2a4c716)

- Consolidate hooks imports and enhance theme handling across components (4960c81)

- Add Chapters component and integrate it into HorizontalTabs; update Settings layout and theme colors (5db1659)

- Restructure settings tab into a dedicated settings section; add appearance and about screens (8221f32)

- Add time formatting utility and integrate toast notifications for error handling; update dependencies (0c4568e)

- Add new stores for watch progress; refactor imports across components (4a7b1cc)

- Add meta provider types and integrate into media queries and components and dynamic api url for fetching based on env (e7ec0de)

- Replace ListEmpty component with NoResults and implement tab management in MediaBrowser (48add7b)

- Implement SearchBar component with debounced input and enhance ListEmpty component for better UX (9943aba)

- Add SearchBar component and update CardList layout for improved UI (68e5424)

- Add popular anime tab and integrate FlashList for improved performance (b905f1d)

- Integrate FlashList for improved episode list performance and enhance ControlsOverlay navigation (351df4e)

- Implement accent and theme stores with persistent storage, enhance themed components, and update layout (737b595)

- Add CustomImage and Similar components, enhance layout and queries, and update dependencies (a75c799)

- Add StatisticItem component and enhance ReadMore with improved animations (ae9d886)


### Other

- *(other)* Some code refactor and movie-episodes and anime dub (818ba56)

- *(other)* Git issue resolving (8e3eb5d)

- *(other)* Remove unused hook imports; clean up console log formatting (f86b168)

- *(other)* Add theme switcher UI and video quality settings (e0f00f8)

- *(other)* Some linting and formatting (f4ed17c)

- *(other)* The video works in prod (b466b68)

- *(other)* Stop tracking .tamagui directory (b7ba9e8)

- *(other)* First test-release (eb65a58)

- *(other)* Cardlist refetching solved (eb174bc)

- *(other)* Video issue solved (5b1521f)

- *(other)* First commit after prettier and eslint config (f91c538)

- *(other)* Just small refactor (180d5ff)

- *(other)* Implement current playing episode store and refactor episode list component (1b2c077)

- *(other)* Swipe auto close works (7fdc366)

- *(other)* Swipeable works (9a7477d)

- *(other)* Video works fine (4d0441c)

- *(other)* Rough expo-video solution (727945d)

- *(other)* Goinf back to expo-video (07e64b4)

- *(other)* Before media-console (3fae043)

- *(other)* Before expo prebuild clean (6739c70)

- *(other)* Before react-native-video (046dc3f)

- *(other)* Info screen complete,  watch screen added (7dfee5e)

- *(other)* Second commit (3fd3317)

- *(other)* Initial commit (e691ee0)


### Refactor

- Update ignore files for consistency and improve build script comments (44fdcd0)

- Added remove unused  via eslint and clean up component code and movie screen (cd7aa0e)

- Remove console logs and replace Pressable with CustomPressable for better event handling (77236a1)

- Remove unused movie queries and clean up imports in media queries (2d69771)

- Update episode management and enhance controls overlay functionality (45516ec)

- Remove .env file, update .gitignore, and enhance ReadMore component with animations (54fc59a)
