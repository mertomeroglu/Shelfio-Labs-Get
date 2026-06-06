import { randomUUID } from "node:crypto";
import { query, transaction, type DbClient } from "../db/client.js";
import { createRawToken, encryptSecret, decryptSecret, hashToken } from "../services/securityService.js";

type DbRow = Record<string, any>;
export type DataExportStatus = "pending" | "processing" | "ready" | "failed" | "expired" | "rejected";

export type CreateDataExportInput = {
  licenseId: string;
  requestedByUserId: string;
  requestedByEmail: string;
  storeName?: string | null;
  tenantId: string;
};

export type DataExportCreateResult =
  | { ok: true; request: ReturnType<typeof toDataExport>; providerPayload: {
      externalLicenseId: string;
      externalTenantId: string;
      requestId: string;
      requestedByEmail: string;
      storeName: string;
    } }
  | { ok: false; code: string; message: string };

export type FinalizeReadyResult =
  | { ok: true; request: ReturnType<typeof toDataExport>; rawDownloadToken: string }
  | { ok: false; code: string; message: string };

function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function statusLabel(status: string) {
  if (status === "pending") return "Talep alindi";
  if (status === "processing") return "Excel hazirlaniyor";
  if (status === "ready") return "Indirme linki e-posta ile gonderildi";
  if (status === "expired") return "Suresi doldu";
  if (status === "failed") return "Hazirlanamadi";
  if (status === "rejected") return "Reddedildi";
  return status;
}

export function downloadTtlHours() {
  const value = Number(process.env.DATA_EXPORT_DOWNLOAD_TTL_HOURS || 24);
  return Number.isFinite(value) && value > 0 ? value : 24;
}

export function toDataExport(row: DbRow) {
  return {
    id: row.id,
    customerTenantId: row.customer_tenant_id,
    requestedByUserId: row.requested_by_user_id,
    licenseId: row.license_id,
    externalLicenseId: row.external_license_id,
    externalTenantId: row.external_tenant_id,
    storeName: row.store_name,
    status: row.status as DataExportStatus,
    statusLabel: statusLabel(row.status),
    providerJobId: row.provider_job_id,
    downloadExpiresAt: formatDateTime(row.download_expires_at),
    mailSentAt: formatDateTime(row.mail_sent_at),
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: formatDateTime(row.created_at),
    updatedAt: formatDateTime(row.updated_at),
    customerName: row.customer_name ?? null,
    customerEmail: row.customer_email ?? null,
    tenantName: row.tenant_name ?? null,
    maskedKey: row.masked_key || row.masked_license_key || null,
  };
}

function normalizeStoreName(value: string | null | undefined) {
  return String(value || "").trim();
}

async function findOwnedLicense(client: DbClient, tenantId: string, licenseId: string) {
  const result = await client.query<DbRow>(
    `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name
     FROM licenses l
     JOIN plans p ON p.id = l.plan_id
     WHERE l.id = $1 AND l.tenant_id = $2
     LIMIT 1`,
    [licenseId, tenantId],
  );
  return result.rows[0] ?? null;
}

function isLicenseAllowed(row: DbRow) {
  if (!["active", "pending"].includes(row.status)) return false;
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return false;
  return true;
}

export async function createDataExportRequest(input: CreateDataExportInput): Promise<DataExportCreateResult> {
  return transaction(async (client) => {
    const license = await findOwnedLicense(client, input.tenantId, input.licenseId);
    if (!license) {
      return { ok: false, code: "license_not_found", message: "Lisans bulunamadi." };
    }
    if (!isLicenseAllowed(license)) {
      return { ok: false, code: "license_not_allowed", message: "Bu lisans icin veri talebi acilamaz." };
    }

    const requestedStoreName = normalizeStoreName(input.storeName);
    const licenseStoreName = normalizeStoreName(license.store_name);
    if (licenseStoreName && requestedStoreName && licenseStoreName.toLowerCase() !== requestedStoreName.toLowerCase()) {
      return { ok: false, code: "store_mismatch", message: "Magaza bilgisi lisans ile eslesmiyor." };
    }

    const storeName = licenseStoreName || requestedStoreName || "Ana magaza";
    const duplicate = await client.query(
      `SELECT 1
       FROM data_export_requests
       WHERE customer_tenant_id = $1
         AND license_id = $2
         AND status IN ('pending', 'processing')
       LIMIT 1`,
      [input.tenantId, input.licenseId],
    );
    if (duplicate.rows.length > 0) {
      return {
        ok: false,
        code: "export_already_processing",
        message: "Bu magaza icin devam eden veri talebiniz bulunuyor.",
      };
    }

    const id = randomUUID();
    const externalTenantId = input.tenantId;
    const externalLicenseId = input.licenseId;
    const insert = await client.query<DbRow>(
      `INSERT INTO data_export_requests (
         id, customer_tenant_id, requested_by_user_id, license_id,
         external_license_id, external_tenant_id, store_name, status,
         created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', now(), now())
       RETURNING *`,
      [id, input.tenantId, input.requestedByUserId, input.licenseId, externalLicenseId, externalTenantId, storeName],
    );

    return {
      ok: true,
      providerPayload: {
        externalLicenseId,
        externalTenantId,
        requestId: id,
        requestedByEmail: input.requestedByEmail,
        storeName,
      },
      request: toDataExport(insert.rows[0]),
    };
  });
}

