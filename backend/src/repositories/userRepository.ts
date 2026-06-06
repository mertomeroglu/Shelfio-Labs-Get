import { query, type DbClient } from "../db/client.js";
import { hashPassword, normalizeEmail } from "../services/securityService.js";

export type UserRole = "customer" | "admin" | "support";

export type CreateUserInput = {
  email: string;
  fullName: string;
  password: string;
  phone?: string | null;
  role: UserRole;
  tenantId?: string | null;
};

export async function findUserByEmail(email: string, client: DbClient = { query }) {
  const result = await client.query(
    "SELECT * FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL LIMIT 1",
    [normalizeEmail(email)],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string, client: DbClient = { query }) {
  const result = await client.query("SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1", [id]);
  return result.rows[0] ?? null;
}

export async function createUser(id: string, input: CreateUserInput, client: DbClient = { query }) {
  const result = await client.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, full_name, phone, role, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
     RETURNING *`,
    [
      id,
      input.tenantId ?? null,
      normalizeEmail(input.email),
      await hashPassword(input.password),
      input.fullName,
      input.phone ?? null,
      input.role,
    ],
  );
  return result.rows[0];
}
