-- Create 4-digit sequence for demo requests starting at 1000
CREATE SEQUENCE IF NOT EXISTS demo_request_ref_seq START WITH 1000;

-- Add short_reference column to demo_requests
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS short_reference int UNIQUE;

-- Backfill existing demo requests with sequential references
UPDATE demo_requests
SET short_reference = nextval('demo_request_ref_seq')
WHERE short_reference IS NULL;

-- Set default nextval for future tickets to ensure auto-generation
ALTER TABLE demo_requests ALTER COLUMN short_reference SET DEFAULT nextval('demo_request_ref_seq');
