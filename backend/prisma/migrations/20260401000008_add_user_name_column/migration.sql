-- Backfill drift: "users"."name" was already present in production (applied outside
-- Prisma Migrate), which is why 20260531153000_enforce_unique_user_email could already
-- reference it, but no migration ever created it. "IF NOT EXISTS" makes this a no-op on
-- a database that already has the column, while still bootstrapping a from-scratch
-- database correctly.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT;
