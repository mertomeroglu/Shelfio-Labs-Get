CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  legal_name text,
  tax_number text,
  owner_user_id uuid,
  status text NOT NULL DEFAULT 'pending',
  store_limit integer,
  user_limit integer,
  store_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS legal_name text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tax_number text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_user_id uuid;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS store_limit integer;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS user_limit integer;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS store_count integer NOT NULL DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('customer', 'admin', 'support')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'deleted')),
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT users_email_unique UNIQUE (email)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenants_owner_user_id_fkey'
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT tenants_owner_user_id_fkey
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TRY',
  billing_period text NOT NULL DEFAULT 'monthly',
  store_limit integer,
  user_limit integer,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  plan_id uuid NOT NULL REFERENCES plans(id),
  license_key_hash text NOT NULL UNIQUE,
  license_key_prefix text,
  masked_key text,
  masked_license_key text NOT NULL,
  issued_to_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked', 'used')),
  activated_at timestamptz,
  expires_at timestamptz,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id),
  license_id uuid REFERENCES licenses(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TRY',
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'paid', 'failed', 'void')),
  due_at timestamptz,
  paid_at timestamptz,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'test',
  provider_payment_id text NOT NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TRY',
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  failure_code text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_provider_payment_unique UNIQUE (provider, provider_payment_id)
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  module text NOT NULL,
  priority text NOT NULL DEFAULT 'Orta',
  status text NOT NULL DEFAULT 'Yeni',
  unread_for_customer boolean NOT NULL DEFAULT false,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('customer', 'admin', 'support')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  request_ip inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS panel_access_codes (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  purpose text NOT NULL DEFAULT 'panel_login',
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  request_ip inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS demo_requests (
  id uuid PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  business_name text NOT NULL,
  business_type text,
  store_count integer NOT NULL,
  interested_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  message text,
  status text NOT NULL DEFAULT 'Yeni',
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON users(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique_idx ON users (lower(email)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS tenants_status_idx ON tenants(status);
CREATE INDEX IF NOT EXISTS licenses_tenant_id_idx ON licenses(tenant_id);
CREATE INDEX IF NOT EXISTS licenses_status_idx ON licenses(status);
CREATE INDEX IF NOT EXISTS licenses_issued_to_email_idx ON licenses(issued_to_email);
CREATE INDEX IF NOT EXISTS subscriptions_tenant_id_idx ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS invoices_tenant_id_idx ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS payments_tenant_id_idx ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS support_tickets_tenant_id_idx ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS support_tickets_customer_user_id_idx ON support_tickets(customer_user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);
CREATE INDEX IF NOT EXISTS support_messages_ticket_id_created_at_idx ON support_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS audit_logs_tenant_created_at_idx ON audit_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS audit_logs_actor_created_at_idx ON audit_logs(actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS panel_access_codes_user_id_idx ON panel_access_codes(user_id);
CREATE INDEX IF NOT EXISTS panel_access_codes_expires_at_idx ON panel_access_codes(expires_at);
CREATE INDEX IF NOT EXISTS demo_requests_created_at_idx ON demo_requests(created_at);
