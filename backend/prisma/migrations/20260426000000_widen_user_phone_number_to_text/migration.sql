-- Fix drift: 20260425_add_user_profile_fields created "users"."phone_number" as
-- VARCHAR(20), but schema.prisma declares it as a plain String (TEXT) with no length
-- cap, and production was already widened to TEXT outside Prisma Migrate. Re-applying
-- TEXT to an already-TEXT column is a cheap no-op (no table rewrite), so this is safe
-- to run against every environment.
ALTER TABLE "users" ALTER COLUMN "phone_number" TYPE TEXT;