export async function markDataExportProcessing(requestId: string, providerJobId: string) {
  const result = await query<DbRow>(
    `UPDATE data_export_requests
     SET status = 'processing',
         provider_job_id = $2,
         error_code = null,
         error_message = null,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [requestId, providerJobId],
  );
  return result.rows[0] ? toDataExport(result.rows[0]) : null;
}

export async function markDataExportFailed(requestId: string, code: string, message: string) {
  const result = await query<DbRow>(
    `UPDATE data_export_requests
     SET status = 'failed',
         error_code = $2,
         error_message = $3,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [requestId, code, message],
  );
  return result.rows[0] ? toDataExport(result.rows[0]) : null;
}

export async function listDataExportsForTenant(tenantId: string) {
  const result = await query<DbRow>(
    `SELECT der.*, l.masked_key, l.masked_license_key, u.email AS customer_email, u.full_name AS customer_name
     FROM data_export_requests der
     JOIN users u ON u.id = der.requested_by_user_id
     LEFT JOIN licenses l ON l.id = der.license_id
     WHERE der.customer_tenant_id = $1
     ORDER BY der.created_at DESC`,
    [tenantId],
  );
  return result.rows.map(toDataExport);
}

export async function getDataExportForTenant(tenantId: string, requestId: string) {
  const result = await query<DbRow>(
    `SELECT der.*, l.masked_key, l.masked_license_key, u.email AS customer_email, u.full_name AS customer_name
     FROM data_export_requests der
     JOIN users u ON u.id = der.requested_by_user_id
     LEFT JOIN licenses l ON l.id = der.license_id
     WHERE der.customer_tenant_id = $1 AND der.id = $2
     LIMIT 1`,
    [tenantId, requestId],
  );
  return result.rows[0] ? toDataExport(result.rows[0]) : null;
}

export async function listAdminDataExports() {
  const result = await query<DbRow>(
    `SELECT der.*,
            t.name AS tenant_name,
            u.full_name AS customer_name,
            u.email AS customer_email,
            l.masked_key,
            l.masked_license_key
     FROM data_export_requests der
     JOIN tenants t ON t.id = der.customer_tenant_id
     JOIN users u ON u.id = der.requested_by_user_id
     LEFT JOIN licenses l ON l.id = der.license_id
     ORDER BY der.created_at DESC`,
  );
  return result.rows.map(toDataExport);
}

export async function getAdminDataExport(requestId: string) {
  const result = await query<DbRow>(
    `SELECT der.*,
            t.name AS tenant_name,
            u.full_name AS customer_name,
            u.email AS customer_email,
            l.masked_key,
            l.masked_license_key
     FROM data_export_requests der
     JOIN tenants t ON t.id = der.customer_tenant_id
     JOIN users u ON u.id = der.requested_by_user_id
     LEFT JOIN licenses l ON l.id = der.license_id
     WHERE der.id = $1
     LIMIT 1`,
    [requestId],
  );
  return result.rows[0] ? toDataExport(result.rows[0]) : null;
}

export async function getDataExportByProviderJob(providerJobId: string, client: DbClient = { query }) {
  const result = await client.query<DbRow>(
    `SELECT der.*, u.email AS customer_email, u.full_name AS customer_name
     FROM data_export_requests der
     JOIN users u ON u.id = der.requested_by_user_id
     WHERE der.provider_job_id = $1
     LIMIT 1`,
    [providerJobId],
  );
  return result.rows[0] ?? null;
}

export async function getDataExportById(requestId: string, client: DbClient = { query }) {
  const result = await client.query<DbRow>(
    `SELECT der.*, u.email AS customer_email, u.full_name AS customer_name
     FROM data_export_requests der
     JOIN users u ON u.id = der.requested_by_user_id
     WHERE der.id = $1
     LIMIT 1`,
    [requestId],
  );
  return result.rows[0] ?? null;
}

