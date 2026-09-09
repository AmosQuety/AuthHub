-- Backfill drift: "entitlements" was already present in production (applied outside
-- Prisma Migrate) — no migration ever created the table. "IF NOT EXISTS" / the
-- pg_constraint guard make this a no-op on a database that already has it, while
-- still bootstrapping a from-scratch database correctly.

-- CreateTable
CREATE TABLE IF NOT EXISTS "entitlements" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_subscription_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "entitlements_provider_subscription_id_key" ON "entitlements"("provider_subscription_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'entitlements' AND c.conname = 'entitlements_user_id_fkey'
  ) THEN
    ALTER TABLE "entitlements"
      ADD CONSTRAINT "entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;
