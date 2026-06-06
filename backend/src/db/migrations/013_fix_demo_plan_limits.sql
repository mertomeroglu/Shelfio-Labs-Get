-- Update limits for the demo plan
UPDATE plans
SET store_limit = 1, user_limit = 5, updated_at = now()
WHERE slug = 'demo';

-- Align active and pending demo licenses' tenants with the corrected limits
UPDATE tenants
SET store_limit = 1, user_limit = 5, updated_at = now()
WHERE id IN (
  SELECT tenant_id
  FROM licenses l
  JOIN plans p ON p.id = l.plan_id
  WHERE p.slug = 'demo' AND l.status IN ('active', 'pending') AND l.tenant_id IS NOT NULL
);
