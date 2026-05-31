-- Add owner_id column to tenants and foreign key to users
ALTER TABLE IF EXISTS tenants ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Add FK constraint if not exists (Postgres doesn't have IF NOT EXISTS for constraints,
-- so guard by checking pg_constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'tenants' AND c.conname = 'tenants_owner_id_fkey'
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT tenants_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Create index to speed lookups by owner
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);
