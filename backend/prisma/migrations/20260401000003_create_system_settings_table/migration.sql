-- Backfill drift: "system_settings" was already present in production (applied
-- outside Prisma Migrate) — no migration ever created the table. "IF NOT EXISTS"
-- makes this a no-op on a database that already has it, while still bootstrapping
-- a from-scratch database correctly.

-- CreateTable
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "global_mfa_force" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
