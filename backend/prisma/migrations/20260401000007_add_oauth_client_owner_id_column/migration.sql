-- Backfill drift: "oauth_clients"."owner_id" was already present in production
-- (applied outside Prisma Migrate), which is why 20260531153000_enforce_unique_user_email
-- could already reference it, but no migration ever created it. "IF NOT EXISTS" / the
-- pg_constraint guard make this a no-op on a database that already has the column and
-- the FK, while still bootstrapping a from-scratch database correctly.
ALTER TABLE "oauth_clients" ADD COLUMN IF NOT EXISTS "owner_id" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'oauth_clients' AND c.conname = 'oauth_clients_owner_id_fkey'
  ) THEN
    ALTER TABLE "oauth_clients"
      ADD CONSTRAINT "oauth_clients_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;
