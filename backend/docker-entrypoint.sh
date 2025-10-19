#!/bin/sh
set -e

# If .env not provided, try to use environment variables only.
# Apply DB schema every time container starts (idempotent)
echo "Applying DB schema..."
node src/scripts/initDb.js || {
  echo "Schema application failed"; exit 1;
}

# Optionally seed if SEED=true
if [ "$SEED" = "true" ]; then
  echo "Seeding sample data..."
  node src/scripts/seed.js || echo "Seed failed (continuing)..."
fi

# Start the API
exec "$@"
