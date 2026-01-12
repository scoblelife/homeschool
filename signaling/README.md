# Homeschool Signaling Server

Lightweight WebRTC signaling server for P2P sync. This server handles device discovery and connection setup only - all actual sync data flows directly between devices via WebRTC.

## What it does

- **Device discovery**: Presence heartbeats to track online devices
- **WebRTC setup**: SDP/ICE exchange for establishing P2P connections
- **Device pairing**: Offer/answer exchange for QR code pairing

## What it does NOT do

- Store or relay sync data (that goes P2P via WebRTC)
- See any user's homeschool data
- Act as a proxy or relay server

## Building

### Option 1: Docker (traditional)

```bash
docker build -t homeschool-signaling .
docker run -p 8080:8080 homeschool-signaling
```

### Option 2: Nix (reproducible)

Requires Nix with flakes enabled.

```bash
# Build the binary
nix build

# Run locally
./result/bin/homeschool-signaling

# Build Docker image
nix build .#dockerImage
docker load < result
```

### Option 3: Cargo (development)

```bash
cargo build --release
./target/release/homeschool-signaling
```

## Deploying to Fly.io

### Option 1: Fly.io Remote Builders (Recommended)

Uses the Dockerfile with Fly.io's remote build servers:

```bash
fly deploy
```

### Option 2: Nix + Local Docker

Builds a reproducible Docker image using Nix's `dockerTools`:

```bash
# On Linux
nix build .#dockerImage
docker load < result
fly deploy --local-only --image homeschool-signaling:latest

# On macOS (requires Linux remote builder configured in Nix)
./deploy-nix.sh
```

**Note**: Building Docker images requires Linux. On macOS, you need:
- A remote Nix build server, OR
- nix-darwin with linux-builder, OR
- Use Option 1 (Fly.io's builders)

### Flake Outputs

```bash
nix build              # Build binary (native)
nix build .#dockerImage       # Docker image (layered, requires Linux)
nix build .#dockerImageStream # Streaming image (more efficient)
nix develop            # Dev shell with Rust toolchain
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check with stats |
| POST | `/offer/:topic` | Store join offer |
| GET | `/offer/:topic` | Get and delete offer |
| POST | `/answer/:topic` | Store answer |
| GET | `/answer/:topic` | Get and delete answer |
| POST | `/presence/:familyId/:deviceId` | Send heartbeat |
| DELETE | `/presence/:familyId/:deviceId` | Remove presence |
| GET | `/presence/:familyId` | Get online peers |
| POST | `/signal/:topic/:peerId` | Send signal |
| GET | `/signal/:topic/:peerId` | Poll and delete signals |

## Configuration

- `PORT`: Server port (default: 8080)
- `RUST_LOG`: Log level (default: `homeschool_signaling=info,tower_http=info`)

## TTL Values

- Offers: 48 hours (device pairing can be slow)
- Answers: 5 minutes
- Presence: 60 seconds (requires regular heartbeats)
- Signals: 5 minutes
