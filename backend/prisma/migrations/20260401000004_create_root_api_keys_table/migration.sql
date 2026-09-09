-- Backfill drift: "root_api_keys" was already present in production (applied
-- outside Prisma Migrate) — no migration ever created the table. "IF NOT EXISTS"
-- makes this a no-op on a database that already has it, while still bootstrapping
-- a from-scratch database correctly.

-- CreateTable
CREATE TABLE IF NOT EXISTS "root_api_keys" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "root_api_keys_pkey" PRIMARY KEY ("id")
);
