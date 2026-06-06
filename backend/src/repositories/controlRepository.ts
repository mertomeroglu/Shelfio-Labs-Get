import { randomUUID } from "node:crypto";
import { query, transaction, type DbClient } from "../db/client.js";
import {
  createReference,
  createRawToken,
  decryptSecret,
  encryptSecret,
  hashLicenseKey,
  hashPassword,
  hashToken,
  maskLicenseKey,
  normalizeEmail,
  normalizeLicenseKey,
  verifyPassword,
} from "../services/securityService.js";
import { getLabsTenantUsage } from "../services/labsUsageService.js";

type DbRow = Record<string, any>;
type Role = "customer" | "admin";

export type PlanConfig = {
  slug: string;
  name: string;
  screenAccess: string[];
  enabledModules: string[];
};

export const planConfigs: Record<string, PlanConfig> = {
  demo: {
    slug: "demo",
    name: "Demo",
    screenAccess: [
      "Dashboard",
      "Ürünler",
      "Kategoriler",
      "Nasıl Kullanılır",
      "Personel Yönetimi",
      "Ayarlar",
      "POS / Kasa",
      "Stok İşlemleri",
      "Rol Yönetimi"
    ],
    enabledModules: ["dashboard", "products", "pos", "stock", "settings", "users", "permissions"]
  },
  baslangic: {
    slug: "baslangic",
    name: "Başlangıç",
    screenAccess: [
      "Dashboard",
      "Ürünler",
      "Kategoriler",
      "Nasıl Kullanılır",
      "Personel Yönetimi",
      "Ayarlar",
      "POS / Kasa",
      "Stok İşlemleri",
      "Rol Yönetimi",
      "Eşleşmeler",
      "Tedarikçiler",
      "Bildirimler"
    ],
    enabledModules: ["dashboard", "products", "pos", "stock", "settings", "users", "permissions", "suppliers", "notifications"]
  },
  profesyonel: {
    slug: "profesyonel",
    name: "Profesyonel",
    screenAccess: [
      "Dashboard",
      "Ürünler",
      "Kategoriler",
      "Nasıl Kullanılır",
      "Personel Yönetimi",
      "Ayarlar",
      "POS / Kasa",
      "Stok İşlemleri",
      "Rol Yönetimi",
      "Eşleşmeler",
      "Tedarikçiler",
      "Bildirimler",
      "Lokasyon Yönetimi",
      "SKT Takibi",
      "Depo Transfer Talepleri",
      "Görev Planlama",
      "Raporlar",
      "Sipariş Önerileri",
      "Sipariş Takibi",
      "Sipariş Oluştur",
      "Tedarikçi Ürünleri"
    ],
    enabledModules: [
      "dashboard", "products", "pos", "stock", "settings", "users", "permissions", "suppliers", "notifications",
      "warehouse", "stock_batches", "stock_movements", "tasks", "reports", "procurement", "purchase_orders"
    ]
  },
  kurumsal: {
    slug: "kurumsal",
    name: "Kurumsal",
    screenAccess: [
      "Dashboard",
      "Ürünler",
      "Kategoriler",
      "Nasıl Kullanılır",
      "Personel Yönetimi",
      "Ayarlar",
      "POS / Kasa",
      "Stok İşlemleri",
      "Rol Yönetimi",
      "Eşleşmeler",
      "Tedarikçiler",
      "Bildirimler",
      "Lokasyon Yönetimi",
      "SKT Takibi",
      "Depo Transfer Talepleri",
      "Görev Planlama",
      "Raporlar",
      "Sipariş Önerileri",
      "Sipariş Takibi",
      "Sipariş Oluştur",
      "Tedarikçi Ürünleri",
      "Taleplerim",
      "Erişim Talepleri",
      "Fiyat & Talep Analizi",
      "Kampanya Yönetimi",
      "Proximity Yönetimi",
      "Etiket Yönetimi",
      "Müşteri Yönetimi",
      "Müşteri Mobil",
      "Personel Mobil"
    ],
    enabledModules: [
      "dashboard", "products", "pos", "stock", "settings", "users", "permissions", "suppliers", "notifications",
      "warehouse", "stock_batches", "stock_movements", "tasks", "reports", "procurement", "purchase_orders",
      "campaigns", "proximity", "esl", "customers", "customer_mobile", "personnel_mobile"
    ]
  }
};

const allModules = planConfigs.kurumsal.enabledModules;
const supportStatuses = ["Yeni", "Yanıt bekliyor", "Yanıtlandı", "Çözüldü"] as const;

export function getPlanModules(planSlug: string): string[] {
  const normalized = planSlug === "professional" ? "profesyonel" : (planSlug === "starter" ? "baslangic" : (planSlug === "enterprise" ? "kurumsal" : planSlug));
  return planConfigs[normalized]?.enabledModules ?? planConfigs.profesyonel.enabledModules;
}

