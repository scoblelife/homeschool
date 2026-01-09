#!/bin/bash
# Build Hyperswarm for Android

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check for Android NDK
if [ -z "$ANDROID_NDK_HOME" ]; then
    # Try common locations
    if [ -d "$HOME/Library/Android/sdk/ndk" ]; then
        ANDROID_NDK_HOME=$(ls -d "$HOME/Library/Android/sdk/ndk"/*/ | head -1)
    elif [ -d "$HOME/Android/Sdk/ndk" ]; then
        ANDROID_NDK_HOME=$(ls -d "$HOME/Android/Sdk/ndk"/*/ | head -1)
    fi
fi

if [ -z "$ANDROID_NDK_HOME" ]; then
    echo "Error: ANDROID_NDK_HOME not set and couldn't find NDK"
    echo "Please install Android NDK and set ANDROID_NDK_HOME"
    exit 1
fi

echo "Using NDK: $ANDROID_NDK_HOME"

# Install cargo-ndk if not present
if ! command -v cargo-ndk &> /dev/null; then
    echo "Installing cargo-ndk..."
    cargo install cargo-ndk
fi

# Ensure Rust targets are installed
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android

# Create output directory
OUTPUT_DIR="$SCRIPT_DIR/output/android/jniLibs"
mkdir -p "$OUTPUT_DIR"

# Build for each architecture
echo "Building for Android..."
cargo ndk \
    -t arm64-v8a \
    -t armeabi-v7a \
    -t x86_64 \
    -t x86 \
    -o "$OUTPUT_DIR" \
    build --release

# Copy header file
mkdir -p "$SCRIPT_DIR/output/android/include"
cp "$SCRIPT_DIR/include/hyperswarm.h" "$SCRIPT_DIR/output/android/include/"

echo "Done! Libraries created at: $OUTPUT_DIR"
echo ""
echo "Directory structure:"
find "$OUTPUT_DIR" -name "*.so" | head -10
