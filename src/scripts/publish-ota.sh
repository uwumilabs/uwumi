#!/bin/bash
# Publishes an OTA JS bundle for the current app version (react-native-nitro-ota, GitHub hosting).
#
#   yarn ota                         # android + ios
#   yarn ota --platform android      # one platform
#   yarn ota --notes "Fix X" --dry-run
#
# Each platform's bundle goes to its own orphan branch, ota-<version>-<platform>, which the app reads
# (see src/hooks/useOtaUpdates.ts). The branch is force-pushed with a single commit, so it only ever
# holds the latest bundle (plus a bsdiff patch from the previous one) and the repo doesn't grow with
# every publish.
#
# Only publish JS-only changes: the bundle must work with the native code already in the installed
# <version> binary. New native modules or native config need a new release (`yarn release`).
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
  echo ""
  echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC} ${YELLOW}🚀 $1${NC}"
  echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

PLATFORMS=(android ios)
NOTES=""
DRY_RUN=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform) PLATFORMS=("$2"); shift 2 ;;
    --notes) NOTES="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
VERSION="$(node -p "require('./package.json').version")"
OTA_VERSION="${VERSION}-ota.$(date -u +%Y%m%d%H%M%S)"
REMOTE_URL="$(git remote get-url origin)"
# owner/repo from either https://github.com/o/r(.git) or git@github.com:o/r(.git)
REPO_SLUG="$(echo "$REMOTE_URL" | sed -E 's#^(https://github\.com/|git@github\.com:)##; s#\.git$##')"
ENTRY_FILE="$(node -e "require('expo/scripts/resolveAppEntry')" "$ROOT_DIR" android absolute | tail -n 1)"

if [[ -n "$(git status --porcelain)" ]]; then
  echo -e "${YELLOW}⚠️  Uncommitted changes will be included in the OTA bundle.${NC}"
fi

for PLATFORM in "${PLATFORMS[@]}"; do
  case "$PLATFORM" in
    android) BUNDLE_NAME="index.android.bundle" ;;
    ios) BUNDLE_NAME="main.jsbundle" ;;
    *) echo "Unsupported platform: $PLATFORM" >&2; exit 1 ;;
  esac
  BRANCH="ota-${VERSION}-${PLATFORM}"
  OUT_DIR="$(mktemp -d)"

  print_step "BUNDLING ${PLATFORM} ${OTA_VERSION} (Hermes bytecode)"
  NODE_ENV=production npx expo export:embed \
    --platform "$PLATFORM" \
    --dev false \
    --bytecode \
    --entry-file "$ENTRY_FILE" \
    --bundle-output "$OUT_DIR/$BUNDLE_NAME" \
    --assets-dest "$OUT_DIR"

  # targetVersions keeps the bundle off any other binary even if the branch name were reused
  node -e '
    const [version, platform, appVersion, notes] = process.argv.slice(1);
    const manifest = { version, isSemver: false, targetVersions: { [platform]: [appVersion] } };
    if (notes) manifest.releaseNotes = notes;
    require("fs").writeFileSync(process.argv[5], JSON.stringify(manifest, null, 2) + "\n");
  ' "$OTA_VERSION" "$PLATFORM" "$VERSION" "$NOTES" "$OUT_DIR/ota.version.json"

  # bsdiff patch from the OTA currently on the branch, so devices already on it download only the delta.
  # Patches go to a separate dir (the CLI zips every file in --new) and get absolute raw URLs; the full
  # download is GitHub's branch archive, which skips them via export-ignore.
  if git ls-remote --exit-code --heads "$REMOTE_URL" "$BRANCH" >/dev/null 2>&1; then
    print_step "PATCHING ${PLATFORM} from the published OTA"
    PREV_DIR="$(mktemp -d)"
    PATCH_DIR="$(mktemp -d)"
    git -C "$PREV_DIR" init -q
    git -C "$PREV_DIR" fetch -q --depth 1 "$REMOTE_URL" "refs/heads/${BRANCH}"
    git -C "$PREV_DIR" checkout -q FETCH_HEAD
    if npx nitro-ota patch --old "$PREV_DIR" --new "$OUT_DIR" --out "$PATCH_DIR" \
      --url-base "https://raw.githubusercontent.com/${REPO_SLUG}/${BRANCH}/patches"; then
      mv "$PATCH_DIR" "$OUT_DIR/patches"
      printf 'patches/ export-ignore\n' > "$OUT_DIR/.gitattributes"
    else
      echo -e "${YELLOW}⚠️  Patch generation failed; publishing the full bundle only.${NC}"
      rm -rf "$PATCH_DIR"
    fi
    rm -rf "$PREV_DIR"
  else
    echo "No OTA on ${BRANCH} yet: publishing the full bundle only (first OTA for ${VERSION})."
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo -e "${GREEN}✅ Dry run: ${PLATFORM} bundle built in ${OUT_DIR} (not pushed)${NC}"
    continue
  fi

  print_step "PUSHING ${BRANCH}"
  (
    cd "$OUT_DIR"
    git init -q
    git checkout -q --orphan "$BRANCH"
    git add -A
    git commit -q -m "OTA ${OTA_VERSION} (${PLATFORM})"
    git push --force -q "$REMOTE_URL" "HEAD:refs/heads/${BRANCH}"
  )
  rm -rf "$OUT_DIR"
  echo -e "${GREEN}✅ ${PLATFORM}: ${OTA_VERSION} published to ${BRANCH}${NC}"
done
