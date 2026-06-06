export type LabsUsageStatus = "available" | "unavailable";

export type LabsUsageStore = {
  id: string;
  storeName: string;
  businessName?: string | null;
  location?: string | null;
  status?: string | null;
  userCount?: number | null;
  enabledModules?: string[];
  activatedAt?: string | null;
};

export type LabsUsage = {
  status: LabsUsageStatus;
  currentStoreCount: number | null;
  currentUserCount: number | null;
  activeStoreCount: number | null;
  activeUserCount: number | null;
  adminEmail: string | null;
  tenantName: string | null;
  stores: LabsUsageStore[];
  users: unknown[];
  lastSyncedAt: string | null;
};

type LabsUsageEnvelope = {
  data?: unknown;
  success?: boolean;
};

const unavailableUsage: LabsUsage = {
  status: "unavailable",
  currentStoreCount: null,
  currentUserCount: null,
  activeStoreCount: null,
  activeUserCount: null,
  adminEmail: null,
  tenantName: null,
  stores: [],
  users: [],
  lastSyncedAt: null,
};

function labsApiBaseUrl() {
  return (process.env.SHELFIO_LABS_API_URL || "https://shelfiolabs.com/api").replace(/\/+$/, "");
}

function usageTimeoutMs() {
  const value = Number(process.env.SHELFIO_LABS_USAGE_TIMEOUT_MS || 1500);
  return Number.isFinite(value) && value > 0 ? value : 1500;
}

function numberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function unwrapPayload(body: unknown) {
  if (body && typeof body === "object" && "data" in body) {
    return (body as LabsUsageEnvelope).data;
  }
  return body;
}

function normalizeStores(value: unknown): LabsUsageStore[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index): LabsUsageStore | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const storeName = stringOrNull(row.storeName) ?? stringOrNull(row.name) ?? stringOrNull(row.title);
      if (!storeName) return null;
      return {
        id: stringOrNull(row.id) ?? stringOrNull(row.storeId) ?? `external-store-${index + 1}`,
        storeName,
        businessName: stringOrNull(row.businessName) ?? stringOrNull(row.tenantName),
        location: stringOrNull(row.location) ?? stringOrNull(row.city) ?? stringOrNull(row.address),
        status: stringOrNull(row.status),
        userCount: numberOrNull(row.userCount ?? row.activeUserCount),
        enabledModules: stringArray(row.enabledModules ?? row.modules),
        activatedAt: stringOrNull(row.activatedAt ?? row.createdAt),
      };
    })
    .filter((item): item is LabsUsageStore => Boolean(item));
}

function normalizeUsage(payload: unknown): LabsUsage {
  if (!payload || typeof payload !== "object") return unavailableUsage;
  const row = payload as Record<string, unknown>;
  const stores = normalizeStores(row.stores ?? row.storeSummary);
  const users = Array.isArray(row.users ?? row.userSummary) ? ((row.users ?? row.userSummary) as unknown[]) : [];
  const currentStoreCount = numberOrNull(row.currentStoreCount ?? row.storeCount ?? row.activeStoreCount);
  const currentUserCount = numberOrNull(row.currentUserCount ?? row.userCount ?? row.activeUserCount);
  const activeStoreCount = numberOrNull(row.activeStoreCount ?? row.currentStoreCount ?? row.storeCount);
  const activeUserCount = numberOrNull(row.activeUserCount ?? row.currentUserCount ?? row.userCount);

  return {
    status: "available",
    currentStoreCount,
    currentUserCount,
    activeStoreCount,
    activeUserCount,
    adminEmail: stringOrNull(row.adminEmail ?? row.ownerEmail),
    tenantName: stringOrNull(row.tenantName ?? row.name),
    stores,
    users,
    lastSyncedAt: stringOrNull(row.lastSyncedAt ?? row.updatedAt ?? row.syncedAt),
  };
}

export async function getLabsTenantUsage(externalTenantId: string): Promise<LabsUsage> {
  const secret = process.env.SHELFIO_LABS_USAGE_SECRET;
  if (!secret || !externalTenantId) return { ...unavailableUsage };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), usageTimeoutMs());
  try {
    const response = await fetch(`${labsApiBaseUrl()}/license-control/tenants/${encodeURIComponent(externalTenantId)}/usage`, {
      headers: {
        "Content-Type": "application/json",
        "X-Shelfio-Control-Secret": secret,
      },
      signal: controller.signal,
    });

    if (!response.ok) return { ...unavailableUsage };
    const body = (await response.json().catch(() => null)) as unknown;
    return normalizeUsage(unwrapPayload(body));
  } catch {
    return { ...unavailableUsage };
  } finally {
    clearTimeout(timeout);
  }
}
