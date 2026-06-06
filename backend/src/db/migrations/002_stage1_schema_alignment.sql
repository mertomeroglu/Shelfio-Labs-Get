ALTER TABLE licenses ADD COLUMN IF NOT EXISTS masked_key text;

UPDATE licenses
SET masked_key = masked_license_key
WHERE masked_key IS NULL AND masked_license_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique_idx ON users (lower(email)) WHERE deleted_at IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;

  ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('customer', 'admin', 'support'));
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_messages_author_role_check'
  ) THEN
    ALTER TABLE support_messages DROP CONSTRAINT support_messages_author_role_check;
  END IF;

  ALTER TABLE support_messages
    ADD CONSTRAINT support_messages_author_role_check
    CHECK (author_role IN ('customer', 'admin', 'support'));
END $$;
