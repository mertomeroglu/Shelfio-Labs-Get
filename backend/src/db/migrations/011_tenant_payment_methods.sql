ALTER TABLE tenants ADD COLUMN IF NOT EXISTS card_holder text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS card_number_masked text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS card_expiry text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_email text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_address text;