export function getPlanScreens(planSlug: string): string[] {
  const normalized = planSlug === "professional" ? "profesyonel" : (planSlug === "starter" ? "baslangic" : (planSlug === "enterprise" ? "kurumsal" : planSlug));
  return planConfigs[normalized]?.screenAccess ?? planConfigs.profesyonel.screenAccess;
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function modules(row: DbRow) {
  return getPlanModules(row.plan_slug || row.slug || "");
}

function maskedKey(row: DbRow) {
  return row.masked_key || row.masked_license_key;
}

function isActiveLicense(row?: DbRow | null) {
  return row?.status === "active" && (!row.expires_at || new Date(row.expires_at).getTime() > Date.now());
}

function effectiveLicenseStatus(row?: DbRow | null) {
  if (!row) return "inactive";
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return "expired";
  return row.status;
}

function remainingDays(value: string | Date | null | undefined) {
  if (!value) return null;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

function planLimit(value: unknown) {
  return typeof value === "number" ? value : "Özel kapsam";
}

export function getPlanLimit(planSlug: string | undefined, limitValue: number | null | undefined, type: "store" | "user"): number | string {
  const slug = planSlug?.toLowerCase() || "";
  if (slug === "demo") {
    return type === "store" ? 1 : 5;
  }
  if (limitValue !== null && limitValue !== undefined && limitValue !== 999) {
    return limitValue;
  }
  if (slug === "baslangic" || slug === "başlangıç") {
    return type === "store" ? 1 : 5;
  }
  if (slug === "profesyonel") {
    return type === "store" ? 3 : 25;
  }
  if (slug === "kurumsal") {
    return "Sınırsız";
  }
  return "Tanımlı değil";
}

export function calculateExpiresAt(validity: string | undefined): Date | null {
  if (!validity) return null;
  const val = validity.toLowerCase().trim();
  if (val.includes("süresiz") || val === "unlimited" || val === "indefinite") {
    return null;
  }
  const match = val.match(/^(\d+)\s*(gün|ay|yıl)?$/);
  if (!match) return null;
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const now = new Date();
  if (unit === "gün") {
    now.setDate(now.getDate() + amount);
  } else if (unit === "ay") {
    now.setMonth(now.getMonth() + amount);
  } else if (unit === "yıl") {
    now.setFullYear(now.getFullYear() + amount);
  } else {
    now.setMonth(now.getMonth() + amount);
  }
  return now;
}

function mainAppUrl() {
  return process.env.MAIN_APP_URL || "https://shelfiolabs.com/";
}

function appendPath(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function ensureCorePlans(client: DbClient = { query }) {
  const plans = [
    ["demo", "Demo", 0, 1, 5],
    ["baslangic", "Başlangıç", 100, 1, 5],
    ["profesyonel", "Profesyonel", 200, 3, 25],
    ["kurumsal", "Kurumsal", 300, 999, 999],
  ] as const;

  for (const [slug, name, price, storeLimit, userLimit] of plans) {
    const planModules = getPlanModules(slug);
    await client.query(
      `INSERT INTO plans (id, slug, name, description, price_cents, billing_period, store_limit, user_limit, modules, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, 'active')
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         price_cents = EXCLUDED.price_cents,
         billing_period = EXCLUDED.billing_period,
         store_limit = EXCLUDED.store_limit,
         user_limit = EXCLUDED.user_limit,
         modules = EXCLUDED.modules,
         status = 'active',
         updated_at = now()`,
      [randomUUID(), slug, name, slug === "demo" ? "1 haftalık Shelfio demo planı" : `${name} planı`, price, slug === "demo" ? "trial" : "monthly", storeLimit, userLimit, JSON.stringify(planModules)],
    );
  }
}

export async function seedDefaults() {
  const adminEmail = normalizeEmail(process.env.SEED_ADMIN_EMAIL || "info@getshelfio.com");
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "1234";
  const customerEmail = normalizeEmail(process.env.SEED_CUSTOMER_EMAIL || "customer@example.com");
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || "1234";
  const licenseKey = normalizeLicenseKey(process.env.SEED_CUSTOMER_LICENSE_KEY || "SHELFIO-MAIN-2026");

  await transaction(async (client) => {
    await ensureCorePlans(client);
    const plan = await getPlanBySlug("kurumsal", client);
    if (!plan) throw new Error("Seed plan could not be created");

    const tenantId = randomUUID();
    const customerId = randomUUID();
    const adminId = randomUUID();

    await client.query(
      `INSERT INTO tenants (id, name, legal_name, status, store_limit, user_limit, store_count)
       VALUES ($1, $2, $2, 'active', 999, 999, 1)
       ON CONFLICT (id) DO NOTHING`,
      [tenantId, "Shelfio Ana Müşteri"],
    );

    await client.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, status)
       VALUES ($1, $2, $3, $4, 'Örnek Müşteri', 'customer', 'active')
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         tenant_id = COALESCE(users.tenant_id, EXCLUDED.tenant_id),
         status = 'active',
         updated_at = now()`,
      [customerId, tenantId, customerEmail, await hashPassword(customerPassword)],
    );

    const customer = await findUserByEmail(customerEmail, client);
    await client.query("UPDATE tenants SET owner_user_id = $1 WHERE id = $2", [customer?.id || customerId, tenantId]);

    const licenseHash = hashLicenseKey(licenseKey);
    await client.query(
      `INSERT INTO licenses (id, tenant_id, plan_id, license_key_hash, license_key_prefix, masked_key, masked_license_key, issued_to_email, status, activated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, 'active', now())
       ON CONFLICT (license_key_hash) DO UPDATE SET
         tenant_id = EXCLUDED.tenant_id,
         plan_id = EXCLUDED.plan_id,
         status = 'active',
         masked_key = EXCLUDED.masked_key,
         masked_license_key = EXCLUDED.masked_license_key,
         updated_at = now()`,
      [randomUUID(), tenantId, plan.id, licenseHash, licenseKey.slice(0, 7), maskLicenseKey(licenseKey), customerEmail],
    );

    const license = await findLicenseByHash(licenseHash, client);
    if (license) {
      await client.query(
        `INSERT INTO subscriptions (id, tenant_id, plan_id, license_id, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT DO NOTHING`,
        [randomUUID(), tenantId, plan.id, license.id],
      );
    }

    await client.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, status)
       VALUES ($1, null, $2, $3, 'Shelfio Admin', 'admin', 'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', status = 'active', updated_at = now()`,
      [adminId, adminEmail, await hashPassword(adminPassword)],
    );

    await addAudit(client, "seed.upsert", "system", null, null, { adminEmail, customerEmail });
  });
}

export async function findUserByEmail(email: string, client: DbClient = { query }) {
  const result = await client.query<DbRow>(
    `SELECT u.*, t.name AS tenant_name, t.store_count
     FROM users u
     LEFT JOIN tenants t ON t.id = u.tenant_id
     WHERE lower(u.email) = lower($1) AND u.deleted_at IS NULL`,
    [normalizeEmail(email)],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string, client: DbClient = { query }) {
  const result = await client.query<DbRow>(
    `SELECT u.*, t.name AS tenant_name, t.store_count
     FROM users u
     LEFT JOIN tenants t ON t.id = u.tenant_id
     WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [id],
  );
  return result.rows[0] ?? null;
}

export function toSessionUser(user: DbRow) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role as Role,
    tenant: {
      id: user.tenant_id || "admin_portal",
      name: user.tenant_name || "Shelfio Admin",
      storeCount: Number(user.store_count || 0),
    },
  };
}

export async function updateLastLogin(userId: string) {
  await query("UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1", [userId]);
}

export async function registerCustomer(body: { businessName?: string; email: string; fullName?: string; password: string; phone?: string }) {
  return transaction(async (client) => {
    const tenantId = randomUUID();
    const userId = randomUUID();
    await client.query(
      `INSERT INTO tenants (id, name, legal_name, status, store_limit, user_limit, store_count)
       VALUES ($1, $2, $2, 'active', 1, 5, 0)`,
      [tenantId, body.businessName?.trim() || "Yeni İşletme"],
    );
    await client.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'customer', 'active')`,
      [
        userId,
        tenantId,
        normalizeEmail(body.email),
        await hashPassword(body.password),
        body.fullName?.trim() || "Shelfio Müşterisi",
        body.phone?.trim() || null,
      ],
    );
    await client.query("UPDATE tenants SET owner_user_id = $1 WHERE id = $2", [userId, tenantId]);
    await addAudit(client, "auth.register", "user", userId, tenantId, { email: normalizeEmail(body.email) });
    return findUserById(userId, client);
  });
}

export async function createCustomerAccountByAdmin(body: {
  fullName: string;
  email: string;
  phone?: string;
  businessName: string;
  demoRequestId?: string;
  note?: string;
}) {
  return transaction(async (client) => {
    const tenantId = randomUUID();
    const userId = randomUUID();
    const tempPassword = randomUUID() + "TempPassword123!";
    const passwordHash = await hashPassword(tempPassword);

    await client.query(
      `INSERT INTO tenants (id, name, legal_name, status, store_limit, user_limit, store_count)
       VALUES ($1, $2, $2, 'active', 1, 5, 0)`,
      [tenantId, body.businessName.trim() || "Yeni İşletme"],
    );
    await client.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, full_name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'customer', 'active')`,
      [
        userId,
        tenantId,
        normalizeEmail(body.email),
        passwordHash,
        body.fullName.trim() || "Shelfio Müşterisi",
        body.phone?.trim() || null,
      ],
    );
    await client.query("UPDATE tenants SET owner_user_id = $1 WHERE id = $2", [userId, tenantId]);

    if (body.demoRequestId) {
      await client.query(
        `UPDATE demo_requests
         SET status = 'Onaylandı',
             updated_at = now()
         WHERE id = $1`,
        [body.demoRequestId]
      ).catch(() => undefined);
    }

    await addAudit(client, "admin.create_customer", "user", userId, tenantId, {
      email: normalizeEmail(body.email),
      demoRequestId: body.demoRequestId || null,
      note: body.note || null,
    });

    return findUserById(userId, client);
  });
}


export async function getPlanBySlug(slug: string, client: DbClient = { query }) {
  const result = await client.query<DbRow>("SELECT * FROM plans WHERE slug = $1 AND status = 'active'", [slug]);
  return result.rows[0] ?? null;
}

export async function findLicenseByHash(hash: string, client: DbClient = { query }) {
  const result = await client.query<DbRow>(
    `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name, p.store_limit, p.user_limit, p.modules
     FROM licenses l
     JOIN plans p ON p.id = l.plan_id
     WHERE l.license_key_hash = $1`,
    [hash],
  );
  return result.rows[0] ?? null;
}

export async function listLicensesForAccount(tenantId: string, email: string) {
  const result = await query<DbRow>(
    `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name, p.store_limit, p.user_limit, p.modules,
            rpc.id AS pending_plan_change_id, np.slug AS pending_plan_slug, np.name AS pending_plan_name, rpc.starts_at AS pending_plan_starts_at,
            parent.masked_key AS parent_masked_key, parent.store_name AS parent_store_name
     FROM licenses l
     JOIN plans p ON p.id = l.plan_id
     LEFT JOIN license_plan_changes rpc ON rpc.license_id = l.id AND rpc.status = 'pending'
     LEFT JOIN plans np ON np.id = rpc.requested_plan_id
     LEFT JOIN licenses parent ON parent.id = l.parent_license_id
     WHERE l.tenant_id = $1
        OR (l.tenant_id IS NULL AND lower(l.issued_to_email) = lower($2))
     ORDER BY l.created_at DESC`,
    [tenantId, normalizeEmail(email)],
  );
  return result.rows.map(toAccountLicense);
}

export async function listLicensesForTenant(tenantId: string) {
  const result = await query<DbRow>(
    `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name, p.store_limit, p.user_limit, p.modules,
            rpc.id AS pending_plan_change_id, np.slug AS pending_plan_slug, np.name AS pending_plan_name, rpc.starts_at AS pending_plan_starts_at,
            parent.masked_key AS parent_masked_key, parent.store_name AS parent_store_name
     FROM licenses l
     JOIN plans p ON p.id = l.plan_id
     LEFT JOIN license_plan_changes rpc ON rpc.license_id = l.id AND rpc.status = 'pending'
     LEFT JOIN plans np ON np.id = rpc.requested_plan_id
     LEFT JOIN licenses parent ON parent.id = l.parent_license_id
     WHERE l.tenant_id = $1
     ORDER BY l.created_at DESC`,
    [tenantId],
  );
  return result.rows.map(toAccountLicense);
}

export async function getActiveLicenseForTenant(tenantId: string, client: DbClient = { query }) {
  const result = await client.query<DbRow>(
    `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name, p.store_limit, p.user_limit, p.modules
     FROM licenses l
     JOIN plans p ON p.id = l.plan_id
     WHERE l.tenant_id = $1
       AND l.status = 'active'
       AND (l.expires_at IS NULL OR l.expires_at > now())
     ORDER BY l.activated_at DESC NULLS LAST, l.created_at DESC
     LIMIT 1`,
    [tenantId],
  );
  return result.rows[0] ?? null;
}

export async function getCurrentLicense(tenantId: string) {
  const result = await query<DbRow>(
    `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name, p.store_limit, p.user_limit, p.modules, l.store_name
     FROM licenses l
     JOIN plans p ON p.id = l.plan_id
     WHERE l.tenant_id = $1
     ORDER BY l.activated_at DESC NULLS LAST, l.created_at DESC
     LIMIT 1`,
    [tenantId],
  );
  const row = result.rows[0];
  if (!row) return null;
  const isDemo = row.license_type === "demo" || row.plan_slug === "demo";
  return {
    id: row.id,
    licenseId: row.id,
    maskedKey: maskedKey(row),
    status: effectiveLicenseStatus(row),
    licenseType: row.license_type,
    isDemo,
    plan: {
      id: row.plan_slug,
      slug: row.plan_slug,
      planName: row.plan_name,
      storeLimit: isDemo ? 1 : getPlanLimit(row.plan_slug, row.store_limit, "store"),
      userLimit: isDemo ? 5 : getPlanLimit(row.plan_slug, row.user_limit, "user"),
      enabledModules: modules(row),
      screenAccess: getPlanScreens(row.plan_slug || ""),
    },
    planSlug: row.plan_slug,
    planName: row.plan_name,
    storeLimit: isDemo ? 1 : getPlanLimit(row.plan_slug, row.store_limit, "store"),
    userLimit: isDemo ? 5 : getPlanLimit(row.plan_slug, row.user_limit, "user"),
    enabledModules: modules(row),
    screenAccess: getPlanScreens(row.plan_slug || ""),
    tenantId: row.tenant_id,
    activatedAt: row.activated_at ? new Date(row.activated_at).toISOString() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    remainingDays: remainingDays(row.expires_at),
    storeName: row.store_name || null,
  };
}

export async function getTenantEntitlements(tenantId: string, client: DbClient = { query }) {
  const tenantResult = await client.query<DbRow>("SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL", [tenantId]);
  const tenant = tenantResult.rows[0];
  if (!tenant) return null;

  const licenseResult = await client.query<DbRow>(
    `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name, p.store_limit, p.user_limit, p.modules, s.status AS subscription_status, l.store_name
     FROM licenses l
     JOIN plans p ON p.id = l.plan_id
     LEFT JOIN subscriptions s ON s.license_id = l.id
     WHERE l.tenant_id = $1
     ORDER BY (l.status = 'active' AND (l.expires_at IS NULL OR l.expires_at > now())) DESC, l.activated_at DESC NULLS LAST, l.created_at DESC
     LIMIT 1`,
    [tenantId],
  );
  const license = licenseResult.rows[0];
  const licenseStatus = effectiveLicenseStatus(license);
  const enabledModules = license ? modules(license) : [];
  const isDemo = license?.license_type === "demo" || license?.plan_slug === "demo";
  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantStatus: tenant.status,
    active: isActiveLicense(license),
    licenseStatus,
    status: licenseStatus,
    licenseId: license?.id ?? null,
    licenseType: license?.license_type ?? null,
    isDemo,
    maskedKey: license ? maskedKey(license) : null,
    plan: license ? {
      id: license.plan_slug,
      slug: license.plan_slug,
      name: license.plan_name,
    } : null,
    planSlug: license?.plan_slug ?? null,
    planName: license?.plan_name ?? null,
    storeLimit: isDemo ? 1 : (license ? getPlanLimit(license.plan_slug, license.store_limit, "store") : null),
    userLimit: isDemo ? 5 : (license ? getPlanLimit(license.plan_slug, license.user_limit, "user") : null),
    modules: enabledModules,
    enabledModules,
    screenAccess: getPlanScreens(license?.plan_slug || ""),
    subscriptionStatus: license?.subscription_status ?? "inactive",
    activatedAt: license?.activated_at ? new Date(license.activated_at).toISOString() : null,
    expiresAt: license?.expires_at ? new Date(license.expires_at).toISOString() : null,
    remainingDays: remainingDays(license?.expires_at),
    storeName: license?.store_name || null,
  };
}

export async function getControlUserByEmail(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const entitlements = user.tenant_id ? await getTenantEntitlements(user.tenant_id) : null;
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      status: user.status,
    },
    tenant: user.tenant_id ? {
      id: user.tenant_id,
      name: user.tenant_name,
      status: entitlements?.tenantStatus ?? "inactive",
    } : null,
    entitlements,
  };
}

export async function getLicenseStatus(input: { email?: string; tenantId?: string }) {
  const tenantId = input.tenantId || (input.email ? (await findUserByEmail(input.email))?.tenant_id : null);
  if (!tenantId) {
    return { active: false, status: "inactive", tenantId: null, licenseId: null, maskedKey: null, plan: null, planSlug: null, planName: null, licenseType: null, isDemo: false, storeLimit: null, userLimit: null, modules: [], enabledModules: [], screenAccess: [], activatedAt: null, expiresAt: null, remainingDays: null };
  }
  const entitlements = await getTenantEntitlements(tenantId);
  if (!entitlements) {
    return { active: false, status: "inactive", tenantId, licenseId: null, maskedKey: null, plan: null, planSlug: null, planName: null, licenseType: null, isDemo: false, storeLimit: null, userLimit: null, modules: [], enabledModules: [], screenAccess: [], activatedAt: null, expiresAt: null, remainingDays: null };
  }
  return {
    active: entitlements.active,
    status: entitlements.licenseStatus,
    tenantId: entitlements.tenantId,
    licenseId: entitlements.licenseId,
    maskedKey: entitlements.maskedKey,
    plan: entitlements.plan,
    planSlug: entitlements.planSlug,
    planName: entitlements.planName,
    licenseType: entitlements.licenseType,
    isDemo: entitlements.isDemo,
    storeLimit: entitlements.storeLimit,
    userLimit: entitlements.userLimit,
    modules: entitlements.modules,
    enabledModules: entitlements.enabledModules,
    screenAccess: getPlanScreens(entitlements.planSlug || ""),
    activatedAt: entitlements.activatedAt,
    expiresAt: entitlements.expiresAt,
    remainingDays: entitlements.remainingDays,
  };
}

export function toAccountLicense(row: DbRow) {
  const isDemo = row.license_type === "demo" || row.plan_slug === "demo";
  return {
    id: row.id,
    licenseId: row.id,
    maskedKey: maskedKey(row),
    licenseType: row.license_type,
    isDemo,
    planName: row.plan_name,
    planSlug: row.plan_slug,
    status: effectiveLicenseStatus(row),
    activationStatus: row.activated_at ? "Aktif" : "Aktivasyon bekliyor",
    startsAt: formatDate(row.activated_at || row.created_at),
    expiresAt: row.expires_at ? formatDate(row.expires_at) : "Süresiz",
    remainingDays: remainingDays(row.expires_at),
    storeLimit: isDemo ? 1 : getPlanLimit(row.plan_slug, row.store_limit, "store"),
    userLimit: isDemo ? 5 : getPlanLimit(row.plan_slug, row.user_limit, "user"),
    enabledModules: modules(row),
    screenAccess: getPlanScreens(row.plan_slug || ""),
    storeName: row.store_name || null,
    parentLicenseId: row.parent_license_id || null,
    parentMaskedKey: row.parent_masked_key || null,
    parentStoreName: row.parent_store_name || null,
    pendingPlanChange: row.pending_plan_change_id ? {
      id: row.pending_plan_change_id,
      newPlanName: row.pending_plan_name,
      newPlanSlug: row.pending_plan_slug,
      startsAt: formatDate(row.pending_plan_starts_at),
    } : null,
  };
}

type AccountLicenseClaimResult =
  | { ok: true; license: ReturnType<typeof toAccountLicense> }
  | { code: "invalid_license_key" | "license_not_found" | "license_inactive" | "license_email_mismatch" | "license_already_claimed" | "license_already_active" | "multiple_active_licenses_forbidden" | "store_limit_exceeded"; ok: false };

export async function claimLicenseForAccount(input: { email: string; licenseKey: string; tenantId: string }): Promise<AccountLicenseClaimResult> {
  const normalizedKey = normalizeLicenseKey(input.licenseKey);
  if (!normalizedKey) return { code: "invalid_license_key", ok: false };

  return transaction(async (client) => {
    // Check if tenant already has an active license
    const tenantActive = await getActiveLicenseForTenant(input.tenantId, client);

    const result = await client.query<DbRow>(
      `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name, p.store_limit, p.user_limit, p.modules
       FROM licenses l
       JOIN plans p ON p.id = l.plan_id
       WHERE l.license_key_hash = $1
       FOR UPDATE OF l`,
      [hashLicenseKey(normalizedKey)],
    );
    const license = result.rows[0];
    if (!license) return { code: "license_not_found", ok: false };

    if (tenantActive) {
      if (license.plan_id !== tenantActive.plan_id) {
        return { code: "multiple_active_licenses_forbidden", ok: false };
      }

      const isDemo = tenantActive.license_type === "demo" || tenantActive.plan_slug === "demo";
      const storeLimit = isDemo ? 1 : getPlanLimit(tenantActive.plan_slug, tenantActive.store_limit, "store");

      const usedResult = await client.query(
        `SELECT COUNT(*)::int AS count FROM licenses WHERE tenant_id = $1 AND status IN ('active', 'pending')`,
        [input.tenantId]
      );
      const usedLicensesCount = usedResult.rows[0]?.count ?? 0;

      if (typeof storeLimit === "number" && usedLicensesCount >= storeLimit) {
        return { code: "store_limit_exceeded", ok: false };
      }
    }

    if (!["pending", "active"].includes(license.status) || effectiveLicenseStatus(license) === "expired") {
      return { code: "license_inactive", ok: false };
    }
    if (license.tenant_id && license.tenant_id !== input.tenantId) {
      return { code: "license_already_claimed", ok: false };
    }
    if (license.issued_to_email && normalizeEmail(license.issued_to_email) !== normalizeEmail(input.email)) {
      return { code: "license_email_mismatch", ok: false };
    }
    if (license.tenant_id === input.tenantId && license.status === "active") {
      return { code: "license_already_active", ok: false };
    }

    const isDemo = license.license_type === "demo" || license.plan_slug === "demo";
    await client.query(
      `UPDATE licenses
       SET tenant_id = $2,
           issued_to_email = COALESCE(issued_to_email, $3),
           status = 'active',
           activated_at = COALESCE(activated_at, now()),
           expires_at = CASE WHEN $4 THEN COALESCE(expires_at, now() + interval '7 days') ELSE expires_at END,
           updated_at = now()
       WHERE id = $1`,
      [license.id, input.tenantId, normalizeEmail(input.email), isDemo],
    );
    await client.query(
      `INSERT INTO subscriptions (id, tenant_id, plan_id, license_id, status, current_period_end)
       SELECT $1, $2, $3, $4, CASE WHEN $5 THEN 'trialing' ELSE 'active' END, l.expires_at
       FROM licenses l
       WHERE l.id = $4
         AND NOT EXISTS (SELECT 1 FROM subscriptions WHERE license_id = $4)`,
      [randomUUID(), input.tenantId, license.plan_id, license.id, isDemo],
    );
    await client.query(
      `UPDATE subscriptions
       SET tenant_id = $2,
           plan_id = $3,
           status = CASE WHEN $4 THEN 'trialing' ELSE 'active' END,
           current_period_end = (SELECT expires_at FROM licenses WHERE id = $1),
           updated_at = now()
       WHERE license_id = $1`,
      [license.id, input.tenantId, license.plan_id, isDemo],
    );
    await addAudit(client, "license.account_claim", "license", license.id, input.tenantId, { email: normalizeEmail(input.email) });

    const claimed = await findLicenseByHash(hashLicenseKey(normalizedKey), client);
    if (!claimed) throw new Error("claimed_license_not_found");
    return { ok: true, license: toAccountLicense(claimed) };
  });
}

export async function getAccountOverview(tenantId: string) {
  const licenses = await listLicensesForTenant(tenantId);
  const billing = await getBillingSummary(tenantId);
  const tickets = await query<DbRow>("SELECT count(*)::int AS count FROM support_tickets WHERE tenant_id = $1 AND status <> 'Çözüldü'", [tenantId]);
  const license = licenses.find((item) => item.status === "active") ?? licenses[0];
  const hasActiveLicense = license?.status === "active";
  const usage = hasActiveLicense ? await getLabsTenantUsage(tenantId) : null;
  const usageAvailable = usage?.status === "available";
  const currentStoreCount = usage?.currentStoreCount ?? null;
  const currentUserCount = usage?.currentUserCount ?? null;

  const storeLimit = hasActiveLicense ? license.storeLimit : null;
  const userLimit = hasActiveLicense ? license.userLimit : null;

  return {
    hasActiveLicense,
    planName: hasActiveLicense ? license.planName : "Aktif plan yok",
    licenseStatus: license?.status ?? "pending",
    pendingPlanChange: license?.pendingPlanChange ?? null,
    storeLimit,
    userLimit,
    currentStoreCount,
    currentUserCount,
    activeStoreCount: usageAvailable ? (usage?.activeStoreCount ?? currentStoreCount) : null,
    activeUserCount: usageAvailable ? (usage?.activeUserCount ?? currentUserCount) : null,
    usageStatus: hasActiveLicense ? (usageAvailable ? "available" : "unavailable") : "unavailable",
    usageLastSyncedAt: usageAvailable ? (usage?.lastSyncedAt ?? null) : null,
    tenantName: usageAvailable ? (usage?.tenantName ?? null) : null,
    adminEmail: usageAvailable ? (usage?.adminEmail ?? null) : null,
    storeUsage: hasActiveLicense && usageAvailable && currentStoreCount !== null ? `${currentStoreCount} / ${storeLimit}` : hasActiveLicense && !usageAvailable ? "Ana sistem kullanım bilgisi alınamadı." : "Henüz mağaza yok",
    userUsage: hasActiveLicense && usageAvailable && currentUserCount !== null ? `${currentUserCount} / ${userLimit}` : hasActiveLicense && !usageAvailable ? "Ana sistem kullanım bilgisi alınamadı." : "Aktif lisans gerekli",
    latestInvoiceStatus: billing.invoiceStatus,
    openSupportCount: tickets.rows[0]?.count ?? 0,
  };
}
export async function getBillingSummary(tenantId: string) {
  const result = await query<DbRow>(
    `SELECT i.*, p.name AS plan_name, pay.payment_method_label
     FROM invoices i
     LEFT JOIN subscriptions s ON s.id = i.subscription_id
     LEFT JOIN plans p ON p.id = s.plan_id
     LEFT JOIN LATERAL (
       SELECT payment_method_label
       FROM payments
       WHERE invoice_id = i.id AND status = 'succeeded'
       ORDER BY paid_at DESC NULLS LAST, created_at DESC
       LIMIT 1
     ) pay ON true
     WHERE i.tenant_id = $1
     ORDER BY i.issued_at DESC
     LIMIT 1`,
    [tenantId],
  );
  const row = result.rows[0];
  const activeLicense = await getActiveLicenseForTenant(tenantId);

  // Fetch tenant card details
  const tenantResult = await query<DbRow>(
    `SELECT card_holder, card_number_masked, card_expiry FROM tenants WHERE id = $1`,
    [tenantId]
  );
  const tenantCard = tenantResult.rows[0];
  const paymentMethodLabel = tenantCard?.card_number_masked
    ? `${tenantCard.card_number_masked}`
    : (row?.paid_at ? row.payment_method_label ?? "Kayıtlı ödeme yöntemi yok" : "Kayıtlı değil");

  return {
    planName: activeLicense?.plan_name ?? "Henüz plan bulunmuyor.",
    invoiceStatus: row ? (row.status === "paid" ? "paid" : "pending") : null,
    latestPaymentAt: row?.paid_at ? formatDate(row.paid_at) : null,
    paymentMethodLabel,
  };
}
export async function listInvoices(tenantId: string) {
  const result = await query<DbRow>("SELECT * FROM invoices WHERE tenant_id = $1 ORDER BY issued_at DESC", [tenantId]);
  return result.rows.map((row) => ({
    id: row.invoice_number,
    date: formatDate(row.issued_at),
    description: "Shelfio plan hizmet bedeli",
    amountLabel: `${Number(row.amount_cents) / 100} ${row.currency}`,
    status: row.status === "paid" ? "paid" : "pending",
  }));
}

export async function listStores(tenantId: string) {
  const result = await query<DbRow>(
    `SELECT t.id, t.name, t.status, t.created_at, p.modules
     FROM tenants t
     LEFT JOIN LATERAL (
       SELECT p.modules
       FROM licenses l
       JOIN plans p ON p.id = l.plan_id
       WHERE l.tenant_id = t.id AND l.status = 'active' AND (l.expires_at IS NULL OR l.expires_at > now())
       ORDER BY l.activated_at DESC NULLS LAST, l.created_at DESC
       LIMIT 1
     ) p ON true
     WHERE t.id = $1 AND t.deleted_at IS NULL
     GROUP BY t.id, p.modules`,
    [tenantId],
  );
  const tenant = result.rows[0];
  if (!tenant) {
    return {
      usageStatus: "unavailable",
      currentStoreCount: null,
      currentUserCount: null,
      activeStoreCount: null,
      activeUserCount: null,
      usageLastSyncedAt: null,
      summaryText: "Mağaza bilgisi ana sistemden alınamadı.",
      stores: [],
    };
  }
  const usage = await getLabsTenantUsage(tenantId);
  const usageAvailable = usage.status === "available";
  const modulesList = modules({ modules: tenant.modules ?? [] });

  const licenses = await listLicensesForTenant(tenantId);
  const activeLicense = licenses.find((l) => l.status === "active") ?? licenses[0];
  const storeLimit = activeLicense ? activeLicense.storeLimit : 0;
  const userLimit = activeLicense ? activeLicense.userLimit : 0;

  let stores: any[] = [];
  let currentStoreCount = null;
  let usageStatus = usage.status;

  if (usageAvailable) {
    stores = usage.stores.map((store) => ({
      id: store.id,
      businessName: store.businessName || usage.tenantName || tenant.name,
      storeName: store.storeName,
      location: store.location || "-",
      status: store.status === "active" ? "active" : "pending",
      userCount: store.userCount ?? null,
      enabledModules: store.enabledModules?.length ? store.enabledModules : modulesList,
      activatedAt: store.activatedAt ? formatDate(store.activatedAt) : formatDate(tenant.created_at),
    }));
    currentStoreCount = usage.currentStoreCount ?? stores.length;
  }

  const currentUserCount = usageAvailable ? usage.currentUserCount : null;

  return {
    usageStatus,
    currentStoreCount,
    currentUserCount,
    activeStoreCount: usageAvailable ? usage.activeStoreCount : null,
    activeUserCount: usageAvailable ? usage.activeUserCount : null,
    usageLastSyncedAt: usageAvailable ? usage.lastSyncedAt : null,
    summaryText: usageAvailable
      ? (stores.length
        ? null
        : currentStoreCount !== null
          ? `Ana sistemde ${currentStoreCount} aktif mağaza bulunuyor.`
          : "Ana sistem mağaza özeti alındı, mağaza listesi dönmedi.")
      : "Ana sistem kullanım bilgisi alınamadı.",
    stores,
    storeLimit,
    userLimit,
  };
}

export async function createStore(tenantId: string, userId: string, storeName: string, location: string) {
  throw new Error("getshelfio_does_not_create_local_stores");
}
export async function completeCheckout(
  sessionUser: { email: string; id: string; tenant: { id: string } },
  planSlug: string,
  checkoutReference?: string,
  paymentMethodLabel?: string,
  cardholderName?: string,
) {
  return transaction(async (client) => {
    const activeLicense = await getActiveLicenseForTenant(sessionUser.tenant.id, client);
    if (activeLicense) {
      throw new Error("Bu müşterinin aktif bir lisansı bulunuyor. Yeni lisans oluşturmak için mevcut lisansı iptal edin.");
    }

    const plan = await getPlanBySlug(planSlug, client);
    if (!plan) throw new Error("invalid_plan");
    const providerPaymentId = normalizeCheckoutReference(sessionUser.id, planSlug, checkoutReference);
    const existingPayment = await client.query<DbRow>(
      `SELECT pay.*, i.invoice_number, l.*, p.name AS plan_name, p.store_limit, p.user_limit, p.modules, p.currency, p.price_cents
       FROM payments pay
       JOIN invoices i ON i.id = pay.invoice_id
       LEFT JOIN subscriptions s ON s.id = i.subscription_id
       LEFT JOIN licenses l ON l.id = s.license_id
       LEFT JOIN plans p ON p.id = s.plan_id
       WHERE pay.provider = 'test' AND pay.provider_payment_id = $1 AND pay.tenant_id = $2
       LIMIT 1`,
      [providerPaymentId, sessionUser.tenant.id],
    );
    if (existingPayment.rows[0]) {
      const row = existingPayment.rows[0];
      return {
        invoice: { id: row.invoice_number },
        license: row.id ? toAccountLicense(row) : null,
        notification: null,
        plan: { planName: row.plan_name, priceLabel: `${Number(row.price_cents) / 100} ${row.currency} / ay` },
        redirectUrl: `/odeme/tamamlandi?plan=${plan.slug}`,
      };
    }
    const licenseKey = `SHLF-${randomUUID().slice(0, 8).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const licenseId = randomUUID();
    await client.query(
      `INSERT INTO licenses (id, tenant_id, plan_id, license_key_hash, license_key_prefix, masked_key, masked_license_key, encrypted_license_key, issued_to_email, status, activated_at, created_by_user_id)
       SELECT $1, $2, $3, $4, $5, $6, $6, $7, u.email, 'active', now(), $8
       FROM users u WHERE u.id = $8`,
      [licenseId, sessionUser.tenant.id, plan.id, hashLicenseKey(licenseKey), licenseKey.slice(0, 7), maskLicenseKey(licenseKey), encryptSecret(licenseKey), sessionUser.id],
    );
    const subscriptionId = randomUUID();
    await client.query(
      "INSERT INTO subscriptions (id, tenant_id, plan_id, license_id, status) VALUES ($1, $2, $3, $4, 'active')",
      [subscriptionId, sessionUser.tenant.id, plan.id, licenseId],
    );
    const invoiceId = randomUUID();
    const invoiceNumber = `INV-${Date.now()}`;
    await client.query(
      `INSERT INTO invoices (id, tenant_id, subscription_id, invoice_number, amount_cents, currency, status, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'paid', now())`,
      [invoiceId, sessionUser.tenant.id, subscriptionId, invoiceNumber, plan.price_cents, plan.currency],
    );
    await client.query(
      `INSERT INTO payments (id, tenant_id, invoice_id, provider, provider_payment_id, amount_cents, currency, status, paid_at, payment_method_label, cardholder_name)
       VALUES ($1, $2, $3, 'test', $4, $5, $6, 'succeeded', now(), $7, $8)`,
      [randomUUID(), sessionUser.tenant.id, invoiceId, providerPaymentId, plan.price_cents, plan.currency, paymentMethodLabel ?? null, cardholderName ?? null],
    );
    await addAudit(client, "checkout.complete", "license", licenseId, sessionUser.tenant.id, { plan: plan.slug });
    const license = await findLicenseByHash(hashLicenseKey(licenseKey), client);
    return {
      invoice: { id: invoiceNumber },
      license: license ? toAccountLicense(license) : null,
      notification: license ? {
        customerEmail: sessionUser.email,
        licenseKey,
        licenseType: license.license_type,
        maskedKey: maskLicenseKey(licenseKey),
        planName: plan.name,
        statusLabel: "Aktif",
      } : null,
      plan: { planName: plan.name, priceLabel: `${Number(plan.price_cents) / 100} ${plan.currency} / ay` },
      redirectUrl: `/odeme/tamamlandi?plan=${plan.slug}`,
    };
  });
}

function normalizeCheckoutReference(userId: string, planSlug: string, checkoutReference?: string) {
  const safeReference = (checkoutReference || createReference("checkout"))
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);
  return `test_${userId}_${planSlug}_${safeReference}`;
}

