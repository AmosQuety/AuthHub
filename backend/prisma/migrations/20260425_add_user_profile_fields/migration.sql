-- Add profile completion fields to users table
ALTER TABLE "users" ADD COLUMN "phone_number" VARCHAR(20),
ADD COLUMN "profile_picture_url" TEXT,
ADD COLUMN "tos_accepted_at" TIMESTAMP(3);

-- Add index for profile completeness checks
CREATE INDEX "idx_users_tos_accepted" ON "users"("tos_accepted_at");
