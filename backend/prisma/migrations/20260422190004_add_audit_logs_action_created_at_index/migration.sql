-- CreateIndex
-- Split into its own migration file (single statement) so Prisma Migrate runs it
-- outside a transaction — CONCURRENTLY is rejected by Postgres inside a transaction,
-- and migrate deploy wraps multi-statement migrations in one by default.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at" DESC);
