-- Backfill drift: "user_consents" was already present in production (applied outside
-- Prisma Migrate), which is why 20260531153000_enforce_unique_user_email could already
-- reference it in an UPDATE statement, but no migration ever created the table.
-- "IF NOT EXISTS" / the pg_constraint guards make this a no-op on a database that
-- already has it, while still bootstrapping a from-scratch database correctly.

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_consents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "client_id" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_consents_user_id_client_id_key" ON "user_consents"("user_id", "client_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'user_consents' AND c.conname = 'user_consents_user_id_fkey'
  ) THEN
    ALTER TABLE "user_consents"
      ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'user_consents' AND c.conname = 'user_consents_client_id_fkey'
  ) THEN
    ALTER TABLE "user_consents"
      ADD CONSTRAINT "user_consents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "oauth_clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;
