import { query, type DbClient } from "../db/client.js";

export type UpsertPlanInput = {
  billingPeriod?: string;
  currency?: string;
  modules: string[];
  name: string;
  priceCents: number;
  slug: string;
  storeLimit?: number | null;
  userLimit?: number | null;
};

export async function findPlanBySlug(slug: string, client: DbClient = { query }) {
  const result = await client.query("SELECT * FROM plans WHERE slug = $1 AND status = 'active' LIMIT 1", [slug]);
  return result.rows[0] ?? null;
}

export async function listActivePlans(client: DbClient = { query }) {
  const result = await client.query("SELECT * FROM plans WHERE status = 'active' ORDER BY price_cents ASC");
  return result.rows;
}

export async function upsertPlan(id: string, input: UpsertPlanInput, client: DbClient = { query }) {
  const result = await client.query(
    `INSERT INTO plans (id, slug, name, price_cents, currency, billing_period, store_limit, user_limit, modules)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       price_cents = EXCLUDED.price_cents,
       currency = EXCLUDED.currency,
       billing_period = EXCLUDED.billing_period,
       store_limit = EXCLUDED.store_limit,
       user_limit = EXCLUDED.user_limit,
       modules = EXCLUDED.modules,
       updated_at = now()
     RETURNING *`,
    [
      id,
      input.slug,
      input.name,
      input.priceCents,
      input.currency ?? "TRY",
      input.billingPeriod ?? "monthly",
      input.storeLimit ?? null,
      input.userLimit ?? null,
      JSON.stringify(input.modules),
    ],
  );
  return result.rows[0];
}
