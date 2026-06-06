import { query, type DbClient } from "../db/client.js";

export type CreateTenantInput = {
  name: string;
  ownerUserId?: string | null;
  status?: string;
  storeLimit?: number | null;
  userLimit?: number | null;
};

export async function findTenantById(id: string, client: DbClient = { query }) {
  const result = await client.query("SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL LIMIT 1", [id]);
  return result.rows[0] ?? null;
}

export async function createTenant(id: string, input: CreateTenantInput, client: DbClient = { query }) {
  const result = await client.query(
    `INSERT INTO tenants (id, name, legal_name, owner_user_id, status, store_limit, user_limit)
     VALUES ($1, $2, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, input.name, input.ownerUserId ?? null, input.status ?? "active", input.storeLimit ?? null, input.userLimit ?? null],
  );
  return result.rows[0];
}

export async function updateTenantOwner(tenantId: string, ownerUserId: string, client: DbClient = { query }) {
  const result = await client.query(
    "UPDATE tenants SET owner_user_id = $2, updated_at = now() WHERE id = $1 RETURNING *",
    [tenantId, ownerUserId],
  );
  return result.rows[0] ?? null;
}
