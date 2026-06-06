ALTER TABLE support_tickets ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE support_tickets ALTER COLUMN customer_user_id DROP NOT NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'customer_portal';

ALTER TABLE support_messages ALTER COLUMN author_user_id DROP NOT NULL;

ALTER TABLE licenses ADD COLUMN IF NOT EXISTS encrypted_license_key text;

CREATE INDEX IF NOT EXISTS support_tickets_customer_email_idx ON support_tickets (lower(customer_email));
CREATE INDEX IF NOT EXISTS support_tickets_source_idx ON support_tickets (source);
