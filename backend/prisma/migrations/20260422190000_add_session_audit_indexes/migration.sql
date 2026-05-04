-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sessions_userId_createdAt_idx" ON "sessions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sessions_userId_expiresAt_idx" ON "sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sessions_expiresAt_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_logs_userId_createdAt_idx" ON "audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_logs_status_createdAt_idx" ON "audit_logs"("status", "created_at" DESC);
