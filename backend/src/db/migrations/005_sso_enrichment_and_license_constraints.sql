-- SSO panel access codes table license relationship
ALTER TABLE panel_access_codes ADD COLUMN IF NOT EXISTS license_id uuid REFERENCES licenses(id) ON DELETE SET NULL;

-- UNIQUE INDEX SUGGESTIONS (Can be run manually if no duplicate data conflicts exist in production):
-- 1. Ensure only one active license per tenant:
-- CREATE UNIQUE INDEX IF NOT EXISTS licenses_tenant_active_unique_idx ON licenses(tenant_id) WHERE status = 'active';
-- 2. Ensure only one active/pending license per customer email:
-- CREATE UNIQUE INDEX IF NOT EXISTS licenses_email_usable_unique_idx ON licenses(lower(issued_to_email)) WHERE status IN ('active', 'pending');
