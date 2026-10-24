#!/bin/bash
# Publishes an OTA JS bundle for the current app version (react-native-nitro-ota, GitHub hosting).
#
#   yarn ota                         # android + ios
#   yarn ota --platform android      # one platform
#   yarn ota --notes "Fix X" --dry-run
#
# Bundles are assets on the app's own GitHub release, v<version> (created by `yarn release`), which the
# app reads (see src/hooks/useOtaUpdates.ts):
#   ota-<platform>.json              manifest: version, targetVersions, patches
#   ota-<platform>.zip               full bundle + assets
#   ota-<platform>-<from>-<to>.zip   bsdiff patch from the previous OTA
# Each publish replaces the manifest and full zip and drops older patches, so the release only ever holds
# the latest OTA. Versions are <version>-ota.<n>, counting up per binary version.
#
# The manifest's asset label carries its version, and the last build published from this machine is kept in
# node_modules/.cache/uwumi-ota as the patch base, so a publish normally downloads nothing from the release.
#
# Needs GITHUB_TOKEN with write access to releases (the token release-it uses), from the environment or the gitignored
# .env, so a plain `yarn ota` works; --dry-run works without it.
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
if [[ -z "${GITHUB_TOKEN:-}" && -f .env ]]; then
  GITHUB_TOKEN="$(sed -n 's/^GITHUB_TOKEN=//p' .env)"
  export GITHUB_TOKEN
fi
VERSION="$(node -p "require('./package.json').version")"
# Same tag format as release-it's git.tagName
TAG="v${VERSION}"
# owner/repo from either https://github.com/o/r(.git) or git@github.com:o/r(.git)
REPO_SLUG="$(git remote get-url origin | sed -E 's#^(https://github\.com/|git@github\.com:)##; s#\.git$##')"
API="https://api.github.com/repos/${REPO_SLUG}"
DOWNLOAD_BASE="https://github.com/${REPO_SLUG}/releases/download/${TAG}"
ENTRY_FILE="$(node -e "require('expo/scripts/resolveAppEntry')" "$ROOT_DIR" android absolute | tail -n 1)"

