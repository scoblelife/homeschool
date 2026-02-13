#!/bin/bash
set -eo pipefail

# Enable corepack so EAS Build uses the correct pnpm version
# from the root package.json "packageManager" field
corepack enable
corepack prepare pnpm@10.29.2 --activate

echo "pnpm version: $(pnpm --version)"
