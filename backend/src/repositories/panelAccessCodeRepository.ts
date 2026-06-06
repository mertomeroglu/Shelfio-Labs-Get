import { query, type DbClient } from "../db/client.js";
import { hashToken } from "../services/securityService.js";

export async function createPanelAccessCode(
  id: string,
  input: { code: string; purpose?: string; requestIp?: string | null; tenantId: string; ttlSeconds: number; userId: string },
  client: DbClient = { query },
) {
  const result = await client.query(
    `INSERT INTO panel_access_codes (id, tenant_id, user_id, code_hash, purpose, expires_at, request_ip)
     VALUES ($1, $2, $3, $4, $5, now() + ($6 || ' seconds')::interval, $7::inet)
     RETURNING *`,
    [
      id,
      input.tenantId,
      input.userId,
      hashToken(input.code),
      input.purpose ?? "panel_login",
      input.ttlSeconds,
      input.requestIp ?? null,
    ],
  );
  return result.rows[0];
}

export async function findValidPanelAccessCode(code: string, client: DbClient = { query }) {
  const result = await client.query(
    `SELECT * FROM panel_access_codes
     WHERE code_hash = $1 AND used_at IS NULL AND expires_at > now()
     LIMIT 1`,
    [hashToken(code)],
  );
  return result.rows[0] ?? null;
}
