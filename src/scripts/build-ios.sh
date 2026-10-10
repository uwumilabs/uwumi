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
ARCHIVE_PATH="$BUILD_DIR/uwumi.xcarchive"
IPA_PATH="$BUILD_DIR/uwumi-v$VERSION.ipa"

# The Release configuration embeds the JS bundle itself ("Bundle React Native code and images" phase)
print_step "STEP 1: ARCHIVING UNSIGNED RELEASE BUILD"
rm -rf "$ARCHIVE_PATH"
xcodebuild archive \
  -quiet \
  -workspace "$ROOT_DIR/ios/uwumi.xcworkspace" \
  -scheme uwumi \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY=""

print_step "STEP 2: PACKAGING .IPA"
STAGING_DIR="$(mktemp -d)"
mkdir "$STAGING_DIR/Payload"
cp -R "$ARCHIVE_PATH/Products/Applications/uwumi.app" "$STAGING_DIR/Payload/"
rm -f "$IPA_PATH"
(cd "$STAGING_DIR" && zip -qry "$IPA_PATH" Payload)
rm -rf "$STAGING_DIR"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC} ${GREEN}✅ IPA READY: ios/build/uwumi-v$VERSION.ipa${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
