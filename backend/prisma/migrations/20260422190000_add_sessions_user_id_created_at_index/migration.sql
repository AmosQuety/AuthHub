-- CreateIndex
-- Split into its own migration file (single statement) so Prisma Migrate runs it
-- outside a transaction — CONCURRENTLY is rejected by Postgres inside a transaction,
-- and migrate deploy wraps multi-statement migrations in one by default.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sessions_user_id_created_at_idx" ON "sessions"("user_id", "created_at" DESC);
