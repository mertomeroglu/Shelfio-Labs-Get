export type LabsExportStartInput = {
  callbackUrl?: string | null;
  externalLicenseId: string;
  externalTenantId: string;
  requestId: string;
  requestedByEmail: string;
  storeName: string;
};

export type LabsExportStartResult =
  | { ok: true; jobId: string; status: string }
  | { ok: false; code: string; message: string };

export type LabsExportStatusResult =
  | {
      ok: true;
      downloadExpiresAt?: string | null;
      downloadToken?: string | null;
      jobId: string;
      status: "pending" | "processing" | "ready" | "failed" | "expired";
    }
  | { ok: false; code: string; message: string };

function labsApiBaseUrl() {
  return (process.env.SHELFIO_LABS_API_URL || "https://shelfiolabs.com/api").replace(/\/+$/, "");
}

function labsControlSecret() {
  return process.env.SHELFIO_LABS_CONTROL_SECRET || process.env.SHELFIO_LABS_USAGE_SECRET || "";
}

function exportTimeoutMs() {
  const value = Number(process.env.SHELFIO_LABS_EXPORT_TIMEOUT_MS || 5000);
  return Number.isFinite(value) && value > 0 ? value : 5000;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readPayload(body: unknown) {
  if (body && typeof body === "object" && "data" in body) return (body as { data?: unknown }).data;
  return body;
}

function exportHeaders(secret: string) {
  return {
    "Content-Type": "application/json",
    "X-Shelfio-Control-Secret": secret,
  };
}

function normalizeProviderStatus(value: unknown): "pending" | "processing" | "ready" | "failed" | "expired" {
  const status = String(value || "").toLowerCase();
  if (status === "ready" || status === "failed" || status === "expired" || status === "pending" || status === "processing") {
    return status;
  }
  return "processing";
}

export async function startLabsExport(input: LabsExportStartInput): Promise<LabsExportStartResult> {
  const secret = labsControlSecret();
  if (!secret) return { ok: false, code: "labs_secret_missing", message: "Export servisi yapilandirilmamis." };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), exportTimeoutMs());

  try {
    const response = await fetch(`${labsApiBaseUrl()}/license-control/exports`, {
      body: JSON.stringify({
        callbackUrl: input.callbackUrl || undefined,
        externalLicenseId: input.externalLicenseId,
        externalTenantId: input.externalTenantId,
        requestId: input.requestId,
        requestedByEmail: input.requestedByEmail,
        storeName: input.storeName,
      }),
      headers: exportHeaders(secret),
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, code: "labs_export_start_failed", message: "Export isi baslatilamadi." };
    }

    const payload = readPayload(await response.json().catch(() => null));
    const row = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const jobId = readString(row.jobId ?? row.id ?? row.providerJobId);
    if (!jobId) return { ok: false, code: "labs_export_job_missing", message: "Export job bilgisi alinamadi." };

    return { ok: true, jobId, status: readString(row.status) || "processing" };
  } catch {
    return { ok: false, code: "labs_export_unavailable", message: "Export servisine ulasilamadi." };
  } finally {
    clearTimeout(timeout);
  }
}

export function extractTokenFromUrl(url: string): string {
  if (!url) return "";
  try {
    const downloadMatch = url.match(/\/exports\/download\/([^/]+)/);
    if (downloadMatch && downloadMatch[1]) {
      return decodeURIComponent(downloadMatch[1]);
    }
    const match = url.match(/\/exports\/([^/]+)/);
    if (match && match[1]) {
      const token = decodeURIComponent(match[1]);
      if (token !== "download") {
        return token;
      }
    }
  } catch (e) {
    // Ignore error
  }
  return url;
}

export async function getLabsExportStatus(jobId: string): Promise<LabsExportStatusResult> {
  const secret = labsControlSecret();
  if (!secret) return { ok: false, code: "labs_secret_missing", message: "Export servisi yapilandirilmamis." };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), exportTimeoutMs());

  try {
    const response = await fetch(`${labsApiBaseUrl()}/license-control/exports/${encodeURIComponent(jobId)}/status`, {
      headers: exportHeaders(secret),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, code: "labs_export_status_failed", message: "Export durumu alinamadi." };

    const payload = readPayload(await response.json().catch(() => null));
    const row = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};

    const rawToken = readString(
      row.downloadToken ??
      row.token ??
      row.download_token ??
      row.downloadUrl ??
      row.download_url
    );
    const downloadToken = rawToken ? extractTokenFromUrl(rawToken) : null;

    return {
      ok: true,
      downloadExpiresAt: readString(row.downloadExpiresAt ?? row.expiresAt),
      downloadToken,
      jobId: readString(row.jobId ?? row.id) || jobId,
      status: normalizeProviderStatus(row.status),
    };
  } catch {
    return { ok: false, code: "labs_export_unavailable", message: "Export servisine ulasilamadi." };
  } finally {
    clearTimeout(timeout);
  }
}

export function createLabsDownloadUrl(providerToken: string) {
  return `${labsApiBaseUrl()}/license-control/exports/download/${encodeURIComponent(providerToken)}`;
}

export function normalizeDownloadUrl(urlOrToken: string): string {
  if (!urlOrToken) return "";

  let targetUrl = urlOrToken;
  if (urlOrToken.startsWith("http://") || urlOrToken.startsWith("https://")) {
    const token = extractTokenFromUrl(urlOrToken);
    targetUrl = createLabsDownloadUrl(token);
  } else {
    targetUrl = createLabsDownloadUrl(urlOrToken);
  }

  const apiBase = labsApiBaseUrl();
  const isApiBaseLocal = apiBase.includes("localhost") || apiBase.includes("127.0.0.1") || apiBase.includes("host.docker.internal");
  const isTargetLocal = targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1") || targetUrl.includes("host.docker.internal");

  if (isTargetLocal && !isApiBaseLocal) {
    try {
      const parsedTarget = new URL(targetUrl);
      const parsedBase = new URL(apiBase);
      parsedTarget.protocol = parsedBase.protocol;
      parsedTarget.host = parsedBase.host;
      return parsedTarget.toString();
    } catch {
      // fallback
    }
  }

  return targetUrl;
}