if [[ "$DRY_RUN" != true && -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_TOKEN is not set (needs write access to ${REPO_SLUG} releases)." >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo -e "${YELLOW}⚠️  Uncommitted changes will be included in the OTA bundle.${NC}"
fi

# curl against the GitHub API, authenticated when GITHUB_TOKEN is set. The connect timeout matters on networks
# that drop one of GitHub's CDN addresses: curl gives each address half of it before trying the next.
github() {
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    curl -fsSL --connect-timeout 10 -H "X-GitHub-Api-Version: 2022-11-28" -H "Authorization: Bearer ${GITHUB_TOKEN}" "$@"
  else
    curl -fsSL --connect-timeout 10 -H "X-GitHub-Api-Version: 2022-11-28" "$@"
  fi
}
# Prints a dotted field of the JSON on stdin, or nothing when it's missing
json() {
  node -e '
    let value = JSON.parse(require("fs").readFileSync(0, "utf8"));
    for (const key of process.argv[1].split(".")) value = value?.[key];
    process.stdout.write(value == null ? "" : String(value));
  ' "$1"
}

RELEASE_JSON="$(github "$API/releases/tags/${TAG}")" || {
  echo "No GitHub release ${TAG}: OTAs attach to the binary's release, so run \`yarn release\` first." >&2
  exit 1
}
if [[ "$(json draft <<<"$RELEASE_JSON")" != false ]]; then
  echo "Release ${TAG} is a draft, so its assets can't be downloaded by the app. Publish it first." >&2
  exit 1
fi
RELEASE_ID="$(json id <<<"$RELEASE_JSON")"
CACHE_ROOT="$ROOT_DIR/node_modules/.cache/uwumi-ota/${TAG}"

# Read fresh on every call: the release's asset list changes as this script swaps files in
asset_id() {
  github "$API/releases/${RELEASE_ID}/assets?per_page=100" | node -e '
    const asset = JSON.parse(require("fs").readFileSync(0, "utf8")).find(({ name }) => name === process.argv[1]);
    process.stdout.write(asset ? String(asset.id) : "");
  ' "$1"
}
download_asset() { github -H "Accept: application/octet-stream" -o "$2" "$API/releases/assets/$1"; }
delete_asset() { github -X DELETE "$API/releases/assets/$1" >/dev/null; }
upload_asset() {
  github -X POST -H "Content-Type: $3" --data-binary @"$2" \
    "https://uploads.github.com/repos/${REPO_SLUG}/releases/${RELEASE_ID}/assets?name=$1" | json id
}
# GitHub can't overwrite an asset, so upload under a temporary name and rename it over the old one:
# the asset is only missing for the instant between the delete and the rename
replace_asset() {
  local name="$1" file="$2" type="$3" label="${4:-}" id new_id
  id="$(asset_id "next-${name}")"
  [[ -z "$id" ]] || delete_asset "$id"
  new_id="$(upload_asset "next-${name}" "$file" "$type")"
  id="$(asset_id "$name")"
  [[ -z "$id" ]] || delete_asset "$id"
  github -X PATCH -H "Content-Type: application/json" -d "{\"name\":\"${name}\",\"label\":\"${label}\"}" \
    "$API/releases/assets/${new_id}" >/dev/null
}

# <version>-ota.<n>: one past the highest n published for this binary on any platform, so publishing
# both platforms together gives them the same number. Each platform's manifest asset id is kept to
# detect a publish landing while this one runs, and its version to check the cached patch base.
ASSETS_JSON="$(github "$API/releases/${RELEASE_ID}/assets?per_page=100")"
asset_field() {
  node -e '
    const asset = JSON.parse(require("fs").readFileSync(0, "utf8")).find(({ name }) => name === process.argv[1]);
    process.stdout.write(asset?.[process.argv[2]] ? String(asset[process.argv[2]]) : "");
  ' "$1" "$2" <<<"$ASSETS_JSON"
}
LAST_OTA_NUMBER=0
for P in android ios; do
  ID="$(asset_field "ota-${P}.json" id)"
  PUBLISHED=""
  if [[ -n "$ID" ]]; then
    # Manifests uploaded before labels existed are read from the file instead
    PUBLISHED="$(asset_field "ota-${P}.json" label)"
    [[ -n "$PUBLISHED" ]] || PUBLISHED="$(github -H "Accept: application/octet-stream" "$API/releases/assets/${ID}" | json version)"
  fi
  printf -v "MANIFEST_ID_${P}" '%s' "$ID"
  printf -v "PUBLISHED_${P}" '%s' "$PUBLISHED"
  N="${PUBLISHED##*-ota.}"
  if [[ "$N" =~ ^[0-9]{1,6}$ ]] && ((10#$N > LAST_OTA_NUMBER)); then
    LAST_OTA_NUMBER=$((10#$N))
  fi
done
OTA_VERSION="${VERSION}-ota.$((LAST_OTA_NUMBER + 1))"
echo "Next OTA: ${OTA_VERSION} (release ${TAG})"

for PLATFORM in "${PLATFORMS[@]}"; do
  case "$PLATFORM" in
    android) BUNDLE_NAME="index.android.bundle" ;;
    ios) BUNDLE_NAME="main.jsbundle" ;;
    *) echo "Unsupported platform: $PLATFORM" >&2; exit 1 ;;
  esac
  MANIFEST="ota-${PLATFORM}.json"
  FULL_ZIP="ota-${PLATFORM}.zip"
  MANIFEST_ID_VAR="MANIFEST_ID_${PLATFORM}"
  PUBLISHED_VAR="PUBLISHED_${PLATFORM}"
  CACHE_DIR="$CACHE_ROOT/$PLATFORM"
  WORK_DIR="$(mktemp -d)"
  BUNDLE_DIR="$WORK_DIR/bundle"
  PATCH_DIR="$WORK_DIR/patches"
  mkdir -p "$BUNDLE_DIR" "$PATCH_DIR"

  print_step "BUNDLING ${PLATFORM} ${OTA_VERSION} (Hermes bytecode)"
  NODE_ENV=production npx expo export:embed \
    --platform "$PLATFORM" \
    --dev false \
    --bytecode \
    --entry-file "$ENTRY_FILE" \
    --bundle-output "$BUNDLE_DIR/$BUNDLE_NAME" \
    --assets-dest "$BUNDLE_DIR"

  # Shipped inside the zip too: the app stores the installed OTA's version from it.
  # targetVersions keeps the bundle off any other binary even if an asset were copied elsewhere.
  node -e '
    const [version, platform, appVersion, notes, file] = process.argv.slice(1);
    const manifest = { version, isSemver: false, targetVersions: { [platform]: [appVersion] } };
    if (notes) manifest.releaseNotes = notes;
    require("fs").writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
  ' "$OTA_VERSION" "$PLATFORM" "$VERSION" "$NOTES" "$BUNDLE_DIR/ota.version.json"

  # bsdiff patch from the OTA currently on the release, so devices already on it download only the delta
  PREV_ZIP_ID="$(asset_id "$FULL_ZIP")"
  if [[ -n "$PREV_ZIP_ID" ]]; then
    print_step "PATCHING ${PLATFORM} from the published OTA"
    # The last build published from this machine, while it's still the one on the release
    if [[ -n "${!PUBLISHED_VAR}" && -f "$CACHE_DIR/ota.version.json" &&
      "$(json version <"$CACHE_DIR/ota.version.json")" == "${!PUBLISHED_VAR}" ]]; then
      PREV_DIR="$CACHE_DIR"
      echo "Patching from the cached ${!PUBLISHED_VAR} build"
    else
      PREV_DIR="$WORK_DIR/previous"
      download_asset "$PREV_ZIP_ID" "$WORK_DIR/previous.zip"
      unzip -q "$WORK_DIR/previous.zip" -d "$PREV_DIR"
    fi
    if npx nitro-ota patch --old "$PREV_DIR" --new "$BUNDLE_DIR" --out "$PATCH_DIR" --url-base "$DOWNLOAD_BASE"; then
      # The CLI names patches <from>-<to>.zip on every platform; prefix them so both fit on one release,
      # in the manifest and in the copy of it inside each patch zip
      node -e '
        const fs = require("fs");
        const [file, base, prefix] = process.argv.slice(1);
        const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
        for (const [from, ref] of Object.entries(manifest.patches ?? {})) {
          manifest.patches[from] = `${base}/${prefix}${ref.split("/").pop()}`;
        }
        fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
      ' "$BUNDLE_DIR/ota.version.json" "$DOWNLOAD_BASE" "ota-${PLATFORM}-"
      for PATCH in "$PATCH_DIR"/*.zip; do
        [[ -e "$PATCH" ]] || continue
        PREFIXED="$PATCH_DIR/ota-${PLATFORM}-$(basename "$PATCH")"
        mv "$PATCH" "$PREFIXED"
        (cd "$BUNDLE_DIR" && zip -q "$PREFIXED" ota.version.json)
      done
    else
      echo -e "${YELLOW}⚠️  Patch generation failed; publishing the full bundle only.${NC}"
      rm -f "$PATCH_DIR"/*.zip
    fi
  else
    echo "No OTA on ${TAG} for ${PLATFORM} yet: publishing the full bundle only."
  fi

  # Flat zip: the app finds the bundle at the top level and keeps Metro's asset paths beside it
  (cd "$BUNDLE_DIR" && zip -qrX "$WORK_DIR/$FULL_ZIP" .)

  if [[ "$DRY_RUN" == true ]]; then
    echo -e "${GREEN}✅ Dry run: ${PLATFORM} OTA built in ${WORK_DIR} (not uploaded)${NC}"
    continue
  fi

  print_step "UPLOADING ${PLATFORM} to release ${TAG}"
  if [[ "$(asset_id "$MANIFEST")" != "${!MANIFEST_ID_VAR}" ]]; then
    echo "Another OTA for ${PLATFORM} was published while this one ran; re-run to publish on top of it." >&2
    exit 1
  fi
  # Patches and the full zip go up before the manifest, so a device never sees a version it can't fetch
  KEEP_PATCHES=""
  for PATCH in "$PATCH_DIR"/ota-*.zip; do
    [[ -e "$PATCH" ]] || continue
    NAME="$(basename "$PATCH")"
    ID="$(asset_id "$NAME")"
    [[ -z "$ID" ]] || delete_asset "$ID"
    upload_asset "$NAME" "$PATCH" application/zip >/dev/null
    KEEP_PATCHES="${KEEP_PATCHES} ${NAME}"
  done
  replace_asset "$FULL_ZIP" "$WORK_DIR/$FULL_ZIP" application/zip
  replace_asset "$MANIFEST" "$BUNDLE_DIR/ota.version.json" application/json "$OTA_VERSION"

  # Older patches target versions the manifest no longer offers a patch from
  for ID in $(github "$API/releases/${RELEASE_ID}/assets?per_page=100" | node -e '
    const [prefix, keep] = process.argv.slice(1);
    const assets = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const stale = assets.filter(({ name }) => name.startsWith(prefix) && name.endsWith(".zip") && !keep.split(" ").includes(name));
    process.stdout.write(stale.map(({ id }) => id).join("\n"));
  ' "ota-${PLATFORM}-" "$KEEP_PATCHES"); do
    delete_asset "$ID"
  done

  rm -rf "$CACHE_DIR"
  mkdir -p "$CACHE_ROOT"
  mv "$BUNDLE_DIR" "$CACHE_DIR"
  rm -rf "$WORK_DIR"
  echo -e "${GREEN}✅ ${PLATFORM}: ${OTA_VERSION} published to ${DOWNLOAD_BASE}/${MANIFEST}${NC}"
done
