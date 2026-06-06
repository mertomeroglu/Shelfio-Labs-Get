import { query, type DbClient } from "../db/client.js";

export type CreateAuditLogInput = {
  action: string;
  actorUserId?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
  resourceId?: string | null;
  resourceType: string;
  tenantId?: string | null;
  userAgent?: string | null;
};

export async function createAuditLog(id: string, input: CreateAuditLogInput, client: DbClient = { query }) {
  const result = await client.query(
    `INSERT INTO audit_logs (
       id, actor_user_id, tenant_id, action, resource_type, resource_id, ip, user_agent, metadata
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::inet, $8, $9::jsonb)
     RETURNING *`,
    [
      id,
      input.actorUserId ?? null,
      input.tenantId ?? null,
      input.action,
      input.resourceType,
      input.resourceId ?? null,
      input.ip ?? null,
      input.userAgent ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  return result.rows[0];
}
