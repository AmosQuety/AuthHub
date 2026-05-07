-- Preserve tenant-scoped uniqueness while restoring globally unique developer emails.
DROP INDEX IF EXISTS "users_email_key";

CREATE UNIQUE INDEX "users_email_tenant_id_key" ON "users"("email", "tenant_id");

CREATE UNIQUE INDEX "users_email_platform_key" ON "users"("email") WHERE "tenant_id" IS NULL;