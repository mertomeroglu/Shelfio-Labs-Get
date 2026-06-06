-- Create sent_emails table for logging admin sent emails
CREATE TABLE IF NOT EXISTS sent_emails (
  id uuid PRIMARY KEY,
  recipient text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL, -- 'success', 'failed'
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

-- Index sent_at for faster retrieval sorting descending
CREATE INDEX IF NOT EXISTS sent_emails_sent_at_idx ON sent_emails(sent_at DESC);
