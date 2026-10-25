#!/bin/bash
# Builds an unsigned .ipa for sideloading (AltStore, SideStore, Sideloadly, TrollStore re-sign it on install).
set -euo pipefail

export NODE_ENV=production

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

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION="$(node -p "require('$ROOT_DIR/package.json').version")"
BUILD_DIR="$ROOT_DIR/ios/build"

# `build-ios.sh tvos` archives the Apple TV app instead; ios/ must come from `yarn prebuild:tv`
PLATFORM="${1:-ios}"
if grep -q "SDKROOT = appletvos" "$ROOT_DIR/ios/uwumi.xcodeproj/project.pbxproj"; then
  PREBUILT_FOR="tvos"
else
  PREBUILT_FOR="ios"
fi
if [ "$PLATFORM" != "$PREBUILT_FOR" ]; then
  [ "$PLATFORM" = "tvos" ] && PREBUILD_SCRIPT="prebuild:tv" || PREBUILD_SCRIPT="prebuild:phone"
  echo "❌ ios/ is prebuilt for $PREBUILT_FOR, not $PLATFORM. Run 'yarn $PREBUILD_SCRIPT' first."
  exit 1
fi
if [ "$PLATFORM" = "tvos" ]; then
  DESTINATION="generic/platform=tvOS"
  NAME="uwumi-tvos"
else
  DESTINATION="generic/platform=iOS"
  NAME="uwumi"
fi
ARCHIVE_PATH="$BUILD_DIR/$NAME.xcarchive"
IPA_PATH="$BUILD_DIR/$NAME-v$VERSION.ipa"

# The Release configuration embeds the JS bundle itself ("Bundle React Native code and images" phase)
print_step "STEP 1: ARCHIVING UNSIGNED RELEASE BUILD"
rm -rf "$ARCHIVE_PATH"
mkdir -p "$BUILD_DIR"
# Full output goes to a log: release-it runs this hook through exec(), which kills it past ~1MB of output
LOG_FILE="$BUILD_DIR/xcodebuild.log"
echo "Full log: ios/build/xcodebuild.log"
if ! xcodebuild archive \
  -quiet \
  -workspace "$ROOT_DIR/ios/uwumi.xcworkspace" \
  -scheme uwumi \
  -configuration Release \
  -destination "$DESTINATION" \
  -archivePath "$ARCHIVE_PATH" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" >"$LOG_FILE" 2>&1; then
  grep -E "error:" "$LOG_FILE" | head -n 20 || true
  tail -n 30 "$LOG_FILE"
  exit 1
fi

print_step "STEP 2: PACKAGING .IPA"
STAGING_DIR="$(mktemp -d)"
mkdir "$STAGING_DIR/Payload"
cp -R "$ARCHIVE_PATH/Products/Applications/uwumi.app" "$STAGING_DIR/Payload/"
rm -f "$IPA_PATH"
(cd "$STAGING_DIR" && zip -qry "$IPA_PATH" Payload)
rm -rf "$STAGING_DIR"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC} ${GREEN}✅ IPA READY: ios/build/$NAME-v$VERSION.ipa${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
