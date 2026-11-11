#!/bin/sh
set -eu

echo "Running database migrations..."
node ./migrate.mjs

echo "Starting server..."
exec node server.js
