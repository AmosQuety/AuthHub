-- Backfill drift: "users"."tenant_id" was already present in production (applied
-- outside Prisma Migrate at some point after the "tenants" table was created in
-- 20260311182102_add_advanced_auth_models), so 20260507120000_fix_user_auth_uniqueness
-- could reference it, but no migration ever created it. "IF NOT EXISTS" / the
-- pg_constraint guard make this a no-op on a database that already has the column
-- and the FK, while still bootstrapping a from-scratch database correctly.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'users' AND c.conname = 'users_tenant_id_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;
