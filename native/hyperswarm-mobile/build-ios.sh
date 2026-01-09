#!/bin/bash
# Build Hyperswarm for iOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Ensure Rust targets are installed
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

# Build for each target
echo "Building for iOS (arm64)..."
cargo build --release --target aarch64-apple-ios

echo "Building for iOS Simulator (arm64)..."
cargo build --release --target aarch64-apple-ios-sim

echo "Building for iOS Simulator (x86_64)..."
cargo build --release --target x86_64-apple-ios

# Create output directory
OUTPUT_DIR="$SCRIPT_DIR/output/ios"
mkdir -p "$OUTPUT_DIR"

# Copy static libraries
cp target/aarch64-apple-ios/release/libhyperswarm_mobile.a "$OUTPUT_DIR/libhyperswarm_mobile-ios-arm64.a"
cp target/aarch64-apple-ios-sim/release/libhyperswarm_mobile.a "$OUTPUT_DIR/libhyperswarm_mobile-ios-sim-arm64.a"
cp target/x86_64-apple-ios/release/libhyperswarm_mobile.a "$OUTPUT_DIR/libhyperswarm_mobile-ios-sim-x86_64.a"

# Create fat library for simulator
echo "Creating fat library for simulator..."
lipo -create \
    "$OUTPUT_DIR/libhyperswarm_mobile-ios-sim-arm64.a" \
    "$OUTPUT_DIR/libhyperswarm_mobile-ios-sim-x86_64.a" \
    -output "$OUTPUT_DIR/libhyperswarm_mobile-ios-sim.a"

# Create XCFramework
echo "Creating XCFramework..."
rm -rf "$OUTPUT_DIR/HyperswarmMobile.xcframework"
xcodebuild -create-xcframework \
    -library "$OUTPUT_DIR/libhyperswarm_mobile-ios-arm64.a" \
    -headers "$SCRIPT_DIR/include" \
    -library "$OUTPUT_DIR/libhyperswarm_mobile-ios-sim.a" \
    -headers "$SCRIPT_DIR/include" \
    -output "$OUTPUT_DIR/HyperswarmMobile.xcframework"

echo "Done! XCFramework created at: $OUTPUT_DIR/HyperswarmMobile.xcframework"