export async function finalizeDataExportReady(input: {
  downloadExpiresAt?: string | null;
  providerDownloadToken: string;
  providerJobId?: string | null;
  requestId?: string | null;
}): Promise<FinalizeReadyResult> {
  return transaction(async (client) => {
    const row = input.providerJobId
      ? await getDataExportByProviderJob(input.providerJobId, client)
      : input.requestId
        ? await getDataExportById(input.requestId, client)
        : null;
    if (!row) return { ok: false, code: "export_not_found", message: "Export talebi bulunamadi." };

    // Acquire lock and verify status
    const lockResult = await client.query<DbRow>(
      `SELECT status FROM data_export_requests WHERE id = $1 FOR UPDATE`,
      [row.id]
    );
    const currentStatus = lockResult.rows[0]?.status;
    if (currentStatus === "ready") {
      return { ok: false, code: "already_ready", message: "Export talebi zaten hazirlanmis." };
    }
    if (currentStatus !== "pending" && currentStatus !== "processing") {
      return { ok: false, code: "invalid_status", message: "Export talebi gecersiz durumda." };
    }

    const rawDownloadToken = createRawToken();
    const ttlHours = downloadTtlHours();
    const result = await client.query<DbRow>(
      `UPDATE data_export_requests
       SET status = 'ready',
           provider_download_token_hash = $2,
           provider_download_token_encrypted = $3,
           download_token_hash = $4,
           download_expires_at = COALESCE($5::timestamptz, now() + ($6 || ' hours')::interval),
           error_code = null,
           error_message = null,
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        row.id,
        hashToken(input.providerDownloadToken),
        encryptSecret(input.providerDownloadToken),
        hashToken(rawDownloadToken),
        input.downloadExpiresAt || null,
        ttlHours,
      ],
    );
    return { ok: true, rawDownloadToken, request: toDataExport({ ...row, ...result.rows[0] }) };
  });
}

export async function finalizeDataExportFailed(input: { code?: string | null; message?: string | null; providerJobId?: string | null; requestId?: string | null }) {
  const row = input.providerJobId
    ? await getDataExportByProviderJob(input.providerJobId)
    : input.requestId
      ? await getDataExportById(input.requestId)
      : null;
  if (!row) return null;
  return markDataExportFailed(row.id, input.code || "provider_failed", input.message || "Export hazirlanamadi.");
}

export async function markDataExportMailSent(requestId: string) {
  const result = await query<DbRow>(
    `UPDATE data_export_requests
     SET mail_sent_at = now(),
         error_code = CASE WHEN error_code = 'mail_send_failed' THEN null ELSE error_code END,
         error_message = CASE WHEN error_code = 'mail_send_failed' THEN null ELSE error_message END,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [requestId],
  );
  return result.rows[0] ? toDataExport(result.rows[0]) : null;
}

export async function markDataExportMailFailed(requestId: string) {
  await query(
    `UPDATE data_export_requests
     SET error_code = 'mail_send_failed',
         error_message = 'Mail gonderilemedi.',
         updated_at = now()
     WHERE id = $1`,
    [requestId],
  );
}

export async function consumeDataExportDownloadToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const result = await query<DbRow>(
    `SELECT *
     FROM data_export_requests
     WHERE download_token_hash = $1
       AND status = 'ready'
       AND download_expires_at > now()
     LIMIT 1`,
    [tokenHash],
  );
  const row = result.rows[0];
  if (!row) return null;
  const providerToken = decryptSecret(row.provider_download_token_encrypted);
  if (!providerToken) return { providerToken: null, request: toDataExport(row) };
  return { providerToken, request: toDataExport(row) };
}

export async function reissueDataExportDownloadToken(requestId: string): Promise<FinalizeReadyResult> {
  return transaction(async (client) => {
    const row = await getDataExportById(requestId, client);
    if (!row) return { ok: false, code: "export_not_found", message: "Export talebi bulunamadi." };
    if (row.status !== "ready") {
      return { ok: false, code: "export_not_ready", message: "Export henuz hazir degil." };
    }

    const providerToken = decryptSecret(row.provider_download_token_encrypted);
    if (!providerToken || providerToken === "download") {
      return { ok: false, code: "provider_token_missing", message: "Provider indirme tokeni bulunamadi." };
    }

    const rawDownloadToken = createRawToken();
    const ttlHours = downloadTtlHours();
    const result = await client.query<DbRow>(
      `UPDATE data_export_requests
       SET download_token_hash = $2,
           download_expires_at = now() + ($3 || ' hours')::interval,
           error_code = null,
           error_message = null,
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [requestId, hashToken(rawDownloadToken), ttlHours],
    );
    return { ok: true, rawDownloadToken, request: toDataExport({ ...row, ...result.rows[0] }) };
  });
}

export async function expireOldDataExports() {
  await query(
    `UPDATE data_export_requests
     SET status = 'expired', updated_at = now()
     WHERE status = 'ready' AND download_expires_at <= now()`,
  );
}

export async function rejectDataExportRequest(requestId: string, reason?: string) {
  const result = await query<DbRow>(
    `UPDATE data_export_requests
     SET status = 'rejected',
         error_code = 'rejected',
         error_message = $2,
         updated_at = now()
     WHERE id = $1 AND status IN ('pending', 'processing')
     RETURNING id`,
    [requestId, reason || "Talep reddedildi."]
  );
  if (!result.rows[0]) return null;
  return getAdminDataExport(requestId);
}

export async function isProviderTokenCorrupted(requestId: string): Promise<boolean> {
  const row = await getDataExportById(requestId);
  if (!row) return false;
  const providerToken = decryptSecret(row.provider_download_token_encrypted);
  return !providerToken || providerToken === "download";
}

export async function updateProviderToken(requestId: string, providerDownloadToken: string) {
  await query(
    `UPDATE data_export_requests
     SET provider_download_token_hash = $2,
         provider_download_token_encrypted = $3,
         updated_at = now()
     WHERE id = $1`,
    [
      requestId,
      hashToken(providerDownloadToken),
      encryptSecret(providerDownloadToken),
    ],
  );
}
