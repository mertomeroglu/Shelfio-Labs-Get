ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method_label text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cardholder_name text;

CREATE INDEX IF NOT EXISTS payments_invoice_id_idx ON payments(invoice_id);
