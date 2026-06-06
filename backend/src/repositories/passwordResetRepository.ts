import { query, type DbClient } from "../db/client.js";
import { hashToken } from "../services/securityService.js";

export async function createPasswordResetToken(
  id: string,
  input: { requestIp?: string | null; token: string; ttlMinutes: number; userId: string },
  client: DbClient = { query },
) {
  const result = await client.query(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, request_ip)
     VALUES ($1, $2, $3, now() + ($4 || ' minutes')::interval, $5::inet)
     RETURNING *`,
    [id, input.userId, hashToken(input.token), input.ttlMinutes, input.requestIp ?? null],
  );
  return result.rows[0];
}

export async function findValidPasswordResetToken(token: string, client: DbClient = { query }) {
  const result = await client.query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
     LIMIT 1`,
    [hashToken(token)],
  );
  return result.rows[0] ?? null;
}
