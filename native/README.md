# Native Hyperswarm for Mobile

This directory contains native Hyperswarm bindings for iOS and Android, enabling P2P networking in the mobile app.

## Architecture

```
native/
├── hyperswarm-mobile/          # Rust core library
│   ├── src/
│   │   ├── lib.rs              # Library entry point
│   │   ├── swarm.rs            # Main swarm implementation
│   │   ├── peer.rs             # Peer management
│   │   ├── error.rs            # Error types
│   │   ├── dht/                # DHT implementation
│   │   │   ├── mod.rs          # DHT module
│   │   │   ├── routing.rs      # Kademlia routing table
│   │   │   └── rpc.rs          # DHT RPC protocol
│   │   ├── noise/              # Encryption
│   │   │   └── mod.rs          # Noise protocol (XX pattern)
│   │   ├── transport/          # Networking
│   │   │   └── mod.rs          # TCP with framing
│   │   └── ffi/                # C bindings
│   │       └── mod.rs          # C FFI functions
│   ├── include/
│   │   └── hyperswarm.h        # C header file
│   ├── build-ios.sh            # iOS build script
│   ├── build-android.sh        # Android build script
│   └── Cargo.toml              # Rust dependencies
│
└── react-native-hyperswarm/    # React Native module
    ├── index.ts                # JavaScript API
    ├── ios/
    │   └── HyperswarmModule.swift
    └── android/
        └── src/main/java/com/hyperswarm/
            └── HyperswarmModule.kt
```

## Prerequisites

### Rust Toolchain
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add mobile targets
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android

# Install cargo-ndk for Android
cargo install cargo-ndk
```

### iOS
- Xcode 14+
- Command Line Tools

### Android
- Android NDK (via Android Studio or standalone)
- Set `ANDROID_NDK_HOME` environment variable

## Building

### iOS
```bash
cd native/hyperswarm-mobile
./build-ios.sh
```

Output: `output/ios/HyperswarmMobile.xcframework`

### Android
```bash
cd native/hyperswarm-mobile
./build-android.sh
```

Output: `output/android/jniLibs/` with `.so` files for each architecture

## Integration

### iOS

1. Add `HyperswarmMobile.xcframework` to your Xcode project
2. Add the Swift bridging module
3. Link against `libresolv.tbd`

### Android

1. Copy `jniLibs/` to `android/app/src/main/`
2. Add the Kotlin module to your project
3. Register in `MainApplication.kt`

## JavaScript API

```typescript
import Hyperswarm, { EventType, createTopic } from 'react-native-hyperswarm';

// Create swarm
const swarm = new Hyperswarm();
await swarm.create({ deviceId: 'unique-device-id' });

// Listen for events
swarm.on(EventType.PeerConnected, (event) => {
  console.log('Peer connected:', event.peerId);
});

swarm.on(EventType.Data, (event) => {
  console.log('Received:', event.data, 'from:', event.peerId);
});

// Start and join topic
await swarm.start();
await swarm.join(createTopic('my-family-id'));

// Send data
await swarm.broadcast(JSON.stringify({ type: 'hello' }));
await swarm.send(peerId, JSON.stringify({ type: 'direct-message' }));

// Cleanup
swarm.destroy();
```

## Protocol Details

### DHT (Distributed Hash Table)
- Kademlia-based routing
- XOR distance metric
- UDP for DHT queries
- Topic-based peer discovery

### Encryption (Noise Protocol)
- XX handshake pattern
- Curve25519 key exchange
- ChaCha20-Poly1305 encryption
- Forward secrecy

### Transport
- TCP connections
- Length-prefixed framing
- NAT traversal via DHT

## Development

### Running Tests
```bash
cd native/hyperswarm-mobile
cargo test
```

### Debugging
- iOS: Use `os_log` (visible in Console.app)
- Android: Use `logcat` with tag "hyperswarm"

## Status

This is a work-in-progress implementation. Current status:

- [x] Core Rust library structure
- [x] DHT implementation (basic)
- [x] Noise protocol encryption
- [x] TCP transport with framing
- [x] C FFI layer
- [x] iOS Swift module
- [x] Android Kotlin module
- [x] React Native JavaScript API
- [ ] NAT traversal / hole punching
- [ ] Relay fallback
- [ ] Connection multiplexing
- [ ] Mobile-specific optimizations (battery, background)

## License

MIT
