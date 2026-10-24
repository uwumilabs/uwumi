#!/bin/bash
# Fail fast so a broken build aborts `yarn release` (run from release-it's after:bump hook)
set -euo pipefail

# Set environment variables
export NODE_ENV=production

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function for colorful logs
print_step() {
  echo ""
  echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC} ${YELLOW}🚀 $1${NC}"
  echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# Bundle JavaScript code
print_step "STEP 1: BUNDLING JAVASCRIPT CODE"
npx react-native bundle --platform android --dev false --entry-file ./src/app/_layout.tsx --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

# Change the current directory to the android directory of the project
print_step "STEP 2: CHANGING DIRECTORY TO ANDROID"
cd android

# Clean build
# print_step "STEP 3: CLEANING PREVIOUS BUILD"
# ./gradlew clean


# Build release APK
print_step "STEP 5: BUILDING RELEASE APK"
# Full output goes to a log: release-it runs this hook through exec(), which kills it past ~1MB of output
mkdir -p build
echo "Full log: android/build/gradle-release.log"
if ! ./gradlew :app:assembleRelease >build/gradle-release.log 2>&1; then
  tail -n 40 build/gradle-release.log
  exit 1
fi

cd ..

# Releases used to be signed with React Native's public debug key, so the APKs move to uwumi's own key with a
# rotation proof (signing/android-key-rotation.lineage): Android 9+ updates to the new key and refuses APKs signed
# only with the old one; Android 7–8.1 can't rotate, so they keep the old key's v2 signature and still update.
print_step "STEP 6: SIGNING RELEASE APKS"
KEYSTORE="${UWUMI_KEYSTORE_PATH:-$HOME/.uwumi-keys/uwumi-release.keystore}"
if [[ -z "${UWUMI_KEYSTORE_PASSWORD:-}" && -f .env ]]; then
  UWUMI_KEYSTORE_PASSWORD="$(sed -n 's/^UWUMI_KEYSTORE_PASSWORD=//p' .env | sed -E "s/^[\"'](.*)[\"']$/\1/")"
fi
export UWUMI_KEYSTORE_PASSWORD
if [[ ! -f "$KEYSTORE" || -z "$UWUMI_KEYSTORE_PASSWORD" ]]; then
  echo -e "${RED}Release keystore or UWUMI_KEYSTORE_PASSWORD missing (keystore: $KEYSTORE)${NC}" >&2
  exit 1
fi
SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
APKSIGNER="$(ls -d "$SDK_DIR"/build-tools/*/ | sort -V | tail -n 1)apksigner"
for APK in android/app/build/outputs/apk/release/*.apk; do
  "$APKSIGNER" sign \
    --ks android/app/debug.keystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android \
    --next-signer --ks "$KEYSTORE" --ks-key-alias uwumi --ks-pass env:UWUMI_KEYSTORE_PASSWORD \
    --lineage signing/android-key-rotation.lineage --rotation-min-sdk-version 28 \
    --v4-signing-enabled false \
    "$APK"
  "$APKSIGNER" verify --min-sdk-version 24 "$APK"
  echo "Signed $(basename "$APK")"
done

# Install release APK
# print_step "STEP 6: INSTALLING RELEASE APK"
# ./gradlew installRelease

# Uncomment if you need to bundle AAB
# print_step "STEP 7: BUNDLING RELEASE AAB"
# ./gradlew bundleRelease

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC} ${GREEN}✅ BUILD COMPLETED SUCCESSFULLY${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""