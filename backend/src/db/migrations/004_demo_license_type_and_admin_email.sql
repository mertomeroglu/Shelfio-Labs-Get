ALTER TABLE licenses ADD COLUMN IF NOT EXISTS license_type text NOT NULL DEFAULT 'standard';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'licenses_license_type_check'
  ) THEN
    ALTER TABLE licenses DROP CONSTRAINT licenses_license_type_check;
  END IF;

  ALTER TABLE licenses
    ADD CONSTRAINT licenses_license_type_check
    CHECK (license_type IN ('standard', 'demo', 'enterprise'));
END $$;

CREATE INDEX IF NOT EXISTS licenses_license_type_idx ON licenses(license_type);
CREATE INDEX IF NOT EXISTS licenses_expires_at_idx ON licenses(expires_at);

INSERT INTO plans (id, slug, name, description, price_cents, currency, billing_period, store_limit, user_limit, modules, status)
VALUES (
  '00000000-0000-4000-8000-000000000004',
  'demo',
  'Demo',
  '1 haftalık Shelfio demo planı',
  0,
  'TRY',
  'trial',
  1,
  3,
  '["Stok", "POS temel", "Raporlama", "Mobil"]'::jsonb,
  'active'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  billing_period = EXCLUDED.billing_period,
  store_limit = EXCLUDED.store_limit,
  user_limit = EXCLUDED.user_limit,
  modules = EXCLUDED.modules,
  status = 'active',
  updated_at = now();

UPDATE licenses
SET
  license_type = 'demo',
  expires_at = COALESCE(expires_at, created_at + interval '7 days'),
  updated_at = now()
WHERE plan_id = (SELECT id FROM plans WHERE slug = 'demo');

UPDATE users
SET
  email = 'info+getshelfio-conflict-' || id || '@getshelfio.com',
  status = 'deleted',
  deleted_at = COALESCE(deleted_at, now()),
  updated_at = now()
WHERE lower(email) = 'info@getshelfio.com'
  AND role <> 'admin'
  AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM users old_admin
    WHERE lower(old_admin.email) = 'info@shelfio.com'
      AND old_admin.role = 'admin'
      AND old_admin.deleted_at IS NULL
  );

WITH old_admin AS (
  SELECT *
  FROM users
  WHERE lower(email) = 'info@shelfio.com'
    AND role = 'admin'
    AND deleted_at IS NULL
  ORDER BY updated_at DESC
  LIMIT 1
)
UPDATE users target
SET
  password_hash = old_admin.password_hash,
  full_name = COALESCE(NULLIF(target.full_name, ''), old_admin.full_name),
  role = 'admin',
  status = 'active',
  updated_at = now()
FROM old_admin
WHERE lower(target.email) = 'info@getshelfio.com'
  AND target.role = 'admin'
  AND target.deleted_at IS NULL;

UPDATE users
SET
  email = 'info+shelfio-old-admin-' || id || '@getshelfio.com',
  status = 'deleted',
  deleted_at = COALESCE(deleted_at, now()),
  updated_at = now()
WHERE lower(email) = 'info@shelfio.com'
  AND role = 'admin'
  AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM users u
    WHERE lower(u.email) = 'info@getshelfio.com'
      AND u.role = 'admin'
      AND u.deleted_at IS NULL
  );

UPDATE users
SET
  email = 'info@getshelfio.com',
  role = 'admin',
  status = 'active',
  updated_at = now()
WHERE lower(email) = 'info@shelfio.com'
  AND role = 'admin'
  AND deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    WHERE lower(u.email) = 'info@getshelfio.com'
      AND u.deleted_at IS NULL
  );
