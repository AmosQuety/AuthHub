-- Backfill drift: "webhook_endpoints" was already present in production (applied
-- outside Prisma Migrate) — no migration ever created the table. "IF NOT EXISTS" /
-- the pg_constraint guard make this a no-op on a database that already has it, while
-- still bootstrapping a from-scratch database correctly.

-- CreateTable
CREATE TABLE IF NOT EXISTS "webhook_endpoints" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'webhook_endpoints' AND c.conname = 'webhook_endpoints_tenant_id_fkey'
  ) THEN
    ALTER TABLE "webhook_endpoints"
      ADD CONSTRAINT "webhook_endpoints_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;
