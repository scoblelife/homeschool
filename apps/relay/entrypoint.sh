#!/bin/sh
set -e

# Apply database schema if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Running drizzle-kit push to sync schema..."
  npx drizzle-kit push --force --config drizzle.config.ts || echo "[entrypoint] drizzle-kit push failed — continuing without DB schema sync"
else
  echo "[entrypoint] DATABASE_URL not set — skipping schema sync"
fi

exec node dist/index.js
