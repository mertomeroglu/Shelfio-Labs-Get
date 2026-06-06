import { query, type DbClient } from "../db/client.js";
import { hashLicenseKey, maskLicenseKey, normalizeLicenseKey } from "../services/securityService.js";

export type CreateLicenseInput = {
  createdByUserId?: string | null;
  issuedToEmail?: string | null;
  licenseKey: string;
  planId: string;
  status?: string;
  tenantId?: string | null;
};

export async function findLicenseByKey(licenseKey: string, client: DbClient = { query }) {
  const result = await client.query("SELECT * FROM licenses WHERE license_key_hash = $1 LIMIT 1", [hashLicenseKey(licenseKey)]);
  return result.rows[0] ?? null;
}

export async function listLicensesByTenant(tenantId: string, client: DbClient = { query }) {
  const result = await client.query("SELECT * FROM licenses WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId]);
  return result.rows;
}

export async function createLicense(id: string, input: CreateLicenseInput, client: DbClient = { query }) {
  const normalizedKey = normalizeLicenseKey(input.licenseKey);
  const maskedKey = maskLicenseKey(normalizedKey);
  const result = await client.query(
    `INSERT INTO licenses (
       id, tenant_id, plan_id, license_key_hash, license_key_prefix, masked_key,
       masked_license_key, issued_to_email, status, created_by_user_id
     )
     VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      input.tenantId ?? null,
      input.planId,
      hashLicenseKey(normalizedKey),
      normalizedKey.slice(0, 7),
      maskedKey,
      input.issuedToEmail ?? null,
      input.status ?? "pending",
      input.createdByUserId ?? null,
    ],
  );
  return result.rows[0];
}
