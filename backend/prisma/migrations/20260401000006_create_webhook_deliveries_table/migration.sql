-- Backfill drift: "webhook_deliveries" was already present in production (applied
-- outside Prisma Migrate) — no migration ever created the table. "IF NOT EXISTS" /
-- the pg_constraint guard make this a no-op on a database that already has it, while
-- still bootstrapping a from-scratch database correctly. Depends on
-- 20260401000005_create_webhook_endpoints_table for the parent table.

-- CreateTable
CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
    "id" UUID NOT NULL,
    "webhook_endpoint_id" UUID NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status_code" INTEGER,
    "response_body" TEXT,
    "duration_ms" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "webhook_deliveries_webhook_endpoint_id_created_at_idx" ON "webhook_deliveries"("webhook_endpoint_id", "created_at" DESC);

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'webhook_deliveries' AND c.conname = 'webhook_deliveries_webhook_endpoint_id_fkey'
  ) THEN
    ALTER TABLE "webhook_deliveries"
      ADD CONSTRAINT "webhook_deliveries_webhook_endpoint_id_fkey" FOREIGN KEY ("webhook_endpoint_id") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;
