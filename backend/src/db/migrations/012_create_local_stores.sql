CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  location text,
  status text NOT NULL DEFAULT 'active',
  user_count integer NOT NULL DEFAULT 0,
  enabled_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  activated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stores_tenant_id_idx ON stores(tenant_id);