export async function requestPlanUpgrade(input: { userId: string; tenantId: string; planSlug: string; passwordConfirm: string }) {
  return transaction(async (client) => {
    const userResult = await client.query<DbRow>("SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL", [input.userId]);
    const user = userResult.rows[0];
    if (!user || !(await verifyPassword(input.passwordConfirm, user.password_hash))) {
      return { ok: false, code: "invalid_password", message: "Girdiğiniz şifre hatalı." };
    }

    const activeLicense = await getActiveLicenseForTenant(input.tenantId, client);
    if (!activeLicense) return { ok: false, code: "active_license_required", message: "Plan değişikliği için aktif lisans gerekir." };

    const nextPlan = await getPlanBySlug(input.planSlug, client);
    if (!nextPlan) return { ok: false, code: "invalid_plan", message: "Seçilen plan bulunamadı." };
    if (nextPlan.slug === activeLicense.plan_slug) {
      return { ok: false, code: "same_plan", message: "Mevcut planınızdan farklı bir plan seçin." };
    }
    const existingChange = await client.query<DbRow>(
      `SELECT lpc.*, p.name AS requested_plan_name, p.slug AS requested_plan_slug
       FROM license_plan_changes lpc
       JOIN plans p ON p.id = lpc.requested_plan_id
       WHERE lpc.license_id = $1 AND lpc.status = 'pending'
       LIMIT 1`,
      [activeLicense.id],
    );
    if (existingChange.rows[0]) {
      return {
        ok: true,
        change: {
          id: existingChange.rows[0].id,
          currentPlanName: activeLicense.plan_name,
          newPlanName: existingChange.rows[0].requested_plan_name,
          newPlanSlug: existingChange.rows[0].requested_plan_slug,
          startsAt: formatDate(existingChange.rows[0].starts_at),
        },
        customerEmail: user.email,
      };
    }

    const startsAt = activeLicense.expires_at
      ? new Date(activeLicense.expires_at)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const changeId = randomUUID();
    await client.query(
      `INSERT INTO license_plan_changes (id, tenant_id, license_id, current_plan_id, requested_plan_id, requested_by_user_id, starts_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [changeId, input.tenantId, activeLicense.id, activeLicense.plan_id, nextPlan.id, input.userId, startsAt],
    );
    await addAudit(client, "license.plan_change.request", "license", activeLicense.id, input.tenantId, { newPlan: nextPlan.slug });
    return {
      ok: true,
      change: {
        id: changeId,
        currentPlanName: activeLicense.plan_name,
        newPlanName: nextPlan.name,
        newPlanSlug: nextPlan.slug,
        startsAt: formatDate(startsAt),
      },
      customerEmail: user.email,
    };
  });
}

export async function cancelPlanUpgrade(input: { userId: string; tenantId: string; changeId: string }) {
  return transaction(async (client) => {
    const result = await client.query<DbRow>(
      `UPDATE license_plan_changes
       SET status = 'cancelled', cancelled_at = now(), updated_at = now()
       WHERE id = $1 AND tenant_id = $2 AND status = 'pending'
       RETURNING *`,
      [input.changeId, input.tenantId],
    );
    const row = result.rows[0];
    if (!row) return { ok: false, code: "plan_change_not_found", message: "Bekleyen plan değişikliği bulunamadı." };
    await addAudit(client, "license.plan_change.cancel", "license", row.license_id, input.tenantId, { userId: input.userId });
    return { ok: true, message: "Plan değişikliği iptal edildi." };
  });
}

export async function createSupportTicket(user: { id: string; tenant: { id: string } }, body: { subject: string; message: string; module?: string; priority?: string }) {
  return transaction(async (client) => {
    const ticketId = randomUUID();
    await client.query(
      `INSERT INTO support_tickets (id, tenant_id, customer_user_id, subject, module, priority, status, source)
       VALUES ($1, $2, $3, $4, $5, $6, 'Yeni', 'customer_portal')`,
      [ticketId, user.tenant.id, user.id, body.subject, body.module || "Diğer", body.priority || "Orta"],
    );
    await client.query(
      `INSERT INTO support_messages (id, ticket_id, author_user_id, author_role, body)
       VALUES ($1, $2, $3, 'customer', $4)`,
      [randomUUID(), ticketId, user.id, body.message],
    );
    await addAudit(client, "support.create", "support_ticket", ticketId, user.tenant.id, {});
    return ticketId;
  });
}

export async function createPublicSupportTicket(body: { customerEmail: string; customerName: string; message: string; priority?: string; subject: string }) {
  return transaction(async (client) => {
    const ticketId = randomUUID();
    await client.query(
      `INSERT INTO support_tickets (id, tenant_id, customer_user_id, customer_name, customer_email, subject, module, priority, status, source)
       VALUES ($1, null, null, $2, $3, $4, 'Genel', $5, 'Yeni', 'public')`,
      [ticketId, body.customerName, normalizeEmail(body.customerEmail), body.subject, body.priority || "Orta"],
    );
    await client.query(
      `INSERT INTO support_messages (id, ticket_id, author_user_id, author_role, body)
       VALUES ($1, $2, null, 'customer', $3)`,
      [randomUUID(), ticketId, body.message],
    );
    await addAudit(client, "support.public_create", "support_ticket", ticketId, null, { customerEmail: normalizeEmail(body.customerEmail) });
    return ticketId;
  });
}

export async function listSupportTickets(user: { id: string; role: Role; tenant: { id: string } }) {
  const params = user.role === "admin" ? [] : [user.tenant.id];
  const where = user.role === "admin" ? "" : "WHERE st.tenant_id = $1";
  const result = await query<DbRow>(
    `SELECT st.*, COALESCE(u.full_name, st.customer_name) AS customer_name, COALESCE(u.email, st.customer_email) AS customer_email
     FROM support_tickets st
     LEFT JOIN users u ON u.id = st.customer_user_id
     ${where}
     ORDER BY st.updated_at DESC`,
    params,
  );
  return result.rows.map(toSupportSummary);
}

export async function getSupportTicket(id: string, user: { id: string; role: Role; tenant?: { id: string } }, client: DbClient = { query }) {
  const params = user.role === "admin" ? [id] : [id, user.tenant?.id];
  const customerFilter = user.role === "admin" ? "" : "AND st.tenant_id = $2";
  const ticketResult = await client.query<DbRow>(
    `SELECT st.*, COALESCE(u.full_name, st.customer_name) AS customer_name, COALESCE(u.email, st.customer_email) AS customer_email
     FROM support_tickets st
     LEFT JOIN users u ON u.id = st.customer_user_id
     WHERE st.id = $1 ${customerFilter}`,
    params,
  );
  const ticket = ticketResult.rows[0];
  if (!ticket) return null;
  if (user.role === "customer") {
    await client.query("UPDATE support_tickets SET unread_for_customer = false WHERE id = $1", [id]);
  }
  const messages = await client.query<DbRow>("SELECT * FROM support_messages WHERE ticket_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC", [id]);
  return { ...toSupportSummary(ticket), messages: messages.rows.map(toSupportMessage) };
}


export async function addSupportMessage(id: string, user: { id: string; role: Role; tenant?: { id: string } }, message: string) {
  return transaction(async (client) => {
    const queryUser = user.role === "customer" && !user.id ? { id: "public_reply", role: "admin" as const } : user;
    const detail = await getSupportTicket(id, queryUser, client);
    if (!detail) return null;
    await client.query(
      "INSERT INTO support_messages (id, ticket_id, author_user_id, author_role, body) VALUES ($1, $2, $3, $4, $5)",
      [randomUUID(), id, user.id || null, user.role, message],
    );
    await client.query(
      `UPDATE support_tickets
       SET status = $2, unread_for_customer = $3, updated_at = now(), last_message_at = now()
       WHERE id = $1`,
      [id, user.role === "admin" ? "Yanıtlandı" : "Yanıt bekliyor", user.role === "admin"],
    );
    await addAudit(client, "support.message", "support_ticket", id, detail.tenantId ?? null, { role: user.role });
    return getSupportTicket(id, queryUser, client);
  });
}

export async function createPanelAccessForUser(user: { id: string; role: Role; tenant: { id: string } }, requestIp?: string | null) {
  if (user.role !== "customer") return null;
  const entitlements = await getTenantEntitlements(user.tenant.id);
  if (!entitlements?.active) return null;
  const licenseId = entitlements.licenseId;
  const ttlSeconds = Number(process.env.SSO_CODE_TTL_SECONDS || 120);
  const code = createRawToken();
  await transaction(async (client) => {
    await client.query(
      `INSERT INTO panel_access_codes (id, tenant_id, user_id, license_id, code_hash, purpose, expires_at, request_ip)
       VALUES ($1, $2, $3, $4, $5, 'panel_login', now() + ($6 || ' seconds')::interval, $7::inet)`,
      [randomUUID(), user.tenant.id, user.id, licenseId, hashToken(code), ttlSeconds, requestIp ?? null],
    );
    await addAudit(client, "sso.start", "panel_access_code", null, user.tenant.id, { userId: user.id, purpose: "panel_login" });
  });
  return {
    redirectUrl: `${appendPath(mainAppUrl(), "/sso/callback")}?code=${encodeURIComponent(code)}`,
    expiresIn: ttlSeconds,
  };
}

export async function createPanelAccessForEmail(email: string, requestIp?: string | null) {
  const user = await findUserByEmail(email);
  if (!user?.tenant_id || user.role !== "customer") return null;
  return createPanelAccessForUser({ id: user.id, role: user.role, tenant: { id: user.tenant_id } }, requestIp);
}

export async function hasUnclaimedLicense(email: string, client: DbClient = { query }) {
  const result = await client.query(
    `SELECT 1 FROM licenses WHERE tenant_id IS NULL AND lower(issued_to_email) = lower($1) AND status = 'pending'`,
    [normalizeEmail(email)]
  );
  return result.rows.length > 0;
}

export type SsoExchangeResult =
  | { success: true; data: any }
  | { success: false; code: "sso_code_invalid" | "sso_code_expired" | "sso_code_used" | "active_license_required" | "license_payload_missing" | "license_expired" | "tenant_missing" };

export async function exchangePanelAccessCode(code: string, requestIp?: string | null): Promise<SsoExchangeResult> {
  if (!code) return { success: false, code: "sso_code_invalid" };
  return transaction(async (client) => {
    const result = await client.query<DbRow>(
      `SELECT pac.*, u.email, u.full_name, u.role, u.status AS user_status, t.name AS tenant_name, t.status AS tenant_status, t.store_count
       FROM panel_access_codes pac
       LEFT JOIN users u ON u.id = pac.user_id
       LEFT JOIN tenants t ON t.id = pac.tenant_id
       WHERE pac.code_hash = $1
       FOR UPDATE OF pac`,
      [hashToken(code)],
    );
    const row = result.rows[0];
    if (!row) {
      return { success: false, code: "sso_code_invalid" };
    }
    if (row.used_at) {
      return { success: false, code: "sso_code_used" };
    }
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      console.warn(`[SSO Exchange] Code expired at ${row.expires_at}. Row ID: ${row.id}`);
      return { success: false, code: "sso_code_expired" };
    }
    if (!row.email) {
      console.warn(`[SSO Exchange] User email is missing for code ${row.id}`);
      return { success: false, code: "tenant_missing" };
    }
    if (!row.tenant_id) {
      console.warn(`[SSO Exchange] Tenant missing for user ${row.user_id}`);
      return { success: false, code: "tenant_missing" };
    }

    await client.query("UPDATE panel_access_codes SET used_at = now() WHERE id = $1", [row.id]);
    const entitlements = await getTenantEntitlements(row.tenant_id, client);
    if (!entitlements) {
      console.warn(`[SSO Exchange] Tenant entitlements could not be loaded for tenant ${row.tenant_id}`);
      return { success: false, code: "tenant_missing" };
    }

    if (!entitlements.active) {
      if (entitlements.licenseStatus === "expired") {
        console.warn(`[SSO Exchange] License expired for tenant ${row.tenant_id}`);
        return { success: false, code: "license_expired" };
      }
      console.warn(`[SSO Exchange] Active license required but none found for tenant ${row.tenant_id}`);
      return { success: false, code: "active_license_required" };
    }

    const licenseIdToFetch = row.license_id || entitlements.licenseId;
    const licenseResult = await client.query<DbRow>(
      `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name, p.store_limit, p.user_limit, p.modules, s.status AS subscription_status
       FROM licenses l
       JOIN plans p ON p.id = l.plan_id
       LEFT JOIN subscriptions s ON s.license_id = l.id
       WHERE l.id = $1`,
      [licenseIdToFetch],
    );
    const licenseRow = licenseResult.rows[0];
    if (!licenseRow) {
      console.warn(`[SSO Exchange] Saved license row not found for ID ${licenseIdToFetch}`);
      return { success: false, code: "license_payload_missing" };
    }

    const licenseModules = modules(licenseRow);
    const decryptedRawKey = decryptSecret(licenseRow.encrypted_license_key);

    const ssoPayload = {
      user: {
        id: row.user_id,
        email: row.email,
        name: row.full_name,
        role: row.role,
      },
      tenant: {
        id: row.tenant_id,
        name: row.tenant_name,
        storeCount: Number(row.store_count || 0),
      },
      license: {
        id: licenseRow.id,
        maskedKey: maskedKey(licenseRow),
        status: effectiveLicenseStatus(licenseRow),
        licenseType: licenseRow.license_type,
        planSlug: licenseRow.plan_slug,
        planName: licenseRow.plan_name,
        expiresAt: licenseRow.expires_at ? new Date(licenseRow.expires_at).toISOString() : null,
        activatedAt: licenseRow.activated_at ? new Date(licenseRow.activated_at).toISOString() : null,
        remainingDays: remainingDays(licenseRow.expires_at),
        isDemo: licenseRow.license_type === "demo" || licenseRow.plan_slug === "demo",
        storeLimit: getPlanLimit(licenseRow.plan_slug, licenseRow.store_limit, "store"),
        userLimit: getPlanLimit(licenseRow.plan_slug, licenseRow.user_limit, "user"),
        enabledModules: licenseModules,
        screenAccess: getPlanScreens(licenseRow.plan_slug || ""),
        transferKey: decryptedRawKey || null,
        licenseKeyHash: licenseRow.license_key_hash || null,
      },
      entitlements: {
        licenseId: licenseRow.id,
        planSlug: licenseRow.plan_slug,
        planName: licenseRow.plan_name,
        licenseStatus: effectiveLicenseStatus(licenseRow),
        status: effectiveLicenseStatus(licenseRow),
        licenseType: licenseRow.license_type,
        expiresAt: licenseRow.expires_at ? new Date(licenseRow.expires_at).toISOString() : null,
        remainingDays: remainingDays(licenseRow.expires_at),
        isDemo: licenseRow.license_type === "demo" || licenseRow.plan_slug === "demo",
        storeLimit: getPlanLimit(licenseRow.plan_slug, licenseRow.store_limit, "store"),
        userLimit: getPlanLimit(licenseRow.plan_slug, licenseRow.user_limit, "user"),
        enabledModules: licenseModules,
        screenAccess: getPlanScreens(licenseRow.plan_slug || ""),
        transferKey: decryptedRawKey || null,
        licenseKeyHash: licenseRow.license_key_hash || null,
      },
    };

    if (
      !ssoPayload.license.id ||
      !ssoPayload.license.status ||
      !ssoPayload.tenant.id ||
      !ssoPayload.user.email ||
      !ssoPayload.license.planSlug ||
      !ssoPayload.license.planName
    ) {
      console.warn(`[SSO Exchange] License payload missing required fields. User email: ${row.email}, Tenant ID: ${row.tenant_id}`);
      return { success: false, code: "license_payload_missing" };
    }

    await addAudit(client, "sso.exchange", "panel_access_code", row.id, row.tenant_id, {
      requestIp: requestIp ?? null,
      userId: row.user_id,
    });

    return { success: true, data: ssoPayload };
  });
}

export async function updateSupportStatus(id: string, user: { id: string; role: Role; tenant?: { id: string } }, status: string) {
  if (!supportStatuses.includes(status as (typeof supportStatuses)[number])) return null;
  const detail = await getSupportTicket(id, user);
  if (!detail) return null;
  if (user.role !== "admin" && status !== "Çözüldü") return null;
  const params = user.role === "admin" ? [id, status] : [id, status, user.tenant?.id];
  const customerFilter = user.role === "admin" ? "" : "AND tenant_id = $3";
  await transaction(async (client) => {
    await client.query(
      `UPDATE support_tickets
       SET status = $2,
           updated_at = now(),
           closed_at = CASE WHEN $2 = 'Çözüldü' THEN now() ELSE closed_at END
       WHERE id = $1 ${customerFilter}`,
      params,
    );
    await addAudit(client, "support.status_update", "support_ticket", id, detail.tenantId ?? null, { role: user.role, status });
  });
  return getSupportTicket(id, user);
}

function toSupportSummary(row: DbRow) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    subject: row.subject,
    module: row.module,
    priority: row.priority,
    source: row.source,
    status: row.status,
    updatedAt: formatDate(row.updated_at),
    unreadForCustomer: row.unread_for_customer,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    shortReference: row.short_reference,
  };
}

function toSupportMessage(row: DbRow) {
  return {
    id: row.id,
    author: row.author_role,
    body: row.body,
    createdAt: formatDateTime(row.created_at),
  };
}

export async function adminStats() {
  const [licenses, active, pending, customers, demos, support, invoices, payments] = await Promise.all([
    query<DbRow>("SELECT count(*)::int AS count FROM licenses"),
    query<DbRow>("SELECT count(*)::int AS count FROM licenses WHERE status = 'active' AND (expires_at IS NULL OR expires_at > now())"),
    query<DbRow>("SELECT count(*)::int AS count FROM licenses WHERE status = 'pending'"),
    query<DbRow>("SELECT count(*)::int AS count FROM users WHERE role = 'customer' AND deleted_at IS NULL"),
    query<DbRow>("SELECT count(*)::int AS count FROM demo_requests"),
    query<DbRow>("SELECT count(*)::int AS count FROM support_tickets WHERE status <> 'Çözüldü'"),
    query<DbRow>("SELECT count(*)::int AS count FROM invoices"),
    query<DbRow>("SELECT count(*)::int AS count FROM payments WHERE status = 'succeeded'"),
  ]);
  const recent = await query<DbRow>(
    `SELECT l.created_at, p.name, COALESCE(u.full_name, l.issued_to_email, 'Müşteri') AS customer_name
     FROM licenses l
     JOIN plans p ON p.id = l.plan_id
     LEFT JOIN users u ON u.email = l.issued_to_email
     ORDER BY l.created_at DESC LIMIT 5`,
  );
  return {
    totalLicenses: licenses.rows[0]?.count ?? 0,
    activeLicenses: active.rows[0]?.count ?? 0,
    newPurchases: payments.rows[0]?.count ?? 0,
    pendingActivations: pending.rows[0]?.count ?? 0,
    customers: customers.rows[0]?.count ?? 0,
    demoRequests: demos.rows[0]?.count ?? 0,
    invoices: invoices.rows[0]?.count ?? 0,
    supportTickets: support.rows[0]?.count ?? 0,
    recentActions: recent.rows.map((row) => `${row.name} lisansı - ${row.customer_name}`),
  };
}

export async function adminLicenses() {
  const result = await query<DbRow>(
    `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name, p.store_limit, p.user_limit, t.name AS business_name, u.full_name AS customer_name,
            parent.masked_key AS parent_masked_key, parent.store_name AS parent_store_name,
            EXISTS (
              SELECT 1 FROM store_license_requests slr
              WHERE slr.generated_license_id = l.id
            ) AS is_store_request_gen
     FROM licenses l
     JOIN plans p ON p.id = l.plan_id
     LEFT JOIN tenants t ON t.id = l.tenant_id
     LEFT JOIN users u ON u.email = l.issued_to_email
     LEFT JOIN licenses parent ON parent.id = l.parent_license_id
     ORDER BY l.created_at DESC`,
  );
  return result.rows.map((row) => {
    const decrypted = decryptSecret(row.encrypted_license_key);

    // Determine license structure
    let licenseStructure = "primary";
    if (row.parent_license_id || row.is_store_request_gen) {
      licenseStructure = "additional_store";
    }

    return {
      id: row.id,
      hasFullKey: Boolean(row.encrypted_license_key),
      legacyKeyMessage: decrypted ? null : (row.encrypted_license_key ? "Lisans anahtarı çözülemedi." : "Bu lisans eski formatta, tam anahtar saklanmamış."),
      maskedKey: maskedKey(row),
      fullKey: decrypted || row.license_key_prefix || null,
      customerName: row.customer_name || row.issued_to_email || "Yeni Müşteri",
      customerEmail: row.issued_to_email || "",
      businessName: row.business_name || "Atanmamış",
      tenantId: row.tenant_id || null,
      planName: row.plan_name,
      planSlug: row.plan_slug,
      licenseType: row.license_type,
      isDemo: row.license_type === "demo" || row.plan_slug === "demo",
      status: effectiveLicenseStatus(row),
      activatedAt: row.activated_at ? formatDate(row.activated_at) : "-",
      expiresAt: row.expires_at ? formatDate(row.expires_at) : "Süresiz",
      remainingDays: remainingDays(row.expires_at),
      storeLimit: getPlanLimit(row.plan_slug, row.store_limit, "store"),
      userLimit: getPlanLimit(row.plan_slug, row.user_limit, "user"),
      createdAt: formatDate(row.created_at),
      parentLicenseId: row.parent_license_id || null,
      parentMaskedKey: row.parent_masked_key || null,
      parentStoreName: row.parent_store_name || null,
      storeName: row.store_name || null,
      licenseStructure,
    };
  });
}
export async function createAdminLicense(actorId: string, body: { customerEmail?: string; customerName?: string; businessName?: string; licenseType?: string; planName?: string; storeLimit?: number; userLimit?: number; validity?: string }) {
  return transaction(async (client) => {
    const customerEmail = normalizeEmail(body.customerEmail ?? "");
    if (customerEmail) {
      const existingLicenses = await client.query<DbRow>(
        `SELECT * FROM licenses WHERE lower(issued_to_email) = lower($1) AND status IN ('active', 'pending')`,
        [customerEmail]
      );
      const activeLicense = existingLicenses.rows.find(l => l.status === 'active' && (!l.expires_at || new Date(l.expires_at).getTime() > Date.now()));
      if (activeLicense) {
        throw new Error("Bu müşterinin aktif bir lisansı bulunuyor. Yeni lisans oluşturmak için mevcut lisansı iptal edin.");
      }
      const pendingLicense = existingLicenses.rows.find(l => l.status === 'pending');
      if (pendingLicense) {
        throw new Error("Bu e-posta adresine atanmış bekleyen bir lisans bulunuyor. Yeni lisans oluşturmak için mevcut lisansı iptal edin.");
      }

      // Also check tenant-level if the user already has a tenant:
      const userResult = await client.query("SELECT tenant_id FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL LIMIT 1", [customerEmail]);
      const userRow = userResult.rows[0];
      if (userRow?.tenant_id) {
        const tenantActive = await getActiveLicenseForTenant(userRow.tenant_id, client);
        if (tenantActive) {
          throw new Error("Bu müşterinin aktif bir lisansı bulunuyor. Yeni lisans oluşturmak için mevcut lisansı iptal edin.");
        }
      }
    }

    await ensureCorePlans(client);
    const licenseType = normalizeLicenseType(body.licenseType);
    const slug = licenseType === "demo" ? "demo" : planNameToSlug(body.planName);
    const plan = await getPlanBySlug(slug, client);
    if (!plan) throw new Error("invalid_plan");

    let tenantId: string | null = null;
    let isNewCustomer = false;
    let resetToken: string | null = null;

    const userResult = await client.query("SELECT * FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL LIMIT 1", [customerEmail]);
    const existingUser = userResult.rows[0];

    if (existingUser) {
      tenantId = existingUser.tenant_id;
      isNewCustomer = false;
    } else {
      isNewCustomer = true;
      tenantId = randomUUID();
      // Create new tenant
      await client.query(
        `INSERT INTO tenants (id, name, legal_name, status, store_limit, user_limit, store_count)
         VALUES ($1, $2, $2, 'active', $3, $4, 0)`,
        [
          tenantId,
          body.businessName?.trim() || body.customerName?.trim() || "Yeni İşletme",
          plan.store_limit || body.storeLimit || 1,
          plan.user_limit || body.userLimit || 5,
        ]
      );
      // Create new user with temp password
      const newUserId = randomUUID();
      const tempPassword = randomUUID() + "TempPassword123!";
      const passwordHash = await hashPassword(tempPassword);
      await client.query(
        `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, status)
         VALUES ($1, $2, $3, $4, $5, 'customer', 'active')`,
        [
          newUserId,
          tenantId,
          customerEmail,
          passwordHash,
          body.customerName?.trim() || "Yeni Müşteri",
        ]
      );
      // Set tenant owner
      await client.query("UPDATE tenants SET owner_user_id = $1 WHERE id = $2", [newUserId, tenantId]);

      // Generate 7 days TTL reset token
      resetToken = createRawToken();
      const ttlMinutes = 7 * 24 * 60; // 7 days
      await client.query(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, now() + ($4 || ' minutes')::interval)`,
        [randomUUID(), newUserId, hashToken(resetToken), ttlMinutes]
      );
    }

    const rawKey = `SHLF-${randomUUID().slice(0, 8).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const id = randomUUID();
    const expiresAt = licenseType === "demo" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : calculateExpiresAt(body.validity);

    // Insert license as 'active' and link it directly
    await client.query(
      `INSERT INTO licenses (id, plan_id, tenant_id, license_key_hash, license_key_prefix, masked_key, masked_license_key, encrypted_license_key, issued_to_email, status, license_type, expires_at, created_by_user_id, activated_at)
       VALUES ($1, $2, $3, $4, $5, $5, $6, $7, 'active', $8, $9, $10, $11, now())`,
      [id, plan.id, tenantId, hashLicenseKey(rawKey), rawKey.slice(0, 7), maskLicenseKey(rawKey), encryptSecret(rawKey), customerEmail, licenseType, expiresAt, actorId],
    );

    // Insert subscription
    await client.query(
      `INSERT INTO subscriptions (id, tenant_id, plan_id, license_id, status, current_period_end)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), tenantId, plan.id, id, licenseType === "demo" ? "trialing" : "active", expiresAt],
    );

    await addAudit(client, "admin.license.create", "license", id, tenantId, { customerEmail: body.customerEmail });

    const result = await client.query<DbRow>(
      `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name, p.store_limit, p.user_limit
       FROM licenses l
       JOIN plans p ON p.id = l.plan_id
       WHERE l.id = $1`,
      [id],
    );
    const row = result.rows[0];

    return {
      id: row.id,
      fullKey: rawKey,
      hasFullKey: true,
      legacyKeyMessage: null,
      maskedKey: row.masked_license_key,
      customerName: body.customerName?.trim() || "Yeni Müşteri",
      customerEmail: row.issued_to_email || "",
      businessName: body.businessName?.trim() || "Atanmamış",
      planName: row.plan_name,
      planSlug: row.plan_slug,
      licenseType: row.license_type,
      isDemo: row.license_type === "demo" || row.plan_slug === "demo",
      status: effectiveLicenseStatus(row),
      activatedAt: row.activated_at ? formatDate(row.activated_at) : "-",
      expiresAt: row.expires_at ? formatDate(row.expires_at) : "Süresiz",
      remainingDays: remainingDays(row.expires_at),
      storeLimit: getPlanLimit(row.plan_slug, row.store_limit || body.storeLimit, "store"),
      userLimit: getPlanLimit(row.plan_slug, row.user_limit || body.userLimit, "user"),
      createdAt: formatDate(row.created_at),
      isNewCustomer,
      resetToken,
    };
  });
}

