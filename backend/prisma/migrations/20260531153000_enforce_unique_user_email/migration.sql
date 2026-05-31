-- Normalize, deduplicate, and enforce a single account per email.
-- Strategy:
-- 1. Lower-case all stored emails so lookups and uniqueness use one canonical form.
-- 2. Pick one canonical user per email, preferring the earliest record.
-- 3. Reassign child rows that point at duplicate users.
-- 4. Merge profile data back into the canonical row where the canonical value is missing.
-- 5. Delete duplicate user rows and enforce a strict unique email index.

CREATE TEMP TABLE user_email_merge_map (
  duplicate_id uuid PRIMARY KEY,
  canonical_id uuid NOT NULL,
  email text NOT NULL
) ON COMMIT DROP;

UPDATE "users"
SET "email" = lower("email")
WHERE "email" <> lower("email");

INSERT INTO user_email_merge_map (duplicate_id, canonical_id, email)
WITH ranked_users AS (
  SELECT
    id,
    email,
    row_number() OVER (PARTITION BY email ORDER BY "created_at" ASC, id ASC) AS row_num
  FROM "users"
),
canonical_users AS (
  SELECT email, id AS canonical_id
  FROM ranked_users
  WHERE row_num = 1
)
SELECT ranked_users.id AS duplicate_id, canonical_users.canonical_id, ranked_users.email
FROM ranked_users
JOIN canonical_users USING (email)
WHERE ranked_users.row_num > 1;

UPDATE "sessions" s
SET "user_id" = m.canonical_id
FROM user_email_merge_map m
WHERE s."user_id" = m.duplicate_id;

UPDATE "auth_providers" ap
SET "user_id" = m.canonical_id
FROM user_email_merge_map m
WHERE ap."user_id" = m.duplicate_id;

UPDATE "mfa_methods" mm
SET "user_id" = m.canonical_id
FROM user_email_merge_map m
WHERE mm."user_id" = m.duplicate_id;

UPDATE "audit_logs" al
SET "user_id" = m.canonical_id
FROM user_email_merge_map m
WHERE al."user_id" = m.duplicate_id;

UPDATE "user_consents" uc
SET "user_id" = m.canonical_id
FROM user_email_merge_map m
WHERE uc."user_id" = m.duplicate_id;

UPDATE "entitlements" e
SET "user_id" = m.canonical_id
FROM user_email_merge_map m
WHERE e."user_id" = m.duplicate_id;

UPDATE "oauth_clients" oc
SET "owner_id" = m.canonical_id
FROM user_email_merge_map m
WHERE oc."owner_id" = m.duplicate_id;

WITH duplicate_aggregate AS (
  SELECT
    m.canonical_id,
    bool_or(u."email_verified") AS email_verified,
    min(u."name") FILTER (WHERE u."name" IS NOT NULL) AS name,
    min(u."phone_number") FILTER (WHERE u."phone_number" IS NOT NULL) AS phone_number,
    min(u."profile_picture_url") FILTER (WHERE u."profile_picture_url" IS NOT NULL) AS profile_picture_url,
    min(u."password_hash") FILTER (WHERE u."password_hash" IS NOT NULL) AS password_hash,
    min(u."tos_accepted_at") FILTER (WHERE u."tos_accepted_at" IS NOT NULL) AS tos_accepted_at,
    min(u."tenant_id") FILTER (WHERE u."tenant_id" IS NOT NULL) AS tenant_id,
    bool_or('ADMIN' = ANY(u."roles")) AS has_admin_role
  FROM user_email_merge_map m
  JOIN "users" u ON u.id = m.duplicate_id
  GROUP BY m.canonical_id
)
UPDATE "users" canonical
SET
  "email_verified" = canonical."email_verified" OR duplicate_aggregate.email_verified,
  "name" = COALESCE(canonical."name", duplicate_aggregate.name),
  "phone_number" = COALESCE(canonical."phone_number", duplicate_aggregate.phone_number),
  "profile_picture_url" = COALESCE(canonical."profile_picture_url", duplicate_aggregate.profile_picture_url),
  "password_hash" = COALESCE(canonical."password_hash", duplicate_aggregate.password_hash),
  "tos_accepted_at" = COALESCE(canonical."tos_accepted_at", duplicate_aggregate.tos_accepted_at),
  "tenant_id" = COALESCE(canonical."tenant_id", duplicate_aggregate.tenant_id),
  "roles" = CASE
    WHEN canonical."roles" @> ARRAY['ADMIN']::"Role"[] OR duplicate_aggregate.has_admin_role
      THEN ARRAY['USER', 'ADMIN']::"Role"[]
    ELSE ARRAY['USER']::"Role"[]
  END
FROM duplicate_aggregate
WHERE canonical.id = duplicate_aggregate.canonical_id;

DELETE FROM "users" u
USING user_email_merge_map m
WHERE u.id = m.duplicate_id;

DROP INDEX IF EXISTS "users_email_key";
DROP INDEX IF EXISTS "users_email_tenant_id_key";
DROP INDEX IF EXISTS "users_email_platform_key";

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
