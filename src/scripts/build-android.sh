#!/bin/bash

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

# Generate FFMPEG AAR
print_step "STEP 4: GENERATING FFMPEG AAR"
./gradlew :app:downloadAar

# Build release APK
print_step "STEP 5: BUILDING RELEASE APK"
./gradlew assembleRelease

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