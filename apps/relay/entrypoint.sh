#!/bin/sh
set -e

# Start the server immediately — healthcheck must pass first.
# Run schema sync in the background so it never blocks startup.
if [ -n "$DATABASE_URL" ]; then
  (
    echo "[entrypoint] Running drizzle-kit push to sync schema..."
    timeout 30 npx drizzle-kit push --force --config drizzle.config.ts 2>&1 \
      && echo "[entrypoint] Schema sync complete" \
      || echo "[entrypoint] drizzle-kit push failed or timed out — server continues without schema sync"
  ) &
else
  echo "[entrypoint] DATABASE_URL not set — skipping schema sync"
fi

exec node dist/index.js