export async function renewAdminLicense(actorId: string, licenseId: string) {
  return transaction(async (client) => {
    const result = await client.query<DbRow>(
      `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name, p.store_limit, p.user_limit
       FROM licenses l
       JOIN plans p ON p.id = l.plan_id
       WHERE l.id = $1
       FOR UPDATE OF l`,
      [licenseId],
    );
    const row = result.rows[0];
    if (!row) return { ok: false, code: "license_not_found", message: "Lisans bulunamadı." };
    if (row.status === "revoked" || effectiveLicenseStatus(row) === "expired") {
      return { ok: false, code: "license_inactive", message: "İptal edilmiş veya süresi dolmuş lisans yenilenemez." };
    }

    const rawKey = `SHLF-${randomUUID().slice(0, 8).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;

    // Calculate new expires_at based on original duration:
    let newExpiresAt: Date | null = null;
    if (row.expires_at && (row.activated_at || row.created_at)) {
      const durationMs = new Date(row.expires_at).getTime() - new Date(row.activated_at || row.created_at).getTime();
      newExpiresAt = new Date(Date.now() + durationMs);
    }

    await client.query(
      `UPDATE licenses
       SET license_key_hash = $2,
           license_key_prefix = $3,
           masked_key = $4,
           masked_license_key = $4,
           encrypted_license_key = $5,
           expires_at = $6,
           updated_at = now()
       WHERE id = $1`,
      [licenseId, hashLicenseKey(rawKey), rawKey.slice(0, 7), maskLicenseKey(rawKey), encryptSecret(rawKey), newExpiresAt],
    );
    await addAudit(client, "admin.license.renew_key", "license", licenseId, row.tenant_id, { actorId });

    return {
      ok: true,
      license: {
        id: row.id,
        fullKey: rawKey,
        hasFullKey: true,
        legacyKeyMessage: null,
        maskedKey: maskLicenseKey(rawKey),
        customerName: row.issued_to_email || "Müşteri",
        customerEmail: row.issued_to_email || "",
        businessName: row.tenant_id || "Atanmamış",
        planName: row.plan_name,
        planSlug: row.plan_slug,
        licenseType: row.license_type,
        isDemo: row.license_type === "demo" || row.plan_slug === "demo",
        status: effectiveLicenseStatus(row),
        activatedAt: row.activated_at ? formatDate(row.activated_at) : "-",
        expiresAt: newExpiresAt ? formatDate(newExpiresAt) : "Süresiz",
        remainingDays: remainingDays(newExpiresAt),
        storeLimit: getPlanLimit(row.plan_slug, row.store_limit, "store"),
        userLimit: getPlanLimit(row.plan_slug, row.user_limit, "user"),
        createdAt: formatDate(row.created_at),
      },
    };
  });
}

function normalizeLicenseType(value?: string) {
  if (value === "demo" || value === "enterprise") return value;
  return "standard";
}

function planNameToSlug(planName?: string) {
  const normalized = (planName || "").toLocaleLowerCase("tr-TR");
  if (normalized.includes("demo")) return "demo";
  if (normalized.includes("baş") || normalized.includes("bas")) return "baslangic";
  if (normalized.includes("kur")) return "kurumsal";
  return "profesyonel";
}

export async function adminCustomers() {
  const result = await query<DbRow>(
    `SELECT DISTINCT ON (t.id) t.*, u.email, u.full_name, p.name AS plan_name, s.status AS subscription_status
     FROM tenants t
     LEFT JOIN users u ON u.id = t.owner_user_id
     LEFT JOIN licenses l ON l.tenant_id = t.id
     LEFT JOIN subscriptions s ON s.license_id = l.id
     LEFT JOIN plans p ON p.id = l.plan_id
     WHERE t.deleted_at IS NULL
     ORDER BY t.id, l.created_at DESC NULLS LAST`,
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    storeCount: row.store_count,
    planName: row.subscription_status === "active" ? row.plan_name : "Aktif plan yok",
    subscriptionStatus: row.subscription_status || "inactive",
  }));
}

export async function createPasswordReset(userId: string, token: string, requestIp?: string) {
  const ttlMinutes = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30);
  await query(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, request_ip)
     VALUES ($1, $2, $3, now() + ($4 || ' minutes')::interval, $5::inet)`,
    [randomUUID(), userId, hashToken(token), ttlMinutes, requestIp || null],
  );
}

export async function resetPasswordWithToken(token: string, password: string) {
  const result = await transaction(async (client) => {
    const resultQuery = await client.query<DbRow>(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       FOR UPDATE`,
      [hashToken(token)],
    );
    const record = resultQuery.rows[0];
    if (!record) return null;
    await client.query("UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1", [record.user_id, await hashPassword(password)]);
    await client.query("UPDATE password_reset_tokens SET used_at = now() WHERE id = $1", [record.id]);
    await addAudit(client, "auth.password_reset", "user", record.user_id, null, {});

    const userRes = await client.query<DbRow>("SELECT email, tenant_id FROM users WHERE id = $1", [record.user_id]);
    const user = userRes.rows[0];
    return {
      email: user?.email,
      tenantId: user?.tenant_id,
    };
  });

  if (result) {
    if (result.email && result.tenantId) {
      try {
        await autoActivatePendingDemoLicenses(result.email, result.tenantId);
      } catch (err) {
        console.error("Auto activate pending demo licenses failed in resetPasswordWithToken:", err);
      }
    }
    return true;
  }

  return false;
}

export async function validateLicense(licenseKey: string, ownerEmail: string) {
  const normalizedKey = normalizeLicenseKey(licenseKey);
  if (!normalizedKey) return { ok: false, status: "invalid", message: "Lisans bulunamadı." };
  const row = await findLicenseByHash(hashLicenseKey(normalizedKey));
  if (!row) return { ok: false, status: "invalid", message: "Lisans bulunamadı." };
  if (row.issued_to_email && normalizeEmail(row.issued_to_email) !== normalizeEmail(ownerEmail)) {
    return { ok: false, status: "invalid", message: "E-posta adresi lisans kaydı ile eşleşmiyor." };
  }
  if (row.status === "revoked" || effectiveLicenseStatus(row) === "expired") {
    return { ok: false, status: effectiveLicenseStatus(row), message: "Lisans aktif değil." };
  }
  return {
    ok: true,
    status: "valid",
    message: "Lisans bilgileri uygun görünüyor.",
    plan: {
      id: row.plan_slug,
      planName: row.plan_name,
      storeLimit: row.store_limit ?? "unlimited",
      userLimit: row.user_limit ?? "unlimited",
      enabledModules: modules(row),
    },
    licenseType: row.license_type,
    isDemo: row.license_type === "demo" || row.plan_slug === "demo",
    activatedAt: row.activated_at ? new Date(row.activated_at).toISOString() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    remainingDays: remainingDays(row.expires_at),
  };
}

export async function activateLicense(body: {
  licenseKey: string;
  ownerEmail: string;
  businessName?: string;
  ownerFullName?: string;
  password?: string;
  storeCount?: number;
}) {
  return transaction(async (client) => {
    const license = await findLicenseByHash(hashLicenseKey(normalizeLicenseKey(body.licenseKey)), client);
    if (!license || license.status === "revoked" || effectiveLicenseStatus(license) === "expired") return null;
    const email = normalizeEmail(body.ownerEmail);
    if (license.issued_to_email && normalizeEmail(license.issued_to_email) !== email) return null;
    let user = await findUserByEmail(email, client);
    let tenantId = user?.tenant_id;
    if (license.tenant_id && tenantId && license.tenant_id !== tenantId) return null;
    if (license.tenant_id && !tenantId && license.issued_to_email && normalizeEmail(license.issued_to_email) !== email) return null;
    if (license.status === "active" && license.tenant_id && !tenantId) return null;
    if (!tenantId) {
      tenantId = randomUUID();
      const userId = randomUUID();
      await client.query(
        "INSERT INTO tenants (id, name, legal_name, status, store_limit, user_limit, store_count) VALUES ($1, $2, $2, 'active', $3, $4, $5)",
        [tenantId, body.businessName || "Yeni İşletme", license.store_limit || 1, license.user_limit || 1, body.storeCount || 1],
      );
      await client.query(
        "INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, status) VALUES ($1, $2, $3, $4, $5, 'customer', 'active')",
        [userId, tenantId, email, await hashPassword(body.password || createReference("pwd")), body.ownerFullName || "Shelfio Müşterisi"],
      );
      await client.query("UPDATE tenants SET owner_user_id = $1 WHERE id = $2", [userId, tenantId]);
      user = await findUserById(userId, client);
    }
    await client.query(
      "UPDATE licenses SET tenant_id = $2, issued_to_email = $3, status = 'active', activated_at = COALESCE(activated_at, now()), updated_at = now() WHERE id = $1",
      [license.id, tenantId, email],
    );
    await client.query(
      `INSERT INTO subscriptions (id, tenant_id, plan_id, license_id, status, current_period_end)
       SELECT $1, $2, $3, $4, CASE WHEN $5 = 'demo' THEN 'trialing' ELSE 'active' END, $6
       WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE license_id = $4)`,
      [randomUUID(), tenantId, license.plan_id, license.id, license.license_type, license.expires_at],
    );
    await addAudit(client, "license.activate", "license", license.id, tenantId, { email });
    return { licenseId: license.id, tenantId };
  });
}

export async function autoActivatePendingDemoLicenses(email: string, tenantId: string, client: DbClient = { query }) {
  const normalizedEmail = normalizeEmail(email);
  const pendingRes = await client.query<DbRow>(
    `SELECT l.id, l.plan_id, p.store_limit, p.user_limit, l.expires_at, l.license_type
     FROM licenses l
     JOIN plans p ON p.id = l.plan_id
     WHERE lower(l.issued_to_email) = lower($1) AND l.status = 'pending' AND l.license_type = 'demo'`,
    [normalizedEmail]
  );

  for (const row of pendingRes.rows) {
    const licenseId = row.id;
    await client.query(
      `UPDATE licenses
       SET tenant_id = $2,
           status = 'active',
           activated_at = COALESCE(activated_at, now()),
           updated_at = now()
       WHERE id = $1`,
      [licenseId, tenantId]
    );
    await client.query(
      `INSERT INTO subscriptions (id, tenant_id, plan_id, license_id, status, current_period_end)
       SELECT $1, $2, $3, $4, 'trialing', $5
       WHERE NOT EXISTS (
         SELECT 1 FROM subscriptions WHERE license_id = $4
       )`,
      [randomUUID(), tenantId, row.plan_id, licenseId, row.expires_at]
    );
    await client.query(
      `UPDATE tenants
       SET store_limit = GREATEST(store_limit, $2),
           user_limit = GREATEST(user_limit, $3)
       WHERE id = $1`,
      [tenantId, row.store_limit || 1, row.user_limit || 5]
    );
    await client.query(
      `INSERT INTO audit_logs (id, action, resource_type, resource_id, tenant_id, metadata, created_at)
       VALUES ($1, 'license.auto_activate_demo', 'license', $2, $3, $4::jsonb, now())`,
      [randomUUID(), licenseId, tenantId, JSON.stringify({ email: normalizedEmail })]
    );
  }
}

export async function saveDemoRequest(body: {
  businessName: string;
  businessType?: string;
  email: string;
  fullName: string;
  interestedModules: string[];
  message?: string;
  phone?: string;
  source: string;
  storeCount: number;
}) {
  return transaction(async (client) => {
    const id = randomUUID();
    const refResult = await client.query<{ nextval: string }>("SELECT nextval('demo_request_ref_seq')");
    const shortRef = refResult.rows[0].nextval;

    await client.query(
      `INSERT INTO demo_requests (id, short_reference, full_name, email, phone, business_name, business_type, store_count, interested_modules, message, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)`,
      [id, shortRef, body.fullName, body.email, body.phone || null, body.businessName, body.businessType || null, body.storeCount, JSON.stringify(body.interestedModules), body.message || null, body.source],
    );

    const emailNormalized = normalizeEmail(body.email);
    const existingUser = await client.query("SELECT id FROM users WHERE lower(email) = lower($1)", [emailNormalized]);

    if (existingUser.rowCount === 0) {
      const tenantId = randomUUID();
      const userId = randomUUID();
      const tempPassword = randomUUID() + "TempPwd123!";
      const passwordHash = await hashPassword(tempPassword);

      await client.query(
        `INSERT INTO tenants (id, name, legal_name, status, store_limit, user_limit, store_count)
         VALUES ($1, $2, $2, 'active', 1, 5, $3)`,
        [tenantId, body.businessName.trim() || "Yeni İşletme", body.storeCount || 1],
      );
      await client.query(
        `INSERT INTO users (id, tenant_id, email, password_hash, full_name, phone, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'customer', 'active')`,
        [userId, tenantId, emailNormalized, passwordHash, body.fullName.trim() || "Shelfio Müşterisi", body.phone?.trim() || null],
      );
      await client.query("UPDATE tenants SET owner_user_id = $1 WHERE id = $2", [userId, tenantId]);

      await client.query(
        `INSERT INTO audit_logs (id, action, resource_type, resource_id, tenant_id, metadata, created_at)
         VALUES ($1, 'admin.create_customer', 'user', $2, $3, $4::jsonb, now())`,
        [randomUUID(), userId, tenantId, JSON.stringify({ email: emailNormalized, autoCreatedFromDemo: true })]
      );
    }

    return { id, shortReference: shortRef };
  });
}

export async function listDemoRequests() {
  const result = await query<DbRow>("SELECT * FROM demo_requests ORDER BY created_at DESC LIMIT 100");
  return result.rows.map((row) => ({
    id: row.id,
    referenceId: row.short_reference ? `DEMO-${row.short_reference}` : row.id,
    company: row.business_name,
    contact: row.email,
    createdAt: formatDate(row.created_at),
    licenseId: row.license_id ?? null,
    rejectionReason: row.rejection_reason ?? null,
    status: row.status,
    storeCount: row.store_count,
  }));
}

export async function approveDemoRequest(actorId: string, demoRequestId: string) {
  return transaction(async (client) => {
    await ensureCorePlans(client);
    const demoResult = await client.query<DbRow>("SELECT * FROM demo_requests WHERE id = $1 FOR UPDATE", [demoRequestId]);
    const demo = demoResult.rows[0];
    if (!demo) return { ok: false, code: "demo_not_found", message: "Demo talebi bulunamadı." };
    if (demo.status !== "Yeni") return { ok: false, code: "demo_already_processed", message: "Bu demo talebi daha önce işlenmiş." };

    const customerEmail = normalizeEmail(demo.email);
    const active = await client.query<DbRow>(
      `SELECT 1 FROM licenses
       WHERE lower(issued_to_email) = lower($1)
         AND status = 'active'
         AND (expires_at IS NULL OR expires_at > now())
       LIMIT 1`,
      [customerEmail],
    );
    if (active.rowCount) {
      return { ok: false, code: "customer_has_active_license", message: "Bu müşteri için aktif lisans bulunuyor." };
    }

    const plan = await getPlanBySlug("kurumsal", client);
    if (!plan) throw new Error("invalid_plan");
    const rawKey = `SHLF-${randomUUID().slice(0, 8).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const licenseId = randomUUID();
    await client.query(
      `INSERT INTO licenses (id, plan_id, license_key_hash, license_key_prefix, masked_key, masked_license_key, encrypted_license_key, issued_to_email, status, license_type, expires_at, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $5, $6, $7, 'pending', 'demo', now() + interval '7 days', $8)`,
      [licenseId, plan.id, hashLicenseKey(rawKey), rawKey.slice(0, 7), maskLicenseKey(rawKey), encryptSecret(rawKey), customerEmail, actorId],
    );
    const userResult = await client.query<DbRow>("SELECT * FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL LIMIT 1", [customerEmail]);
    const existingUser = userResult.rows[0];
    if (!existingUser) {
      const tenantId = randomUUID();
      const userId = randomUUID();
      await client.query(
        `INSERT INTO tenants (id, name, legal_name, status, store_limit, user_limit, store_count)
         VALUES ($1, $2, $2, 'active', $3, $4, $5)`,
        [tenantId, demo.business_name || "Yeni İşletme", plan.store_limit || 1, plan.user_limit || 5, demo.store_count || 1],
      );
      await client.query(
        `INSERT INTO users (id, tenant_id, email, password_hash, full_name, phone, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'customer', 'active')`,
        [userId, tenantId, customerEmail, await hashPassword(createReference("pwd")), demo.full_name || "Shelfio Müşterisi", demo.phone || null],
      );
      await client.query("UPDATE tenants SET owner_user_id = $1 WHERE id = $2", [userId, tenantId]);
    } else if (!existingUser.tenant_id) {
      const tenantId = randomUUID();
      await client.query(
        `INSERT INTO tenants (id, name, legal_name, owner_user_id, status, store_limit, user_limit, store_count)
         VALUES ($1, $2, $2, $3, 'active', $4, $5, $6)`,
        [tenantId, demo.business_name || "Yeni İşletme", existingUser.id, plan.store_limit || 1, plan.user_limit || 5, demo.store_count || 1],
      );
      await client.query("UPDATE users SET tenant_id = $2, updated_at = now() WHERE id = $1", [existingUser.id, tenantId]);
    }
    await client.query(
      `UPDATE demo_requests
       SET status = 'Onaylandı',
           license_id = $2,
           reviewed_by_user_id = $3,
           reviewed_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [demoRequestId, licenseId, actorId],
    );
    await addAudit(client, "admin.demo.approve", "demo_request", demoRequestId, null, { actorId, licenseId, customerEmail });

    return {
      ok: true,
      license: {
        id: licenseId,
        fullKey: rawKey,
        maskedKey: maskLicenseKey(rawKey),
        customerEmail,
        customerName: demo.full_name,
        expiresAt: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        licenseType: "demo",
        planName: plan.name,
        referenceId: demo.short_reference ? `DEMO-${demo.short_reference}` : `DEMO-${demoRequestId}`,
      },
    };
  });
}

export async function rejectDemoRequest(actorId: string, demoRequestId: string, reason?: string) {
  return transaction(async (client) => {
    const demoResult = await client.query<DbRow>("SELECT * FROM demo_requests WHERE id = $1 FOR UPDATE", [demoRequestId]);
    const demo = demoResult.rows[0];
    if (!demo) return { ok: false, code: "demo_not_found", message: "Demo talebi bulunamadı." };
    if (demo.status !== "Yeni") return { ok: false, code: "demo_already_processed", message: "Bu demo talebi daha önce işlenmiş." };
    await client.query(
      `UPDATE demo_requests
       SET status = 'Reddedildi',
           rejection_reason = $2,
           reviewed_by_user_id = $3,
           reviewed_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [demoRequestId, reason?.trim() || null, actorId],
    );
    await addAudit(client, "admin.demo.reject", "demo_request", demoRequestId, null, { actorId });
    return {
      ok: true,
      demo: {
        customerEmail: normalizeEmail(demo.email),
        customerName: demo.full_name,
        reason: reason?.trim() || null,
      },
    };
  });
}

export async function addAudit(client: DbClient, action: string, resourceType: string, resourceId: string | null, tenantId: string | null, metadata: Record<string, unknown>) {
  await client.query(
    "INSERT INTO audit_logs (id, action, resource_type, resource_id, tenant_id, metadata) VALUES ($1, $2, $3, $4, $5, $6::jsonb)",
    [randomUUID(), action, resourceType, resourceId, tenantId, JSON.stringify(metadata)],
  );
}

export async function recordAudit(input: {
  action: string;
  actorUserId?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
  resourceId?: string | null;
  resourceType: string;
  tenantId?: string | null;
  userAgent?: string | null;
}) {
  await query(
    `INSERT INTO audit_logs (id, actor_user_id, tenant_id, action, resource_type, resource_id, ip, user_agent, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7::inet, $8, $9::jsonb)`,
    [
      randomUUID(),
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
}

export async function cancelCustomerLicense(input: {
  userId: string;
  tenantId: string;
  licenseId: string;
  passwordConfirm: string;
  confirmText: string;
}) {
  if (input.confirmText !== "IPTAL") {
    return { ok: false, code: "invalid_confirm_text", message: "Lütfen iptal işlemini onaylamak için 'IPTAL' yazın." };
  }

  return transaction(async (client) => {
    // 1. Verify user password
    const userResult = await client.query("SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL", [input.userId]);
    const user = userResult.rows[0];
    if (!user || !(await verifyPassword(input.passwordConfirm, user.password_hash))) {
      return { ok: false, code: "invalid_password", message: "Girdiğiniz şifre hatalı." };
    }

    // 2. Fetch the license
    const licenseResult = await client.query<DbRow>(
      `SELECT * FROM licenses WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
      [input.licenseId, input.tenantId]
    );
    const license = licenseResult.rows[0];
    if (!license) {
      return { ok: false, code: "license_not_found", message: "İptal edilecek lisans bulunamadı." };
    }

    if (license.status === "revoked") {
      return { ok: false, code: "license_already_revoked", message: "Bu lisans zaten iptal edilmiş." };
    }

    // 3. Update the license status to 'revoked'
    await client.query(
      `UPDATE licenses
       SET status = 'revoked',
           revoked_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [license.id]
    );

    // Also update any active subscriptions for this license to 'cancelled'
    await client.query(
      `UPDATE subscriptions
       SET status = 'cancelled',
           cancelled_at = now(),
           updated_at = now()
       WHERE license_id = $1`,
      [license.id]
    );

    // 4. Audit log
    await addAudit(client, "license.customer_cancel", "license", license.id, input.tenantId, {
      userId: input.userId,
      reason: "customer_requested"
    });

    return { ok: true, message: "Lisansınız başarıyla iptal edildi." };
  });
}

export async function revokeAdminLicense(actorId: string, licenseId: string) {
  return transaction(async (client) => {
    const licenseResult = await client.query<DbRow>(
      `SELECT * FROM licenses WHERE id = $1 FOR UPDATE`,
      [licenseId]
    );
    const license = licenseResult.rows[0];
    if (!license) {
      return { ok: false, code: "license_not_found", message: "Lisans bulunamadı." };
    }
    if (license.status === "revoked") {
      return { ok: false, code: "license_already_revoked", message: "Bu lisans zaten iptal edilmiş." };
    }

    await client.query(
      `UPDATE licenses
       SET status = 'revoked',
           revoked_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [licenseId]
    );

    await client.query(
      `UPDATE subscriptions
       SET status = 'cancelled',
           cancelled_at = now(),
           updated_at = now()
       WHERE license_id = $1`,
      [licenseId]
    );

    await addAudit(client, "admin.license.revoke", "license", licenseId, license.tenant_id, {
      actorId,
    });

    return { ok: true, message: "Lisans başarıyla iptal edildi (Revoked)." };
  });
}

export async function getStoreLicenseRequests(tenantId: string) {
  const result = await query(
    `SELECT r.*, u.full_name AS requested_by_user_name
     FROM store_license_requests r
     LEFT JOIN users u ON u.id = r.requested_by_user_id
     WHERE r.tenant_id = $1
     ORDER BY r.created_at DESC`,
    [tenantId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    requestedByUserId: row.requested_by_user_id,
    requestedByUserName: row.requested_by_user_name,
    requestedStoreName: row.requested_store_name,
    note: row.note,
    status: row.status,
    baseLicenseId: row.base_license_id,
    generatedLicenseId: row.generated_license_id,
    planId: row.plan_id,
    planSlug: row.plan_slug,
    adminNote: row.admin_note,
    decidedByUserId: row.decided_by_user_id,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createStoreLicenseRequest(tenantId: string, userId: string, requestedStoreName: string, note?: string) {
  const storeNameTrimmed = String(requestedStoreName || "").trim();
  if (!storeNameTrimmed) {
    throw new Error("Mağaza adı boş olamaz.");
  }

  return transaction(async (client) => {
    const activeLicense = await getActiveLicenseForTenant(tenantId, client);
    if (!activeLicense) {
      throw new Error("Ek mağaza lisansı talep edebilmek için aktif bir planınız bulunmalıdır.");
    }

    const isDemo = activeLicense.license_type === "demo" || activeLicense.plan_slug === "demo";
    const storeLimit = isDemo ? 1 : getPlanLimit(activeLicense.plan_slug, activeLicense.store_limit, "store");

    const usedResult = await client.query(
      `SELECT COUNT(*)::int AS count FROM licenses WHERE tenant_id = $1 AND status IN ('active', 'pending')`,
      [tenantId]
    );
    const usedLicensesCount = usedResult.rows[0]?.count ?? 0;

    const pendingResult = await client.query(
      `SELECT COUNT(*)::int AS count FROM store_license_requests WHERE tenant_id = $1 AND status = 'pending'`,
      [tenantId]
    );
    const pendingRequestsCount = pendingResult.rows[0]?.count ?? 0;

    const totalUsed = usedLicensesCount + pendingRequestsCount;
    if (typeof storeLimit === "number" && totalUsed >= storeLimit) {
      throw new Error("Mevcut planınızdaki mağaza lisansı hakkınız dolu. Daha fazla mağaza için planınızı güncelleyin.");
    }

    const duplicateResult = await client.query(
      `SELECT 1 FROM store_license_requests
       WHERE tenant_id = $1 AND lower(requested_store_name) = lower($2) AND status IN ('pending', 'approved')`,
      [tenantId, storeNameTrimmed]
    );
    if (duplicateResult.rows.length > 0) {
      throw new Error("Bu mağaza adıyla zaten açık veya onaylanmış bir talep bulunuyor.");
    }

    const id = randomUUID();
    const result = await client.query(
      `INSERT INTO store_license_requests (
         id, tenant_id, requested_by_user_id, requested_store_name, note, status,
         base_license_id, plan_id, plan_slug, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, now(), now())
       RETURNING *`,
      [
        id,
        tenantId,
        userId,
        storeNameTrimmed,
        note ? note.trim() : null,
        activeLicense.id,
        activeLicense.plan_id,
        activeLicense.plan_slug,
      ]
    );

    await addAudit(client, "store_license_request.create", "store_license_request", id, tenantId, {
      userId,
      requestedStoreName: storeNameTrimmed,
    });

    return result.rows[0];
  });
}

export async function cancelStoreLicenseRequest(tenantId: string, requestId: string, userId: string) {
  return transaction(async (client) => {
    const result = await client.query(
      `UPDATE store_license_requests
       SET status = 'cancelled',
           decided_by_user_id = $3,
           decided_at = now(),
           updated_at = now()
       WHERE id = $1 AND tenant_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, tenantId, userId]
    );
    const updated = result.rows[0];
    if (!updated) {
      throw new Error("İptal edilecek bekleyen talep bulunamadı.");
    }
    await addAudit(client, "store_license_request.cancel", "store_license_request", requestId, tenantId, { userId });
    return updated;
  });
}

export async function getStoreLicenses(tenantId: string) {
  const result = await query<DbRow>(
    `SELECT l.*, p.slug AS plan_slug, p.name AS plan_name, p.store_limit, p.user_limit, p.modules,
            parent.masked_key AS parent_masked_key, parent.store_name AS parent_store_name
     FROM licenses l
     JOIN plans p ON p.id = l.plan_id
     LEFT JOIN licenses parent ON parent.id = l.parent_license_id
     WHERE l.tenant_id = $1
     ORDER BY l.created_at DESC`,
    [tenantId]
  );
  return result.rows.map(toAccountLicense);
}

export async function getAdminStoreLicenseRequests() {
  const result = await query(
    `SELECT r.*,
            u.email AS customer_email,
            u.full_name AS requested_by_user_name,
            t.name AS tenant_name,
            t.store_limit AS tenant_store_limit,
            COALESCE(usage.count, 0)::int AS tenant_used_store_licenses
     FROM store_license_requests r
     JOIN tenants t ON t.id = r.tenant_id
     JOIN users u ON u.id = r.requested_by_user_id
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS count
       FROM licenses
       WHERE tenant_id = r.tenant_id AND status IN ('active', 'pending')
     ) usage ON true
     ORDER BY r.created_at DESC`
  );
  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    customerEmail: row.customer_email,
    requestedByUserId: row.requested_by_user_id,
    requestedByUserName: row.requested_by_user_name,
    requestedStoreName: row.requested_store_name,
    note: row.note,
    status: row.status,
    baseLicenseId: row.base_license_id,
    generatedLicenseId: row.generated_license_id,
    planId: row.plan_id,
    planSlug: row.plan_slug,
    adminNote: row.admin_note,
    decidedByUserId: row.decided_by_user_id,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tenantStoreLimit: row.tenant_store_limit,
    tenantUsedStoreLicenses: row.tenant_used_store_licenses,
  }));
}

