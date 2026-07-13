-- Backfill helper for User.username (back#24 / front#50).
--
-- This project applies schema changes with `npx prisma db push`, not Prisma
-- migrations. `db push` only syncs the schema shape; it cannot run this
-- backfill inline. Because `username` is required (NOT NULL) and unique, adding
-- it to a table that already has rows needs the rows populated first.
--
-- Apply procedure against a real database (pick ONE):
--
--   A) Disposable dev DB (no rows to preserve):
--        npx prisma db push        # may prompt to reset; accept if the DB is throwaway
--
--   B) DB with existing users to preserve (three steps):
--        1. Temporarily make username optional in schema.prisma (`username String? @unique`),
--           then: npx prisma db push
--        2. Run this file to backfill existing rows:
--           psql "$DATABASE_URL" -f prisma/backfill-username.sql
--        3. Restore `username String @unique` (required) in schema.prisma,
--           then: npx prisma db push
--
-- Backfill value: 'player_' + first 8 chars of the user id (matches the
-- Username VO invariant: 3-20 chars, [A-Za-z0-9_]).

UPDATE "User"
SET "username" = 'player_' || substr("id", 1, 8)
WHERE "username" IS NULL;
