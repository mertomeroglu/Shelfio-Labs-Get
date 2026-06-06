ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS license_id uuid REFERENCES licenses(id) ON DELETE SET NULL;
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE INDEX IF NOT EXISTS demo_requests_license_id_idx ON demo_requests(license_id);
CREATE INDEX IF NOT EXISTS demo_requests_status_idx ON demo_requests(status);

CREATE TABLE IF NOT EXISTS license_plan_changes (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  license_id uuid NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  current_plan_id uuid NOT NULL REFERENCES plans(id),
  requested_plan_id uuid NOT NULL REFERENCES plans(id),
  requested_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'applied')),
  starts_at timestamptz NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  applied_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS license_plan_changes_tenant_status_idx ON license_plan_changes(tenant_id, status);
CREATE INDEX IF NOT EXISTS license_plan_changes_license_status_idx ON license_plan_changes(license_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS license_plan_changes_one_pending_per_license_idx
  ON license_plan_changes(license_id)
  WHERE status = 'pending';