export async function approveStoreLicenseRequest(adminUserId: string, requestId: string, adminNote?: string) {
  return transaction(async (client) => {
    const requestResult = await client.query(
      `SELECT r.*, u.email AS customer_email, u.full_name AS customer_name, t.id AS tenant_id
       FROM store_license_requests r
       JOIN tenants t ON t.id = r.tenant_id
       JOIN users u ON u.id = r.requested_by_user_id
       WHERE r.id = $1 AND r.status = 'pending'
       FOR UPDATE OF r`,
      [requestId]
    );
    const req = requestResult.rows[0];
    if (!req) {
      throw new Error("Onaylanacak bekleyen talep bulunamadı.");
    }

    const activeLicense = await getActiveLicenseForTenant(req.tenant_id, client);
    if (!activeLicense) {
      throw new Error("Müşterinin aktif bir lisansı bulunmadığı için ek mağaza lisansı onaylanamaz.");
    }

    const isDemo = activeLicense.license_type === "demo" || activeLicense.plan_slug === "demo";
    const storeLimit = isDemo ? 1 : getPlanLimit(activeLicense.plan_slug, activeLicense.store_limit, "store");

    const usedResult = await client.query(
      `SELECT COUNT(*)::int AS count FROM licenses WHERE tenant_id = $1 AND status IN ('active', 'pending')`,
      [req.tenant_id]
    );
    const usedCount = usedResult.rows[0]?.count ?? 0;
    if (typeof storeLimit === "number" && usedCount >= storeLimit) {
      throw new Error("Müşterinin planındaki mağaza lisansı hakkı dolu. Onay işlemi gerçekleştirilemez.");
    }

    const rawKey = `SHLF-${randomUUID().slice(0, 8).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const licenseId = randomUUID();
    const expiresAt = activeLicense.expires_at ? new Date(activeLicense.expires_at) : null;
    const licenseType = activeLicense.license_type || "standard";

    await client.query(
      `INSERT INTO licenses (
         id, tenant_id, plan_id, license_key_hash, license_key_prefix, masked_key,
         masked_license_key, encrypted_license_key, issued_to_email, status,
         license_type, store_name, expires_at, created_by_user_id, parent_license_id, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $12, $13, $14, now(), now())`,
      [
        licenseId,
        req.tenant_id,
        activeLicense.plan_id,
        hashLicenseKey(rawKey),
        rawKey.slice(0, 7),
        maskLicenseKey(rawKey),
        encryptSecret(rawKey),
        req.customer_email,
        "pending",
        licenseType,
        req.requested_store_name,
        expiresAt,
        adminUserId,
        activeLicense.id,
      ]
    );

    await client.query(
      `UPDATE store_license_requests
       SET status = 'approved',
           generated_license_id = $2,
           admin_note = $3,
           decided_by_user_id = $4,
           decided_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [requestId, licenseId, adminNote ? adminNote.trim() : null, adminUserId]
    );

    await addAudit(client, "store_license_request.approve", "store_license_request", requestId, req.tenant_id, {
      adminUserId,
      licenseId,
      rawKeyMasked: maskLicenseKey(rawKey),
    });

    return {
      requestId: req.id,
      customerEmail: req.customer_email,
      customerName: req.customer_name,
      requestedStoreName: req.requested_store_name,
      planName: activeLicense.plan_name,
      planSlug: activeLicense.plan_slug,
      rawKey,
      maskedKey: maskLicenseKey(rawKey),
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    };
  });
}

