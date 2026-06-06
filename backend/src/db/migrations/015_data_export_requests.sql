CREATE TABLE IF NOT EXISTS data_export_requests (
  id uuid PRIMARY KEY,
  customer_tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_id uuid REFERENCES licenses(id) ON DELETE SET NULL,
  external_license_id text,
  external_tenant_id text,
  store_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed', 'expired')),
  provider_job_id text,
  provider_download_token_hash text,
  provider_download_token_encrypted text,
  download_token_hash text,
  download_expires_at timestamptz,
  mail_sent_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS data_export_requests_tenant_created_idx
  ON data_export_requests (customer_tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS data_export_requests_user_created_idx
  ON data_export_requests (requested_by_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS data_export_requests_license_created_idx
  ON data_export_requests (license_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS data_export_requests_provider_job_unique_idx
  ON data_export_requests (provider_job_id)
  WHERE provider_job_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS data_export_requests_download_token_unique_idx
  ON data_export_requests (download_token_hash)
  WHERE download_token_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS data_export_requests_one_open_per_license_idx
  ON data_export_requests (customer_tenant_id, license_id)
  WHERE license_id IS NOT NULL AND status IN ('pending', 'processing');
