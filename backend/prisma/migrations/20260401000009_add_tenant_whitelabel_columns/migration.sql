-- Backfill drift: these "tenants" white-label/custom-domain/SMTP columns were already
-- present in production (applied outside Prisma Migrate) — no migration ever created
-- them. "IF NOT EXISTS" makes this a no-op on a database that already has them, while
-- still bootstrapping a from-scratch database correctly.
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "client_id" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "custom_domain" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "email_from" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "smtp_host" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "smtp_pass_hash" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "smtp_port" INTEGER;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "smtp_user" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "webhook_secret" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_client_id_key" ON "tenants"("client_id");
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_custom_domain_key" ON "tenants"("custom_domain");
