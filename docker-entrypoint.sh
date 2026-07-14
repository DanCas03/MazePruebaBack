#!/bin/sh
set -e

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Applying database migrations"
npx prisma migrate deploy

echo "==> Seeding curated levels (idempotent upsert)"
npx prisma db seed

echo "==> Starting: $@"
exec "$@"
