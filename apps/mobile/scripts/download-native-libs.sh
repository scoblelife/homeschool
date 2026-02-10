#!/bin/bash
# Download pre-built native libraries during EAS Build

set -e

# Parse arguments (EAS may pass --platform <platform>)
while [[ $# -gt 0 ]]; do
    case $1 in
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Use EAS_BUILD_PLATFORM env var if available, otherwise use passed argument
PLATFORM="${EAS_BUILD_PLATFORM:-$PLATFORM}"

GITHUB_REPO="sscoble/homeschool"
NATIVE_LIBS_DIR="$PWD/native-libs"

echo "[Hyperswarm] Downloading native libraries..."
echo "[Hyperswarm] Platform: $PLATFORM"

# Create directory
mkdir -p "$NATIVE_LIBS_DIR"

# Try to get the latest release
LATEST_TAG=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases" | grep '"tag_name":' | grep 'native-libs' | head -1 | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_TAG" ]; then
    echo "[Hyperswarm] No native library release found, skipping..."
    exit 0
fi

echo "[Hyperswarm] Found release: $LATEST_TAG"

# Download and extract
DOWNLOAD_URL="https://github.com/$GITHUB_REPO/releases/download/$LATEST_TAG/hyperswarm-native-libs.tar.gz"
curl -L -o "$NATIVE_LIBS_DIR/libs.tar.gz" "$DOWNLOAD_URL"
tar -xzf "$NATIVE_LIBS_DIR/libs.tar.gz" -C "$NATIVE_LIBS_DIR"
rm "$NATIVE_LIBS_DIR/libs.tar.gz"

echo "[Hyperswarm] Native libraries downloaded successfully"

# Platform-specific setup
if [ "$PLATFORM" = "android" ]; then
    echo "[Hyperswarm] Setting up Android JNI libraries..."
    mkdir -p "$PWD/android/app/src/main/jniLibs"
    cp -r "$NATIVE_LIBS_DIR/android/jniLibs/"* "$PWD/android/app/src/main/jniLibs/"
    echo "[Hyperswarm] Android setup complete"
elif [ "$PLATFORM" = "ios" ]; then
    echo "[Hyperswarm] iOS libraries will be linked during build..."
    # Copy header to a location Xcode can find
    mkdir -p "$PWD/ios/Homeschool"
    cp "$NATIVE_LIBS_DIR/hyperswarm.h" "$PWD/ios/Homeschool/"
    echo "[Hyperswarm] iOS setup complete"
fi

echo "[Hyperswarm] Done!"
