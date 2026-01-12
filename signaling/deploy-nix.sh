#!/usr/bin/env bash
# Build Docker image using Nix and deploy to Fly.io
#
# This script uses Nix's dockerTools to build a reproducible container image
# without requiring Docker daemon for the build step.
#
# REQUIREMENTS:
# - On macOS: Requires a Linux remote builder (nix-darwin with linux-builder,
#   or a remote Nix build host) since Docker images must be Linux containers.
# - On Linux: Works directly
#
# ALTERNATIVE: Use `fly deploy` (without this script) to have Fly.io
# build the Docker image using the Dockerfile on their servers.

set -euo pipefail

# Detect system
SYSTEM=$(nix eval --raw nixpkgs#system 2>/dev/null || uname -s | tr '[:upper:]' '[:lower:]')

echo "=== Building Docker image with Nix ==="
echo "Current system: $SYSTEM"

# Build for x86_64-linux (required for Fly.io)
if [[ "$SYSTEM" == *"darwin"* ]]; then
    echo "NOTE: Building Linux image from macOS requires a remote builder."
    echo "If you don't have one configured, use 'fly deploy' instead."
    echo ""
    # Try to build with remote builders
    nix build .#dockerImage --system x86_64-linux --out-link result-docker
else
    nix build .#dockerImage --out-link result-docker
fi

echo "=== Loading image into Docker ==="

# Load the image into Docker
docker load < result-docker

echo "=== Deploying to Fly.io ==="

# Deploy using fly deploy with local Docker image
# The --local-only flag uses the local Docker daemon instead of remote builders
fly deploy --local-only --image homeschool-signaling:latest

echo "=== Done! ==="
echo "Check deployment status: fly status"
echo "View logs: fly logs"