export async function rejectStoreLicenseRequest(adminUserId: string, requestId: string, adminNote?: string) {
  return transaction(async (client) => {
    const requestResult = await client.query(
      `SELECT r.*, u.email AS customer_email, u.full_name AS customer_name, t.id AS tenant_id
       FROM store_license_requests r
       JOIN tenants t ON t.id = r.tenant_id
       JOIN users u ON u.id = r.requested_by_user_id
       WHERE r.id = $1 AND r.status = 'pending'
       FOR UPDATE OF r`,
      [requestId]
    );
    const req = requestResult.rows[0];
    if (!req) {
      throw new Error("Reddedilecek bekleyen talep bulunamadı.");
    }

    await client.query(
      `UPDATE store_license_requests
       SET status = 'rejected',
           admin_note = $2,
           decided_by_user_id = $3,
           decided_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [requestId, adminNote ? adminNote.trim() : null, adminUserId]
    );

    await addAudit(client, "store_license_request.reject", "store_license_request", requestId, req.tenant_id, {
      adminUserId,
      reason: adminNote || null,
    });

    return {
      requestId: req.id,
      customerEmail: req.customer_email,
      customerName: req.customer_name,
      requestedStoreName: req.requested_store_name,
      reason: adminNote || null,
    };
  });
}




