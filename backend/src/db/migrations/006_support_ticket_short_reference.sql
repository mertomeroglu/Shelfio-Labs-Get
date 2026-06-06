-- Create 5-digit sequence for support tickets
CREATE SEQUENCE IF NOT EXISTS support_ticket_ref_seq START WITH 10000;

-- Add short_reference column to support_tickets
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS short_reference int UNIQUE;

-- Backfill existing support tickets with sequential references
UPDATE support_tickets
SET short_reference = nextval('support_ticket_ref_seq')
WHERE short_reference IS NULL;

-- Set default nextval for future tickets to ensure auto-generation
ALTER TABLE support_tickets ALTER COLUMN short_reference SET DEFAULT nextval('support_ticket_ref_seq');
