-- Add a dedicated privacy acceptance timestamp so social sign-ups persist both consents.
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "privacy_accepted_at" TIMESTAMP(3);
