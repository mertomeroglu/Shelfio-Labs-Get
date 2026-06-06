-- Create store_license_requests table
CREATE TABLE IF NOT EXISTS store_license_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_store_name text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  base_license_id uuid REFERENCES licenses(id) ON DELETE SET NULL,
  generated_license_id uuid REFERENCES licenses(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES plans(id) ON DELETE SET NULL,
  plan_slug text,
  admin_note text,
  decided_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add store_name to licenses table
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS store_name text;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS store_license_requests_tenant_id_idx ON store_license_requests(tenant_id);
CREATE INDEX IF NOT EXISTS store_license_requests_status_idx ON store_license_requests(status);
CREATE INDEX IF NOT EXISTS store_license_requests_generated_license_id_idx ON store_license_requests(generated_license_id);
CREATE INDEX IF NOT EXISTS store_license_requests_created_at_idx ON store_license_requests(created_at);

-- Duplicate guard: Same customer + lower(requested_store_name) + pending/approved is unique
CREATE UNIQUE INDEX IF NOT EXISTS store_license_requests_tenant_store_unique_idx
  ON store_license_requests (tenant_id, lower(requested_store_name))
  WHERE (status IN ('pending', 'approved'));

-- Align plans and tenants for corrected demo limits (store_limit = 1, user_limit = 5)
UPDATE plans
SET store_limit = 1, user_limit = 5, updated_at = now()
WHERE slug = 'demo';

UPDATE tenants
SET store_limit = 1, user_limit = 5, updated_at = now()
WHERE id IN (
  SELECT tenant_id
  FROM licenses l
  JOIN plans p ON p.id = l.plan_id
  WHERE p.slug = 'demo' AND l.status IN ('active', 'pending') AND l.tenant_id IS NOT NULL
);
