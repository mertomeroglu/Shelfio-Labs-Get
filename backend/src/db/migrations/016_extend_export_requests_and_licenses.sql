-- Add parent_license_id to licenses
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS parent_license_id uuid REFERENCES licenses(id) ON DELETE SET NULL;

-- Create index for parent_license_id
CREATE INDEX IF NOT EXISTS licenses_parent_license_id_idx ON licenses(parent_license_id);

-- Alter data_export_requests status check constraint to include 'rejected'
ALTER TABLE data_export_requests DROP CONSTRAINT IF EXISTS data_export_requests_status_check;
ALTER TABLE data_export_requests ADD CONSTRAINT data_export_requests_status_check CHECK (status IN ('pending', 'processing', 'ready', 'failed', 'expired', 'rejected'));
