#!/bin/sh
set -eu

echo "Running database migrations..."
./node_modules/.bin/drizzle-kit migrate

echo "Starting server..."
exec node server.js
