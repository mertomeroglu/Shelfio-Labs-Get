import { query, type DbClient } from "../db/client.js";

export type CreateSubscriptionInput = {
  licenseId?: string | null;
  planId: string;
  status?: string;
  tenantId: string;
};

export async function listSubscriptionsByTenant(tenantId: string, client: DbClient = { query }) {
  const result = await client.query("SELECT * FROM subscriptions WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId]);
  return result.rows;
}

export async function createSubscription(id: string, input: CreateSubscriptionInput, client: DbClient = { query }) {
  const result = await client.query(
    `INSERT INTO subscriptions (id, tenant_id, plan_id, license_id, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, input.tenantId, input.planId, input.licenseId ?? null, input.status ?? "active"],
  );
  return result.rows[0];
}
