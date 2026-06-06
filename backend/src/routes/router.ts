import type { IncomingMessage, ServerResponse } from "node:http";
import { isIP } from "node:net";
import { getHealth } from "../controllers/systemController.js";
import { isDatabaseConfigured, query } from "../db/client.js";
import {
  consumeDataExportDownloadToken,
  createDataExportRequest,
  expireOldDataExports,
  finalizeDataExportFailed,
  finalizeDataExportReady,
  getAdminDataExport,
  getDataExportForTenant,
  listAdminDataExports,
  listDataExportsForTenant,
  markDataExportFailed,
  markDataExportMailFailed,
  markDataExportMailSent,
  markDataExportProcessing,
  reissueDataExportDownloadToken,
  rejectDataExportRequest,
  isProviderTokenCorrupted,
  updateProviderToken,
} from "../repositories/dataExportRepository.js";
import {
  adminCustomers,
  adminLicenses,
  adminStats,
  completeCheckout,
  claimLicenseForAccount,
  createAdminLicense,
  createPanelAccessForEmail,
  createPanelAccessForUser,
  createPasswordReset,
  createPublicSupportTicket,
  createSupportTicket,
  exchangePanelAccessCode,
  ensureCorePlans,
  findUserByEmail,
  findUserById,
  getAccountOverview,
  getBillingSummary,
  getControlUserByEmail,
  getCurrentLicense,
  getLicenseStatus,
  getPlanBySlug,
  getSupportTicket,
  getTenantEntitlements,
  listDemoRequests,
  listInvoices,
  listLicensesForTenant,
  listLicensesForAccount,
  listStores,
  createStore,
  listSupportTickets,
  recordAudit,
  registerCustomer,
  createCustomerAccountByAdmin,
  resetPasswordWithToken,
  saveDemoRequest,
  toSessionUser,
  updateLastLogin,
  addSupportMessage,
  approveDemoRequest,
  cancelPlanUpgrade,
  updateSupportStatus,
  validateLicense,
  cancelCustomerLicense,
  rejectDemoRequest,
  renewAdminLicense,
  revokeAdminLicense,
  requestPlanUpgrade,
  hasUnclaimedLicense,
  autoActivatePendingDemoLicenses,
  getStoreLicenseRequests,
  createStoreLicenseRequest,
  cancelStoreLicenseRequest,
  getStoreLicenses,
  getAdminStoreLicenseRequests,
  approveStoreLicenseRequest,
  rejectStoreLicenseRequest,
} from "../repositories/controlRepository.js";

import crypto from "node:crypto";
import { isControlSecretConfigured, sanitizeAuditMetadata, verifyControlSecret } from "../services/controlAuthService.js";
import { isEmailConfigured, sendDemoRejectedMail, sendDemoRequestMail, sendDemoRequestReceiptMail, sendLicenseCreatedMail, sendPasswordResetMail, sendPlanUpgradeMail, sendSupportRequestMail, sendSupportRequestReceiptMail, sendFirstPasswordMail, sendCustomerWelcomeMail, sendAdminDirectMail, sendAdminReplyMail, sendStoreLicenseRequestApprovedMail, sendStoreLicenseRequestRejectedMail, sendStoreLicenseRequestCreatedMailToAdmin, sendDataExportReadyMail, sendDataExportRejectedMail } from "../services/emailService.js";
import { createLabsDownloadUrl, getLabsExportStatus, startLabsExport, normalizeDownloadUrl, extractTokenFromUrl } from "../services/labsExportService.js";
import { clearSessionCookie, decodeSession, sessionCookieName, setSessionCookie, type SessionPayload } from "../services/sessionService.js";
import { createReference, createRawToken, hashPassword, normalizeEmail, verifyPassword } from "../services/securityService.js";

type UserRole = "customer" | "admin";

function generateSupportToken(ticketId: string): string {
  const secret = process.env.SUPPORT_TOKEN_SECRET || "default_support_secret_key_123";
  return crypto.createHmac("sha256", secret).update(ticketId).digest("hex");
}

function verifySupportToken(ticketId: string, token: string): boolean {
  return generateSupportToken(ticketId) === token;
}

type DemoRequestBody = {
  adSoyad?: string;
  businessName?: string;
  businessType?: string;
  companyName?: string;
  consent?: boolean;
  consentAccepted?: boolean;
  email?: string;
  fullName?: string;
  honeypot?: string;
  interestedModules?: string[];
  isletmeAdi?: string;
  magazaSayisi?: number | string;
  message?: string;
  phone?: string;
  storeCount?: number | string;
  website?: string;
};

const demoRateLimitWindowMs = 10 * 60 * 1000;
const demoRateLimitMax = 5;
const demoRateLimit = new Map<string, { count: number; resetAt: number }>();

function sendJson(response: ServerResponse, statusCode: number, body: object) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function createEnvelope<T>(data: T, message: string, code = "ok", success = true, mode: "production" | "control-db" = "control-db") {
  return { success, mode, message, data, code };
}

function sendEnvelope<T>(response: ServerResponse, statusCode: number, data: T, message: string, code = "ok", success = true, mode: "production" | "control-db" = "control-db") {
  sendJson(response, statusCode, createEnvelope(data, message, code, success, mode));
}

function setCorsHeaders(request: IncomingMessage, response: ServerResponse) {
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  response.setHeader("Access-Control-Allow-Origin", getAllowedOrigin(request));
}

function getAllowedOrigin(request: IncomingMessage) {
  const requestOrigin = request.headers.origin;
  const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3007,https://getshelfio.com,https://www.getshelfio.com")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin;
  return allowedOrigins[0] ?? "http://localhost:3007";
}

function parseCookies(request: IncomingMessage) {
  const cookies = new Map<string, string>();
  const header = request.headers.cookie;
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName || rawValue.length === 0) continue;
    cookies.set(rawName, decodeURIComponent(rawValue.join("=")));
  }
  return cookies;
}

function getSession(request: IncomingMessage) {
  return decodeSession(parseCookies(request).get(sessionCookieName));
}

function requireDatabase(response: ServerResponse) {
  if (isDatabaseConfigured()) return true;
  sendEnvelope(response, 503, null, "İşlem şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.", "service_unavailable", false);
  return false;
}

function requireSession(request: IncomingMessage, response: ServerResponse, role?: UserRole) {
  const session = getSession(request);
  if (!session) {
    sendEnvelope(response, 401, null, "Oturum bulunamadı. Lütfen tekrar giriş yapın.", "unauthorized", false);
    return null;
  }
  if (role && session.user.role !== role) {
    sendEnvelope(response, 403, null, "Bu alana erişim yetkiniz yok.", "forbidden", false);
    return null;
  }
  return session;
}

function requireCustomerTenant(session: SessionPayload, response: ServerResponse) {
  const tenantId = session.user.tenant?.id;
  if (session.user.role !== "customer" || !tenantId || tenantId === "admin_portal") {
    sendEnvelope(response, 403, null, "Müşteri tenant bilgisi bulunamadı.", "tenant_required", false);
    return null;
  }
  return tenantId;
}

async function readJsonBody<T>(request: IncomingMessage): Promise<T | null> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (!chunks.length) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
  } catch {
    return null;
  }
}

function getClientIp(request: IncomingMessage) {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string") return forwardedFor.split(",")[0].trim();
  return request.socket.remoteAddress ?? "unknown";
}

function getDbClientIp(request: IncomingMessage) {
  const ip = getClientIp(request).replace(/^::ffff:/, "");
  return isIP(ip) ? ip : null;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = demoRateLimit.get(key);
  if (!current || current.resetAt < now) {
    demoRateLimit.set(key, { count: 1, resetAt: now + demoRateLimitWindowMs });
    return false;
  }
  current.count += 1;
  return current.count > demoRateLimitMax;
}

function limitText(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function maskPaymentCardNumber(cardDigits: string) {
  const lastFour = cardDigits.slice(-4);
  return `•••• •••• •••• ${lastFour}`;
}

function normalizeDemoRequest(body: DemoRequestBody | null) {
  const fullName = String(body?.fullName ?? body?.adSoyad ?? "").trim();
  const email = normalizeEmail(String(body?.email ?? ""));
  const businessName = String(body?.businessName ?? body?.companyName ?? body?.isletmeAdi ?? "").trim();
  const storeCount = Number(body?.storeCount ?? body?.magazaSayisi ?? 0);
  const interestedModules = Array.isArray(body?.interestedModules)
    ? body.interestedModules.map((item) => String(item).trim()).filter(Boolean).slice(0, 12)
    : [];

  return {
    businessName: limitText(businessName, 160),
    businessType: limitText(String(body?.businessType ?? "").trim(), 80),
    consent: body?.consent === true || body?.consentAccepted === true,
    email: limitText(email, 180),
    fullName: limitText(fullName, 120),
    honeypot: String(body?.honeypot ?? body?.website ?? "").trim(),
    interestedModules,
    message: limitText(String(body?.message ?? "").trim(), 1200),
    phone: limitText(String(body?.phone ?? "").trim(), 40),
    storeCount,
  };
}

function validateDemoRequest(body: ReturnType<typeof normalizeDemoRequest>) {
  if (body.honeypot) return "Demo talebiniz gönderilemedi. Lütfen bilgileri kontrol edip tekrar deneyin.";
  if (!body.fullName || !body.email || !body.businessName || !body.storeCount || !body.consent) {
    return "Demo talebiniz gönderilemedi. Lütfen bilgileri kontrol edip tekrar deneyin.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return "Demo talebiniz gönderilemedi. Lütfen bilgileri kontrol edip tekrar deneyin.";
  if (!Number.isInteger(body.storeCount) || body.storeCount < 1 || body.storeCount > 10000) {
    return "Demo talebiniz gönderilemedi. Lütfen bilgileri kontrol edip tekrar deneyin.";
  }
  return null;
}

function mainAppUrl() {
  return process.env.MAIN_APP_URL || "https://shelfiolabs.com/";
}

function publicSiteBaseUrl() {
  return (process.env.PUBLIC_SITE_URL || "https://getshelfio.com").replace(/\/+$/, "");
}

function dataExportCallbackUrl() {
  return `${publicSiteBaseUrl()}/api/internal/data-exports/callback`;
}

function createDataExportDownloadUrl(rawToken: string) {
  return `${publicSiteBaseUrl()}/api/account/data-exports/download?token=${encodeURIComponent(rawToken)}`;
}

function formatDataExportExpiry(value: string | null | undefined) {
  if (!value) return "24 saat";
  return new Date(value).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });
}

function readControlSecret(request: IncomingMessage) {
  const headerSecret = request.headers["x-shelfio-control-secret"];
  if (typeof headerSecret === "string") return headerSecret;
  return request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? null;
}

function assertInternalSecret(request: IncomingMessage, response: ServerResponse) {
  if (!isControlSecretConfigured()) {
    sendEnvelope(response, 503, null, "İşlem şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.", "control_secret_not_configured", false);
    return false;
  }
  if (verifyControlSecret(readControlSecret(request))) return true;
  sendEnvelope(response, 401, null, "Yetkisiz control API isteği.", "unauthorized", false);
  return false;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

type DataExportView = Awaited<ReturnType<typeof listDataExportsForTenant>>[number];

async function sendDataExportReadyNotification(exportRequest: DataExportView, rawDownloadToken: string) {
  if (!isEmailConfigured() || !exportRequest.customerEmail) return exportRequest;
  try {
    await sendDataExportReadyMail({
      customerEmail: exportRequest.customerEmail,
      customerName: exportRequest.customerName,
      downloadUrl: createDataExportDownloadUrl(rawDownloadToken),
      expiresAt: formatDataExportExpiry(exportRequest.downloadExpiresAt),
      storeName: exportRequest.storeName,
    });
    return await markDataExportMailSent(exportRequest.id) ?? exportRequest;
  } catch (error) {
    console.error("Data export ready mail failed:", error);
    await markDataExportMailFailed(exportRequest.id);
    return exportRequest;
  }
}

async function finalizeReadyExport(input: {
  downloadExpiresAt?: string | null;
  providerDownloadToken: string;
  providerJobId?: string | null;
  requestId?: string | null;
}) {
  const ready = await finalizeDataExportReady(input);
  if (!ready.ok) return null;
  return sendDataExportReadyNotification(ready.request, ready.rawDownloadToken);
}

async function refreshDataExportStatus(exportRequest: DataExportView) {
  if (!exportRequest.providerJobId || !["pending", "processing"].includes(exportRequest.status)) return exportRequest;
  const status = await getLabsExportStatus(exportRequest.providerJobId);
  if (!status.ok) return exportRequest;
  if (status.status === "ready") {
    if (!status.downloadToken || status.downloadToken === "download") {
      return await finalizeDataExportFailed({
        code: "provider_download_token_missing",
        message: "İndirme bağlantısı hazırlanamadı. Lütfen tekrar talep oluşturun.",
        providerJobId: exportRequest.providerJobId,
        requestId: exportRequest.id,
      }) ?? exportRequest;
    }
    return await finalizeReadyExport({
      downloadExpiresAt: status.downloadExpiresAt,
      providerDownloadToken: status.downloadToken,
      providerJobId: exportRequest.providerJobId,
      requestId: exportRequest.id,
    }) ?? exportRequest;
  }
  if (status.status === "failed" || status.status === "expired") {
    return await finalizeDataExportFailed({
      code: `provider_${status.status}`,
      message: status.status === "expired" ? "Export linkinin suresi doldu." : "Export hazirlanamadi.",
      providerJobId: exportRequest.providerJobId,
      requestId: exportRequest.id,
    }) ?? exportRequest;
  }
  return exportRequest;
}

async function refreshDataExportList<T extends DataExportView>(items: T[]) {
  return Promise.all(items.map((item) => refreshDataExportStatus(item)));
}

export async function routeRequest(request: IncomingMessage, response: ServerResponse) {
  setCorsHeaders(request, response);
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const pathname = requestUrl.pathname;

  try {
    if (request.method === "GET" && pathname === "/health") {
      sendJson(response, 200, getHealth());
      return;
    }

    if (!requireDatabase(response)) return;

    if (request.method === "GET" && pathname === "/api/control/health") {
      if (!assertInternalSecret(request, response)) return;
      sendEnvelope(response, 200, {
        ok: true,
        service: "getshelfio-control",
        mainAppUrl: mainAppUrl(),
      }, "Control API çalışıyor.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/internal/data-exports/callback") {
      if (!assertInternalSecret(request, response)) return;
      const body = await readJsonBody<{
        downloadExpiresAt?: string;
        downloadToken?: string;
        errorCode?: string;
        errorMessage?: string;
        providerJobId?: string;
        requestId?: string;
        status?: string;
      }>(request);
      const status = String(body?.status || "").toLowerCase();
      const providerJobId = String(body?.providerJobId || "").trim();
      const requestId = String(body?.requestId || "").trim();

      if (status === "ready") {
        const rawDownloadToken = String(body?.downloadToken || "").trim();
        const downloadToken = extractTokenFromUrl(rawDownloadToken);
        if (!downloadToken || downloadToken === "download") {
          const exportRequest = await finalizeDataExportFailed({
            code: "provider_download_token_missing",
            message: "İndirme bağlantısı hazırlanamadı. Lütfen tekrar talep oluşturun.",
            providerJobId: providerJobId || null,
            requestId: requestId || null,
          });
          sendEnvelope(response, 200, { ok: false, request: exportRequest }, "Export callback islendi (missing provider token).");
          return;
        }
        if (!providerJobId && !requestId) {
          sendEnvelope(response, 400, null, "Export callback bilgileri eksik.", "invalid_export_callback", false);
          return;
        }
        const exportRequest = await finalizeReadyExport({
          downloadExpiresAt: body?.downloadExpiresAt || null,
          providerDownloadToken: downloadToken,
          providerJobId: providerJobId || null,
          requestId: requestId || null,
        });
        sendEnvelope(response, 200, { ok: Boolean(exportRequest), request: exportRequest }, "Export callback islendi.");
        return;
      }

      if (status === "failed" || status === "expired") {
        const exportRequest = await finalizeDataExportFailed({
          code: body?.errorCode || `provider_${status}`,
          message: body?.errorMessage || (status === "expired" ? "Export linkinin suresi doldu." : "Export hazirlanamadi."),
          providerJobId: providerJobId || null,
          requestId: requestId || null,
        });
        sendEnvelope(response, 200, { ok: Boolean(exportRequest), request: exportRequest }, "Export callback islendi.");
        return;
      }

      if ((status === "pending" || status === "processing") && requestId && providerJobId) {
        const exportRequest = await markDataExportProcessing(requestId, providerJobId);
        sendEnvelope(response, 200, { ok: Boolean(exportRequest), request: exportRequest }, "Export callback islendi.");
        return;
      }

      sendEnvelope(response, 400, null, "Export callback durumu desteklenmiyor.", "invalid_export_callback", false);
      return;
    }

    if (request.method === "POST" && pathname === "/api/auth/login") {
      const body = await readJsonBody<{ email?: string; password?: string; role?: UserRole }>(request);
      const user = await findUserByEmail(body?.email ?? "");
      if (!user || user.status !== "active" || (body?.role && user.role !== body.role) || !(await verifyPassword(String(body?.password ?? ""), user.password_hash))) {
        sendEnvelope(response, 401, null, "E-posta, Şifre veya giriş tipi hatalı.", "invalid_credentials", false);
        return;
      }
      await updateLastLogin(user.id);
      if (user.role === "customer" && user.tenant_id) {
        await autoActivatePendingDemoLicenses(user.email, user.tenant_id).catch((err) => console.error("Auto activate demo license failed:", err));
      }
      const sessionUser = toSessionUser(user);
      setSessionCookie(response, sessionUser);
      sendEnvelope(response, 200, sessionUser, "Oturum açıldı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/auth/register") {
      const body = await readJsonBody<{ businessName?: string; email?: string; fullName?: string; password?: string; phone?: string }>(request);
      if (!body?.email || !body.password) {
        sendEnvelope(response, 400, null, "Kayıt bilgileri eksik veya geçersiz.", "invalid_register_payload", false);
        return;
      }
      if (body.password.length < 8) {
        sendEnvelope(response, 400, null, "Şifre en az 8 karakter olmalıdır.", "password_too_short", false);
        return;
      }
      if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(body.password) || !/\d/.test(body.password)) {
        sendEnvelope(response, 400, null, "Şifre en az bir harf ve bir rakam içermelidir.", "password_weak", false);
        return;
      }
      const existing = await findUserByEmail(body.email);
      if (existing) {
        sendEnvelope(response, 409, null, "Bu e-posta adresiyle kayıtlı bir hesap var.", "email_exists", false);
        return;
      }
      const user = await registerCustomer({ businessName: body.businessName, email: body.email, fullName: body.fullName, password: body.password, phone: body.phone });
      const sessionUser = toSessionUser(user);
      setSessionCookie(response, sessionUser);

      if (isEmailConfigured()) {
        await sendCustomerWelcomeMail({
          email: user.email,
          customerName: user.full_name,
        }).catch((err) => console.error("Welcome email send failed:", err));
      }

      sendEnvelope(response, 200, sessionUser, "Müşteri hesabı oluşturuldu.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/auth/logout") {
      clearSessionCookie(response);
      sendEnvelope(response, 200, { ok: true }, "Oturum kapatıldı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/auth/change-password") {
      const session = requireSession(request, response);
      if (!session) return;
      const body = await readJsonBody<{ currentPassword?: string; newPassword?: string }>(request);
      const currentPassword = String(body?.currentPassword ?? "");
      const newPassword = String(body?.newPassword ?? "");

      if (!currentPassword || !newPassword) {
        sendEnvelope(response, 400, null, "Mevcut şifre ve yeni şifre alanları zorunludur.", "missing_fields", false);
        return;
      }

      if (newPassword.length < 8) {
        sendEnvelope(response, 400, null, "Yeni şifre en az 8 karakter olmalıdır.", "password_too_short", false);
        return;
      }

      const user = await findUserById(session.user.id);
      if (!user) {
        sendEnvelope(response, 404, null, "Kullanıcı bulunamadı.", "user_not_found", false);
        return;
      }

      const passwordOk = await verifyPassword(currentPassword, user.password_hash);
      if (!passwordOk) {
        sendEnvelope(response, 400, null, "Mevcut şifreniz hatalı.", "invalid_current_password", false);
        return;
      }

      const newHash = await hashPassword(newPassword);
      await query("UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1", [session.user.id, newHash]);
      sendEnvelope(response, 200, { ok: true }, "Şifreniz başarıyla değiştirildi.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/auth/me") {
      const session = requireSession(request, response);
      if (!session) return;
      const user = await findUserById(session.user.id);
      if (!user) {
        clearSessionCookie(response);
        sendEnvelope(response, 401, null, "Oturum bulunamadı.", "unauthorized", false);
        return;
      }
      sendEnvelope(response, 200, toSessionUser(user), "Aktif oturum bulundu.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/auth/forgot-password") {
      const body = await readJsonBody<{ email?: string }>(request);
      const email = normalizeEmail(body?.email ?? "");
      const responseMessage = "Eğer e-posta adresiniz sistemde kayıtlıysa Şifre sıfırlama bağlantısı gönderilmiştir.";
      const user = email ? await findUserByEmail(email) : null;
      if (user && isEmailConfigured()) {
        const token = createRawToken();
        await createPasswordReset(user.id, token, getClientIp(request));
        const resetUrl = `${process.env.PUBLIC_SITE_URL || "http://localhost:3007"}/sifre-sifirla?token=${encodeURIComponent(token)}`;
        await sendPasswordResetMail({ email, resetUrl }).catch(() => undefined);
      }
      sendEnvelope(response, 200, { received: true }, responseMessage);
      return;
    }

    if (request.method === "POST" && pathname === "/api/auth/reset-password") {
      try {
        const body = await readJsonBody<{ password?: string; token?: string }>(request);
        if (!body?.token) {
          sendEnvelope(response, 400, null, "Şifre sıfırlama bağlantısı eksik.", "missing_reset_token", false);
          return;
        }
        if (!body.password) {
          sendEnvelope(response, 400, null, "Yeni şifre girin.", "missing_password", false);
          return;
        }
        if (body.password.length < 8 || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(body.password) || !/\d/.test(body.password)) {
          sendEnvelope(response, 400, null, "Şifre en az 8 karakter olmalı ve en az bir harf ile bir rakam içermelidir.", "weak_password", false);
          return;
        }
        const success = await resetPasswordWithToken(body.token, body.password);
        if (!success) {
          sendEnvelope(response, 400, null, "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.", "invalid_reset_token", false);
          return;
        }
        sendEnvelope(response, 200, { updated: true }, "Şifreniz güncellendi. Yeni Şifrenizle giriş yapabilirsiniz.");
        return;
      } catch (err) {
        console.error("Internal server error during password reset:", err);
        sendEnvelope(response, 500, null, "Bir sunucu hatası oluştu.", "server_error", false);
        return;
      }
    }

    if (request.method === "POST" && pathname === "/api/panel-access/start") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      if (!requireCustomerTenant(session, response)) return;
      const result = await createPanelAccessForUser(session.user, getDbClientIp(request));
      if (!result) {
        const hasUnclaimed = await hasUnclaimedLicense(session.user.email);
        if (hasUnclaimed) {
          sendEnvelope(response, 403, null, "Lisansınız bulunuyor ancak henüz aktive edilmemiş. Lütfen önce lisansınızı aktive edin.", "license_claim_required", false);
        } else {
          sendEnvelope(response, 403, null, "Panel erişimi için aktif lisans gereklidir.", "active_license_required", false);
        }
        return;
      }
      sendEnvelope(response, 200, result, "Panel geçişi hazır.");
      return;
    }
    if (request.method === "POST" && pathname === "/api/demo-requests") {
      if (isRateLimited(getClientIp(request))) {
        sendEnvelope(response, 429, null, "Demo talebiniz gönderilemedi. Lütfen daha sonra tekrar deneyin.", "rate_limited", false);
        return;
      }
      const body = normalizeDemoRequest(await readJsonBody<DemoRequestBody>(request));
      const validationMessage = validateDemoRequest(body);
      if (validationMessage) {
        sendEnvelope(response, 400, null, validationMessage, "invalid_demo_request", false);
        return;
      }
      const source = `${process.env.PUBLIC_SITE_URL || "https://getshelfio.com"}/demo`;
      try {
        await saveDemoRequest({ ...body, businessType: body.businessType || undefined, message: body.message || undefined, phone: body.phone || undefined, source });
      } catch {
        sendEnvelope(response, 502, null, "Demo talebiniz şu anda alınamadı. Lütfen daha sonra tekrar deneyin.", "demo_request_failed", false);
        return;
      }
      if (isEmailConfigured()) {
        const mailPayload = { ...body, businessType: body.businessType || undefined, message: body.message || undefined, phone: body.phone || undefined, source, submittedAt: new Date().toISOString() };
        await Promise.allSettled([
          sendDemoRequestMail(mailPayload),
          sendDemoRequestReceiptMail(mailPayload),
        ]);
      }
      sendEnvelope(response, 200, { received: true, referenceId: createReference("demo") }, "Demo talebiniz alındı. Ekibimiz sizinle iletişime geçecektir.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/license/validate") {
      const body = await readJsonBody<{ licenseKey?: string; ownerEmail?: string }>(request);
      sendEnvelope(response, 200, await validateLicense(body?.licenseKey ?? "", body?.ownerEmail ?? ""), "Lisans kontrolü tamamlandı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/license/activate") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      const body = await readJsonBody<{
        licenseKey?: string;
        license?: { licenseKey?: string; ownerEmail?: string };
      }>(request);
      const result = await claimLicenseForAccount({
        email: session.user.email,
        licenseKey: body?.licenseKey ?? body?.license?.licenseKey ?? "",
        tenantId,
      });
      if (!result.ok) {
        sendEnvelope(response, 400, { ok: false, status: "failed", message: accountLicenseErrorMessage(result.code), license: null, redirectUrl: "/hesap/aktivasyon" }, accountLicenseErrorMessage(result.code), result.code, false);
        return;
      }
      sendEnvelope(response, 200, { ok: true, status: "activated", message: "Lisans başarıyla hesabınıza bağlandı.", license: result.license, redirectUrl: "/hesap/lisanslar" }, "Lisans başarıyla hesabınıza bağlandı.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/license/current") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      sendEnvelope(response, 200, await getCurrentLicense(tenantId), "Lisans alındı.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/account/me") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      sendEnvelope(response, 200, await getAccountOverview(tenantId), "Hesap özeti alındı.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/account/licenses") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      sendEnvelope(response, 200, await listLicensesForAccount(tenantId, session.user.email), "Lisanslar alındı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/account/licenses/activate") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      const body = await readJsonBody<{ licenseKey?: string }>(request);
      const result = await claimLicenseForAccount({
        email: session.user.email,
        licenseKey: String(body?.licenseKey ?? ""),
        tenantId,
      });
      if (!result.ok) {
        sendEnvelope(response, 400, null, accountLicenseErrorMessage(result.code), result.code, false);
        return;
      }
      sendEnvelope(response, 200, { license: result.license }, "Lisans başarıyla hesabınıza bağlandı.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/account/billing") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      sendEnvelope(response, 200, await getBillingSummary(tenantId), "Faturalandırma özeti alındı.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/account/invoices") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      sendEnvelope(response, 200, await listInvoices(tenantId), "Faturalar alındı.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/account/stores") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      sendEnvelope(response, 200, await listStores(tenantId), "Mağazalar alındı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/account/stores") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;

      sendEnvelope(
        response,
        400,
        null,
        "Mağaza oluşturma işlemi ana sistem üzerinden gerçekleştirilmelidir.",
        "getshelfio_does_not_create_local_stores",
        false
      );
      return;
    }

    if (request.method === "GET" && pathname === "/api/account/store-license-requests") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      sendEnvelope(response, 200, await getStoreLicenseRequests(tenantId), "Talepler alındı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/account/store-license-requests") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      const body = await readJsonBody<{ requestedStoreName?: string; note?: string }>(request);
      try {
        const req = await createStoreLicenseRequest(tenantId, session.user.id, body?.requestedStoreName ?? "", body?.note);

        if (isEmailConfigured()) {
          const activePlan = await getCurrentLicense(tenantId);
          await sendStoreLicenseRequestCreatedMailToAdmin({
            customerEmail: session.user.email,
            customerName: session.user.name || "Değerli Müşterimiz",
            requestedStoreName: body?.requestedStoreName ?? "",
            planName: activePlan?.plan?.planName || "Aktif Plan",
            panelLink: `${process.env.PUBLIC_SITE_URL || "https://getshelfio.com"}/admin/magaza-talepleri`,
            submittedAt: new Date().toISOString(),
          }).catch((err) => console.error("Admin notification mail failed:", err));
        }

        sendEnvelope(response, 200, req, "Mağaza lisansı talebi oluşturuldu.");
      } catch (err) {
        sendEnvelope(response, 400, null, err instanceof Error ? err.message : "Talep oluşturulamadı.", "bad_request", false);
      }
      return;
    }

    const cancelStoreRequestMatch = pathname.match(/^\/api\/account\/store-license-requests\/([^/]+)\/cancel$/);
    if (cancelStoreRequestMatch && request.method === "PATCH") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      try {
        const req = await cancelStoreLicenseRequest(tenantId, cancelStoreRequestMatch[1], session.user.id);
        sendEnvelope(response, 200, req, "Talep iptal edildi.");
      } catch (err) {
        sendEnvelope(response, 400, null, err instanceof Error ? err.message : "Talep iptal edilemedi.", "bad_request", false);
      }
      return;
    }

    if (request.method === "GET" && pathname === "/api/account/store-licenses") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      sendEnvelope(response, 200, await getStoreLicenses(tenantId), "Mağaza lisansları alındı.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/account/data-exports/download") {
      const rawToken = String(requestUrl.searchParams.get("token") || "").trim();
      if (!rawToken) {
        sendEnvelope(response, 400, null, "Indirme linki gecersiz.", "invalid_download_token", false);
        return;
      }
      await expireOldDataExports();
      const download = await consumeDataExportDownloadToken(rawToken);
      if (!download) {
        sendEnvelope(response, 404, null, "Indirme linki gecersiz veya suresi dolmus.", "download_token_not_found", false);
        return;
      }
      if (!download.providerToken || download.providerToken === "download") {
        sendEnvelope(response, 400, null, "İndirme bağlantısı hazırlanamadı. Lütfen tekrar talep oluşturun.", "provider_download_token_missing", false);
        return;
      }
      response.writeHead(302, {
        "Cache-Control": "no-store",
        "Location": normalizeDownloadUrl(download.providerToken),
        "Referrer-Policy": "no-referrer",
      });
      response.end();
      return;
    }

    if (request.method === "GET" && pathname === "/api/account/data-exports") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      await expireOldDataExports();
      const exports = await refreshDataExportList(await listDataExportsForTenant(tenantId));
      sendEnvelope(response, 200, exports, "Veri talepleri alindi.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/account/data-exports") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      if (isRateLimited(`data-export:${tenantId}:${session.user.id}`)) {
        sendEnvelope(response, 429, null, "Kisa sure icinde cok fazla veri talebi olusturuldu.", "rate_limited", false);
        return;
      }

      const body = await readJsonBody<{ licenseId?: string; storeName?: string }>(request);
      const licenseId = String(body?.licenseId || "").trim();
      if (!isUuid(licenseId)) {
        sendEnvelope(response, 400, null, "Gecerli bir lisans secin.", "invalid_license_id", false);
        return;
      }

      const created = await createDataExportRequest({
        licenseId,
        requestedByEmail: session.user.email,
        requestedByUserId: session.user.id,
        storeName: body?.storeName,
        tenantId,
      });
      if (!created.ok) {
        sendEnvelope(response, 400, null, created.message, created.code, false);
        return;
      }

      const provider = await startLabsExport({
        ...created.providerPayload,
        callbackUrl: dataExportCallbackUrl(),
      });
      if (!provider.ok) {
        const failed = await markDataExportFailed(created.request.id, provider.code, provider.message);
        sendEnvelope(response, 503, failed ?? created.request, "Veri talebi su anda baslatilamadi. Lutfen daha sonra tekrar deneyin.", provider.code, false);
        return;
      }

      const exportRequest = await markDataExportProcessing(created.request.id, provider.jobId);
      sendEnvelope(response, 200, exportRequest ?? created.request, "Veri talebiniz alindi. Excel hazir oldugunda e-posta ile indirme linki gonderilecek.");
      return;
    }

    const accountDataExportMatch = pathname.match(/^\/api\/account\/data-exports\/([^/]+)$/);
    if (accountDataExportMatch && request.method === "GET") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      await expireOldDataExports();
      const exportRequest = await getDataExportForTenant(tenantId, accountDataExportMatch[1]);
      if (!exportRequest) {
        sendEnvelope(response, 404, null, "Veri talebi bulunamadi.", "data_export_not_found", false);
        return;
      }
      sendEnvelope(response, 200, await refreshDataExportStatus(exportRequest), "Veri talebi alindi.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/account/payment-method") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;

      const result = await query<any>(
        `SELECT card_holder, card_number_masked, card_expiry FROM tenants WHERE id = $1`,
        [tenantId]
      );
      const tenant = result.rows[0];
      if (!tenant || !tenant.card_number_masked) {
        sendEnvelope(response, 200, null, "Kayıtlı ödeme yöntemi bulunmuyor.");
        return;
      }

      sendEnvelope(response, 200, {
        holder: tenant.card_holder,
        number: tenant.card_number_masked,
        expiry: tenant.card_expiry,
      }, "Ödeme yöntemi alındı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/account/payment-method") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;

      const body = await readJsonBody<{ holder?: string; number?: string; expiry?: string }>(request);
      const holder = String(body?.holder ?? "").trim();
      const number = String(body?.number ?? "").replace(/\s+/g, "");
      const expiry = String(body?.expiry ?? "").trim();

      if (!holder || !number || !expiry) {
        sendEnvelope(response, 400, null, "Kart bilgileri eksik veya geçersiz.", "invalid_payload", false);
        return;
      }

      if (number.length < 15 || number.length > 16) {
        sendEnvelope(response, 400, null, "Lütfen geçerli bir kart numarası girin.", "invalid_card_number", false);
        return;
      }

      const masked = maskPaymentCardNumber(number);

      await query(
        `UPDATE tenants
         SET card_holder = $2,
             card_number_masked = $3,
             card_expiry = $4,
             updated_at = now()
         WHERE id = $1`,
        [tenantId, holder, masked, expiry]
      );

      sendEnvelope(response, 200, { holder, number: masked, expiry }, "Ödeme yöntemi başarıyla güncellendi.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/account/settings") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;

      const result = await query<any>(
        `SELECT legal_name, billing_email, billing_address FROM tenants WHERE id = $1`,
        [tenantId]
      );
      const tenant = result.rows[0];
      sendEnvelope(response, 200, {
        billingName: tenant?.legal_name || "",
        billingEmail: tenant?.billing_email || session.user.email,
        billingAddress: tenant?.billing_address || "",
      }, "Ayarlar alındı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/account/settings") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;

      const body = await readJsonBody<{ billingName?: string; billingEmail?: string; billingAddress?: string }>(request);
      const billingName = String(body?.billingName ?? "").trim();
      const billingEmail = normalizeEmail(String(body?.billingEmail ?? "").trim());
      const billingAddress = String(body?.billingAddress ?? "").trim();

      await query(
        `UPDATE tenants
         SET legal_name = $2,
             billing_email = $3,
             billing_address = $4,
             updated_at = now()
         WHERE id = $1`,
        [tenantId, billingName, billingEmail, billingAddress]
      );

      sendEnvelope(response, 200, { billingName, billingEmail, billingAddress }, "Ayarlar kaydedildi.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/checkout/session") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      await ensureCorePlans();
      const body = await readJsonBody<{ planId?: string; plan?: string }>(request);
      const planId = normalizePlanSlug(body?.plan ?? body?.planId);
      const plan = await getPlanBySlug(planId);
      if (!plan || planId === "demo") {
        sendEnvelope(response, 400, null, "Plan bilgisi geçersiz.", "invalid_plan", false);
        return;
      }
      sendEnvelope(response, 200, {
        id: createReference("checkout"),
        plan: {
          planName: plan.name,
          priceLabel: `${Number(plan.price_cents) / 100} ${plan.currency} / ay`,
          storeLimit: plan.store_limit,
          userLimit: plan.user_limit,
        },
        planId,
        redirectUrl: `/odeme?plan=${planId}`,
      }, "Satın alma oturumu hazır.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/checkout/complete") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const body = await readJsonBody<{ billingEmail?: string; billingName?: string; cardName?: string; cardNumber?: string; checkoutReference?: string; cvc?: string; expMonth?: string; expYear?: string; plan?: string }>(request);
      const cardDigits = String(body?.cardNumber ?? "").replace(/\D/g, "");
      const expiryMonth = Number(String(body?.expMonth ?? "").trim());
      const expiryYear = String(body?.expYear ?? "").trim();
      const paymentOk =
        Boolean(body?.cardName?.trim()) &&
        cardDigits.length >= 8 &&
        /^\d{3,4}$/.test(String(body?.cvc ?? "").trim()) &&
        expiryMonth >= 1 &&
        expiryMonth <= 12 &&
        /^\d{2,4}$/.test(expiryYear) &&
        Boolean(body?.billingEmail?.trim()) &&
        Boolean(body?.billingName?.trim());
      const planSlug = normalizePlanSlug(body?.plan);
      if (!paymentOk || planSlug === "demo" || !(await getPlanBySlug(planSlug))) {
        sendEnvelope(response, 400, null, "Ödeme bilgileri doğrulanamadı. Lütfen alanları kontrol edin.", "checkout_validation_failed", false);
        return;
      }
      const checkout = await completeCheckout(session.user, planSlug, body?.checkoutReference, maskPaymentCardNumber(cardDigits), limitText(String(body?.cardName ?? "").trim(), 120));
      const { notification, ...checkoutResponse } = checkout;
      const mailSent = isEmailConfigured() && notification?.customerEmail
        ? await sendLicenseCreatedMail(notification).then(() => true).catch(() => false)
        : false;
      sendEnvelope(response, 200, { ...checkoutResponse, mailSent }, "Satın alım tamamlandı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/plan-quotes") {
      sendEnvelope(response, 200, { received: true, referenceId: createReference("quote") }, "Teklif talebiniz alındı.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/support-tickets") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      sendEnvelope(response, 200, await listSupportTickets(session.user), "Destek talepleri alındı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/support-tickets") {
      const session = getSession(request);
      const body = await readJsonBody<{ customerEmail?: string; customerName?: string; fullName?: string; message?: string; module?: string; name?: string; priority?: string; subject?: string }>(request);
      const subject = limitText(String(body?.subject ?? "").trim(), 140);
      const message = limitText(String(body?.message ?? "").trim(), 2000);
      const priority = limitText(String(body?.priority ?? "Orta").trim(), 40);

      if (session?.user.role === "customer") {
        const tenantId = requireCustomerTenant(session, response);
        if (!tenantId) return;
        if (!subject || !message) {
          sendEnvelope(response, 400, null, "Talep bilgileri eksik. Lütfen alanları kontrol edin.", "invalid_support_request", false);
          return;
        }
        const id = await createSupportTicket(session.user, { message, module: body?.module, priority, subject });
        if (isEmailConfigured()) {
          const submittedAt = new Date().toISOString();
          const customerEmail = session.user.email;
          const customerName = session.user.name || "Değerli Müşterimiz";
          await sendSupportRequestReceiptMail({ customerEmail, customerName, ticketId: id, subject, message, submittedAt }).catch(() => undefined);
        }
        sendEnvelope(response, 200, { received: true, referenceId: id, ticket: await getSupportTicket(id, session.user) }, "Destek talebiniz alındı.");
        return;
      }

      if (isRateLimited(`support:${getClientIp(request)}`)) {
        sendEnvelope(response, 429, null, "Destek talebiniz alındı. Ekibimiz e-posta adresiniz üzerinden dönüş yapacaktır.", "rate_limited", false);
        return;
      }
      const customerEmail = normalizeEmail(String(body?.customerEmail ?? ""));
      const customerName = limitText(String(body?.customerName ?? body?.fullName ?? body?.name ?? "").trim(), 120);
      if (!customerName || !customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || !subject || message.length < 10) {
        sendEnvelope(response, 400, null, "Talep bilgileri eksik. Lütfen alanları kontrol edin.", "invalid_support_request", false);
        return;
      }
      const id = await createPublicSupportTicket({ customerEmail, customerName, message, priority, subject });
      if (isEmailConfigured()) {
        const submittedAt = new Date().toISOString();
        await Promise.allSettled([
          sendSupportRequestMail({ customerEmail, customerName, message, source: `${process.env.PUBLIC_SITE_URL || "https://getshelfio.com"}/destek`, subject, submittedAt }).catch(() => undefined),
          sendSupportRequestReceiptMail({ customerEmail, customerName, ticketId: id, subject, message, submittedAt }).catch(() => undefined),
        ]);
      }
      sendEnvelope(response, 200, { received: true, referenceId: id }, "Destek talebiniz alındı. Ekibimiz e-posta adresiniz üzerinden dönüş yapacaktır.");
      return;
    }
    const supportDetailMatch = pathname.match(/^\/api\/support-tickets\/([^/]+)$/);
    if (supportDetailMatch && request.method === "GET") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const ticket = await getSupportTicket(supportDetailMatch[1], session.user);
      if (!ticket) {
        sendEnvelope(response, 404, null, "Destek talebi bulunamadı.", "support_not_found", false);
        return;
      }
      sendEnvelope(response, 200, ticket, "Destek talebi alındı.");
      return;
    }

    const supportMessageMatch = pathname.match(/^\/api\/support-tickets\/([^/]+)\/messages$/);
    if (supportMessageMatch && request.method === "POST") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const body = await readJsonBody<{ message?: string }>(request);
      const ticket = await addSupportMessage(supportMessageMatch[1], session.user, limitText(String(body?.message ?? "").trim(), 2000));
      if (!ticket) {
        sendEnvelope(response, 400, null, "Mesaj gönderilemedi. Lütfen tekrar deneyin.", "invalid_support_message", false);
        return;
      }
      sendEnvelope(response, 200, ticket, "Mesajınız gönderildi.");
      return;
    }

    const supportStatusMatch = pathname.match(/^\/api\/support-tickets\/([^/]+)\/status$/);
    if (supportStatusMatch && request.method === "PATCH") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const body = await readJsonBody<{ status?: string }>(request);
      const ticket = await updateSupportStatus(supportStatusMatch[1], session.user, body?.status ?? "");
      if (!ticket) {
        sendEnvelope(response, 400, null, "Durum güncellenemedi.", "invalid_support_status", false);
        return;
      }
      sendEnvelope(response, 200, ticket, "Durum güncellendi.");
      return;
    }

    const publicSupportDetailMatch = pathname.match(/^\/api\/public\/support-tickets\/([^/]+)$/);
    if (publicSupportDetailMatch && request.method === "GET") {
      const token = requestUrl.searchParams.get("token") ?? "";
      const ticketId = publicSupportDetailMatch[1];
      if (!token || !verifySupportToken(ticketId, token)) {
        sendEnvelope(response, 401, null, "Geçersiz veya süresi dolmuş bağlantı.", "invalid_token", false);
        return;
      }
      const ticket = await getSupportTicket(ticketId, { id: "public_reply", role: "admin" });
      if (!ticket) {
        sendEnvelope(response, 404, null, "Destek talebi bulunamadı.", "support_not_found", false);
        return;
      }
      sendEnvelope(response, 200, ticket, "Destek talebi alındı.");
      return;
    }

    const publicSupportMessageMatch = pathname.match(/^\/api\/public\/support-tickets\/([^/]+)\/messages$/);
    if (publicSupportMessageMatch && request.method === "POST") {
      const token = requestUrl.searchParams.get("token") ?? "";
      const ticketId = publicSupportMessageMatch[1];
      if (!token || !verifySupportToken(ticketId, token)) {
        sendEnvelope(response, 401, null, "Geçersiz veya süresi dolmuş bağlantı.", "invalid_token", false);
        return;
      }
      const body = await readJsonBody<{ message?: string }>(request);
      const messageText = limitText(String(body?.message ?? "").trim(), 2000);
      if (!messageText) {
        sendEnvelope(response, 400, null, "Mesaj boş olamaz.", "empty_message", false);
        return;
      }
      const ticket = await addSupportMessage(ticketId, { id: "", role: "customer" }, messageText);
      if (!ticket) {
        sendEnvelope(response, 400, null, "Mesaj gönderilemedi.", "invalid_support_message", false);
        return;
      }
      sendEnvelope(response, 200, ticket, "Yanıtınız gönderildi.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/admin/stats") {
      if (!requireSession(request, response, "admin")) return;
      sendEnvelope(response, 200, await adminStats(), "Admin istatistikleri alındı.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/admin/licenses") {
      if (!requireSession(request, response, "admin")) return;
      sendEnvelope(response, 200, await adminLicenses(), "Admin lisans listesi alındı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/admin/licenses") {
      const session = requireSession(request, response, "admin");
      if (!session) return;
      const body = await readJsonBody<{ businessName?: string; customerEmail?: string; customerName?: string; licenseType?: string; planName?: string; storeLimit?: number; userLimit?: number; validity?: string }>(request);
      const customerEmail = normalizeEmail(body?.customerEmail ?? "");
      const customerName = limitText(String(body?.customerName ?? "").trim(), 120);
      const planName = limitText(String(body?.planName ?? "").trim(), 120);
      if (!customerName || !planName || !customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        sendEnvelope(response, 400, null, "Müşteri adı, plan adı ve geçerli e-posta adresi zorunludur.", "invalid_license_payload", false);
        return;
      }
      const license = await createAdminLicense(session.user.id, {
        ...body,
        businessName: body?.businessName?.trim() || customerName,
        customerEmail,
        customerName,
        planName,
        validity: body?.validity,
      });
      let resetUrl: string | null = null;
      if (license.isNewCustomer && license.resetToken) {
        resetUrl = `${process.env.PUBLIC_SITE_URL || "https://getshelfio.com"}/sifre-sifirla?token=${encodeURIComponent(license.resetToken)}`;
      }
      const mailSent = isEmailConfigured()
        ? await sendLicenseCreatedMail({
          customerEmail: license.customerEmail || "",
          expiresAt: license.expiresAt,
          licenseKey: license.fullKey,
          licenseType: license.licenseType,
          maskedKey: license.maskedKey,
          planName: license.planName,
          isNewCustomer: license.isNewCustomer,
          resetUrl,
        }).then(() => true).catch(() => false)
        : false;
      sendEnvelope(response, 200, { ...license, mailSent }, mailSent ? "Lisans oluşturuldu ve e-posta bildirimi gönderildi." : "Lisans oluşturuldu, e-posta bildirimi gönderilemedi.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/admin/customers") {
      const session = requireSession(request, response, "admin");
      if (!session) return;

      const body = await readJsonBody<{
        fullName?: string;
        email?: string;
        phone?: string;
        businessName?: string;
        demoRequestId?: string;
        note?: string;
      }>(request);

      const fullName = limitText(String(body?.fullName ?? "").trim(), 120);
      const email = normalizeEmail(String(body?.email ?? ""));
      const phone = limitText(String(body?.phone ?? "").trim(), 40);
      const businessName = limitText(String(body?.businessName ?? "").trim(), 160);
      const demoRequestId = body?.demoRequestId ? String(body.demoRequestId).trim() : undefined;
      const note = body?.note ? limitText(String(body.note).trim(), 1000) : undefined;

      if (!fullName || !email || !businessName) {
        sendEnvelope(response, 400, null, "Ad soyad, e-posta ve işletme adı zorunludur.", "invalid_payload", false);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        sendEnvelope(response, 400, null, "Geçerli bir e-posta adresi girin.", "invalid_email", false);
        return;
      }

      const existing = await findUserByEmail(email);
      if (existing) {
        sendEnvelope(response, 409, null, "Bu e-posta adresiyle kayıtlı bir hesap zaten var.", "email_exists", false);
        return;
      }

      try {
        const user = await createCustomerAccountByAdmin({
          fullName,
          email,
          phone: phone || undefined,
          businessName,
          demoRequestId,
          note,
        });

        if (!user) {
          sendEnvelope(response, 500, null, "Müşteri hesabı oluşturulamadı.", "database_error", false);
          return;
        }

        let mailSent = false;
        if (isEmailConfigured()) {
          const token = createRawToken();
          await createPasswordReset(user.id, token, getClientIp(request));
          const resetUrl = `${process.env.PUBLIC_SITE_URL || "https://getshelfio.com"}/sifre-sifirla?token=${encodeURIComponent(token)}`;

          await sendFirstPasswordMail({
            email,
            businessName,
            resetUrl,
          }).then(() => {
            mailSent = true;
          }).catch((err) => {
            console.error("Manual first password mail failed:", err);
          });
        }

        sendEnvelope(response, 200, {
          id: user.id,
          name: user.full_name,
          email: user.email,
          planName: "Aktif plan yok",
          subscriptionStatus: "inactive",
          storeCount: 0,
          mailSent,
        }, mailSent ? "Müşteri oluşturuldu ve şifre belirleme e-postası gönderildi." : "Müşteri oluşturuldu, e-posta gönderilemedi.");
      } catch (error) {
        console.error("Create customer account by admin error:", error);
        sendEnvelope(response, 500, null, "Müşteri oluşturulurken bir hata oluştu.", "create_customer_failed", false);
      }
      return;
    }

    if (request.method === "POST" && pathname === "/api/admin/send-mail") {
      const session = requireSession(request, response, "admin");
      if (!session) return;

      const body = await readJsonBody<{
        email?: string;
        subject?: string;
        message?: string;
      }>(request);

      const email = normalizeEmail(String(body?.email ?? ""));
      const subject = limitText(String(body?.subject ?? "").trim(), 200);
      const message = limitText(String(body?.message ?? "").trim(), 4000);

      if (!email || !subject || !message) {
        sendEnvelope(response, 400, null, "Alıcı e-posta, konu ve mesaj alanları zorunludur.", "invalid_payload", false);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        sendEnvelope(response, 400, null, "Geçerli bir alıcı e-posta adresi girin.", "invalid_email", false);
        return;
      }

      if (!isEmailConfigured()) {
        sendEnvelope(response, 503, null, "E-posta servisi yapılandırılmamış.", "email_service_disabled", false);
        return;
      }

      let mailStatus = "success";
      let errorMessage: string | null = null;

      try {
        await sendAdminDirectMail({
          email,
          subject,
          message,
        });
      } catch (error: unknown) {
        mailStatus = "failed";
        errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Admin direct mail send failed:", error);
      }

      try {
        await query(
          `INSERT INTO sent_emails (id, recipient, subject, message, status, error_message, sent_at)
           VALUES ($1, $2, $3, $4, $5, $6, now())`,
          [crypto.randomUUID(), email, subject, message, mailStatus, errorMessage]
        );
      } catch (dbErr) {
        console.error("Failed to log sent email in DB:", dbErr);
      }

      if (mailStatus === "success") {
        sendEnvelope(response, 200, { sent: true }, "E-posta başarıyla gönderildi.");
      } else {
        sendEnvelope(response, 500, null, `E-posta gönderilirken bir hata oluştu: ${errorMessage}`, "email_send_failed", false);
      }
      return;
    }

    if (request.method === "GET" && pathname === "/api/admin/sent-mail-logs") {
      const session = requireSession(request, response, "admin");
      if (!session) return;
      try {
        const result = await query<{ error_message: string | null; id: string; message: string; recipient: string; sent_at: Date | string; status: string; subject: string }>(
          `SELECT id, recipient, subject, message, status, error_message, sent_at
           FROM sent_emails
           ORDER BY sent_at DESC
           LIMIT 100`
        );
        sendEnvelope(response, 200, result.rows.map((row) => ({
          id: row.id,
          recipient: row.recipient,
          subject: row.subject,
          message: row.message,
          status: row.status,
          errorMessage: row.error_message,
          sentAt: row.sent_at,
        })), "Gönderilen mailler başarıyla listelendi.");
      } catch (error) {
        console.error("List sent mail logs error:", error);
        sendEnvelope(response, 500, null, "Gönderilen mailler listelenirken hata oluştu.", "list_logs_failed", false);
      }
      return;
    }


    if (request.method === "GET" && pathname === "/api/admin/demo-requests") {
      if (!requireSession(request, response, "admin")) return;
      sendEnvelope(response, 200, await listDemoRequests(), "Admin demo talepleri alındı.");
      return;
    }

    const adminDemoActionMatch = pathname.match(/^\/api\/admin\/demo-requests\/([^/]+)\/(approve|reject)$/);
    if (adminDemoActionMatch && request.method === "POST") {
      const session = requireSession(request, response, "admin");
      if (!session) return;
      const demoRequestId = adminDemoActionMatch[1] ?? "";
      if (adminDemoActionMatch[2] === "approve") {
        const result = await approveDemoRequest(session.user.id, demoRequestId);
        if (!result.ok) {
          sendEnvelope(response, 400, null, result.message ?? "Demo talebi işlenemedi.", result.code ?? "demo_request_failed", false);
          return;
        }
        if (!result.license) {
          sendEnvelope(response, 400, null, "Demo lisansı oluşturulamadı.", "demo_license_failed", false);
          return;
        }
        const license = result.license;
        let resetUrl: string | null = null;
        try {
          const user = await findUserByEmail(license.customerEmail);
          if (user) {
            const token = createRawToken();
            await createPasswordReset(user.id, token, getClientIp(request));
            resetUrl = `${process.env.PUBLIC_SITE_URL || "https://getshelfio.com"}/sifre-sifirla?token=${encodeURIComponent(token)}`;
          }
        } catch (err) {
          console.error("Failed to generate password reset token on demo approve:", err);
        }

        const mailSent = isEmailConfigured()
          ? await sendLicenseCreatedMail({
            customerEmail: license.customerEmail,
            expiresAt: license.expiresAt,
            licenseKey: license.fullKey,
            licenseType: license.licenseType,
            maskedKey: license.maskedKey,
            planName: license.planName,
            resetUrl,
            referenceId: license.referenceId,
          }).then(() => true).catch(() => false)
          : false;
        sendEnvelope(response, 200, { ...license, mailSent }, mailSent ? "Demo onaylandı ve lisans e-postası gönderildi." : "Demo onaylandı, e-posta gönderilemedi.");
        return;
      }
      const body = await readJsonBody<{ reason?: string }>(request);
      const result = await rejectDemoRequest(session.user.id, demoRequestId, limitText(String(body?.reason ?? "").trim(), 400));
      if (!result.ok) {
        sendEnvelope(response, 400, null, result.message ?? "Demo talebi işlenemedi.", result.code ?? "demo_request_failed", false);
        return;
      }
      if (!result.demo) {
        sendEnvelope(response, 400, null, "Demo talebi reddedilemedi.", "demo_reject_failed", false);
        return;
      }
      const mailSent = isEmailConfigured()
        ? await sendDemoRejectedMail(result.demo).then(() => true).catch(() => false)
        : false;
      sendEnvelope(response, 200, { ok: true, mailSent }, mailSent ? "Demo talebi reddedildi ve e-posta gönderildi." : "Demo talebi reddedildi.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/admin/support-tickets") {
      const session = requireSession(request, response, "admin");
      if (!session) return;
      sendEnvelope(response, 200, await listSupportTickets(session.user), "Admin destek talepleri alındı.");
      return;
    }

    const adminSupportDetailMatch = pathname.match(/^\/api\/admin\/support-tickets\/([^/]+)$/);
    if (adminSupportDetailMatch && request.method === "GET") {
      const session = requireSession(request, response, "admin");
      if (!session) return;
      const ticket = await getSupportTicket(adminSupportDetailMatch[1], session.user);
      if (!ticket) {
        sendEnvelope(response, 404, null, "Destek talebi bulunamadı.", "support_not_found", false);
        return;
      }
      sendEnvelope(response, 200, ticket, "Destek talebi alındı.");
      return;
    }

    const adminSupportMessageMatch = pathname.match(/^\/api\/admin\/support-tickets\/([^/]+)\/messages$/);
    if (adminSupportMessageMatch && request.method === "POST") {
      const session = requireSession(request, response, "admin");
      if (!session) return;
      const body = await readJsonBody<{ message?: string }>(request);
      const messageBody = limitText(String(body?.message ?? "").trim(), 2000);
      const ticket = await addSupportMessage(adminSupportMessageMatch[1], session.user, messageBody);
      if (!ticket) {
        sendEnvelope(response, 400, null, "Mesaj gönderilemedi. Lütfen tekrar deneyin.", "invalid_support_message", false);
        return;
      }

      // If this is a public ticket (no registered tenant), notify via email
      if (!ticket.tenantId && ticket.customerEmail && isEmailConfigured()) {
        const replyUrl = `${process.env.PUBLIC_SITE_URL || "https://getshelfio.com"}/destek/cevap?id=${ticket.id}&token=${generateSupportToken(ticket.id)}`;
        await sendAdminReplyMail({
          customerEmail: ticket.customerEmail,
          customerName: ticket.customerName || "Değerli Müşterimiz",
          ticketId: ticket.id,
          subject: ticket.subject,
          replySummary: messageBody,
          replyUrl,
          updatedAt: ticket.updatedAt,
        }).catch(() => undefined);
      }

      sendEnvelope(response, 200, ticket, "Yanıt gönderildi.");
      return;
    }

    const adminSupportStatusMatch = pathname.match(/^\/api\/admin\/support-tickets\/([^/]+)\/status$/);
    if (adminSupportStatusMatch && request.method === "PATCH") {
      const session = requireSession(request, response, "admin");
      if (!session) return;
      const body = await readJsonBody<{ status?: string }>(request);
      const ticket = await updateSupportStatus(adminSupportStatusMatch[1], session.user, body?.status ?? "");
      if (!ticket) {
        sendEnvelope(response, 400, null, "Durum güncellenemedi.", "invalid_support_status", false);
        return;
      }
      sendEnvelope(response, 200, ticket, "Durum güncellendi.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/admin/data-exports") {
      if (!requireSession(request, response, "admin")) return;
      await expireOldDataExports();
      const exports = await refreshDataExportList(await listAdminDataExports());
      sendEnvelope(response, 200, exports, "Admin export talepleri alindi.");
      return;
    }

    const adminDataExportStatusMatch = pathname.match(/^\/api\/admin\/data-exports\/([^/]+)\/status$/);
    if (adminDataExportStatusMatch && request.method === "POST") {
      if (!requireSession(request, response, "admin")) return;
      await expireOldDataExports();
      const exportId = adminDataExportStatusMatch[1];
      let exportRequest = await getAdminDataExport(exportId);
      if (!exportRequest) {
        sendEnvelope(response, 404, null, "Export talebi bulunamadi.", "data_export_not_found", false);
        return;
      }
      if (exportRequest.providerJobId) {
        const corrupted = await isProviderTokenCorrupted(exportId);
        if (corrupted) {
          const status = await getLabsExportStatus(exportRequest.providerJobId);
          if (status.ok && status.status === "ready" && status.downloadToken && status.downloadToken !== "download") {
            await updateProviderToken(exportId, status.downloadToken);
            const updated = await getAdminDataExport(exportId);
            if (updated) {
              exportRequest = updated;
            }
          }
        }
      }
      sendEnvelope(response, 200, await refreshDataExportStatus(exportRequest), "Export durumu yenilendi.");
      return;
    }

    const adminDataExportResendMatch = pathname.match(/^\/api\/admin\/data-exports\/([^/]+)\/resend-mail$/);
    if (adminDataExportResendMatch && request.method === "POST") {
      if (!requireSession(request, response, "admin")) return;
      const exportId = adminDataExportResendMatch[1];
      const exportRequestRaw = await getAdminDataExport(exportId);
      if (exportRequestRaw && exportRequestRaw.providerJobId) {
        const corrupted = await isProviderTokenCorrupted(exportId);
        if (corrupted) {
          const status = await getLabsExportStatus(exportRequestRaw.providerJobId);
          if (status.ok && status.status === "ready" && status.downloadToken && status.downloadToken !== "download") {
            await updateProviderToken(exportId, status.downloadToken);
          }
        }
      }
      const reissued = await reissueDataExportDownloadToken(exportId);
      if (!reissued.ok) {
        sendEnvelope(response, 400, null, reissued.message, reissued.code, false);
        return;
      }
      const exportRequest = await sendDataExportReadyNotification(reissued.request, reissued.rawDownloadToken);
      sendEnvelope(response, 200, exportRequest, "Indirme maili tekrar gonderildi.");
      return;
    }

    const adminDataExportRetryMatch = pathname.match(/^\/api\/admin\/data-exports\/([^/]+)\/retry$/);
    if (adminDataExportRetryMatch && request.method === "POST") {
      if (!requireSession(request, response, "admin")) return;
      const exportId = adminDataExportRetryMatch[1];
      const exportRequest = await getAdminDataExport(exportId);
      if (!exportRequest) {
        sendEnvelope(response, 404, null, "Export talebi bulunamadi.", "data_export_not_found", false);
        return;
      }

      if (["pending", "processing"].includes(exportRequest.status)) {
        sendEnvelope(response, 400, null, "Bu talep zaten devam ediyor.", "export_already_processing", false);
        return;
      }

      const provider = await startLabsExport({
        callbackUrl: dataExportCallbackUrl(),
        externalLicenseId: exportRequest.externalLicenseId || "",
        externalTenantId: exportRequest.customerTenantId,
        requestId: exportRequest.id,
        requestedByEmail: exportRequest.customerEmail || "",
        storeName: exportRequest.storeName || "Ana magaza",
      });

      if (!provider.ok) {
        sendEnvelope(response, 503, null, `Export baslatilamadi: ${provider.message}`, provider.code, false);
        return;
      }

      const updated = await markDataExportProcessing(exportRequest.id, provider.jobId);
      sendEnvelope(response, 200, updated ?? exportRequest, "Dışa aktarım talebi yeniden başlatıldı.");
      return;
    }

    const adminDataExportRejectMatch = pathname.match(/^\/api\/admin\/data-exports\/([^/]+)\/reject$/);
    if (adminDataExportRejectMatch && request.method === "POST") {
      if (!requireSession(request, response, "admin")) return;
      const body = await readJsonBody<{ reason?: string }>(request);
      try {
        const updated = await rejectDataExportRequest(adminDataExportRejectMatch[1], body?.reason);
        if (!updated) {
          sendEnvelope(response, 404, null, "Dışa aktarım talebi bulunamadı.", "data_export_not_found", false);
          return;
        }

        if (isEmailConfigured() && updated.customerEmail) {
          await sendDataExportRejectedMail({
            customerEmail: updated.customerEmail,
            customerName: updated.customerName || "Değerli Müşterimiz",
            storeName: updated.storeName || "Mağaza",
            reason: body?.reason || null,
          }).catch((err) => {
            console.error("Data export rejected mail failed to send:", err);
          });
        }

        sendEnvelope(response, 200, updated, "Dışa aktarım talebi reddedildi.");
      } catch (err) {
        sendEnvelope(response, 400, null, err instanceof Error ? err.message : "Talep reddedilemedi.", "bad_request", false);
      }
      return;
    }

    if (request.method === "GET" && pathname === "/api/admin/customers") {
      if (!requireSession(request, response, "admin")) return;
      sendEnvelope(response, 200, await adminCustomers(), "Admin müşteri listesi alındı.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/admin/store-license-requests") {
      if (!requireSession(request, response, "admin")) return;
      sendEnvelope(response, 200, await getAdminStoreLicenseRequests(), "Admin mağaza talepleri listesi alındı.");
      return;
    }

    const approveStoreRequestMatch = pathname.match(/^\/api\/admin\/store-license-requests\/([^/]+)\/approve$/);
    if (approveStoreRequestMatch && request.method === "POST") {
      const session = requireSession(request, response, "admin");
      if (!session) return;
      const body = await readJsonBody<{ adminNote?: string }>(request);
      try {
        const result = await approveStoreLicenseRequest(session.user.id, approveStoreRequestMatch[1], body?.adminNote);

        let mailSent = false;
        if (isEmailConfigured()) {
          const systemUrl = `${process.env.PUBLIC_SITE_URL || "https://getshelfio.com"}/giris?next=/hesap/lisanslar`;
          await sendStoreLicenseRequestApprovedMail({
            customerEmail: result.customerEmail,
            customerName: result.customerName || "Değerli Müşterimiz",
            requestedStoreName: result.requestedStoreName,
            planName: result.planName,
            maskedKey: result.maskedKey,
            licenseKey: result.rawKey,
            activationUrl: systemUrl,
          }).then(() => {
            mailSent = true;
          }).catch((err) => {
            console.error("Approved store request mail failed:", err);
          });
        }

        sendEnvelope(
          response,
          200,
          { ...result, licenseKey: result.rawKey, mailSent },
          mailSent
            ? "Mağaza lisansı talebi onaylandı ve e-posta bildirimi gönderildi."
            : "Mağaza lisansı talebi onaylandı, e-posta bildirimi gönderilemedi."
        );
      } catch (err) {
        sendEnvelope(response, 400, null, err instanceof Error ? err.message : "Talep onaylanamadı.", "bad_request", false);
      }
      return;
    }

    const rejectStoreRequestMatch = pathname.match(/^\/api\/admin\/store-license-requests\/([^/]+)\/reject$/);
    if (rejectStoreRequestMatch && request.method === "POST") {
      const session = requireSession(request, response, "admin");
      if (!session) return;
      const body = await readJsonBody<{ reason?: string; adminNote?: string }>(request);
      const adminNote = body?.adminNote || body?.reason || "";
      try {
        const result = await rejectStoreLicenseRequest(session.user.id, rejectStoreRequestMatch[1], adminNote);

        let mailSent = false;
        if (isEmailConfigured()) {
          await sendStoreLicenseRequestRejectedMail({
            customerEmail: result.customerEmail,
            customerName: result.customerName || "Değerli Müşterimiz",
            requestedStoreName: result.requestedStoreName,
            reason: result.reason,
          }).then(() => {
            mailSent = true;
          }).catch((err) => {
            console.error("Rejected store request mail failed:", err);
          });
        }

        sendEnvelope(
          response,
          200,
          { ok: true, mailSent },
          mailSent
            ? "Mağaza lisansı talebi reddedildi ve e-posta bildirimi gönderildi."
            : "Mağaza lisansı talebi reddedildi."
        );
      } catch (err) {
        sendEnvelope(response, 400, null, err instanceof Error ? err.message : "Talep reddedilemedi.", "bad_request", false);
      }
      return;
    }

    if (request.method === "GET" && pathname === "/api/control/users/by-email") {
      if (!assertInternalSecret(request, response)) return;
      const email = requestUrl.searchParams.get("email") ?? "";
      if (!email) {
        sendEnvelope(response, 400, null, "Sorgu bilgisi eksik.", "invalid_query", false);
        return;
      }
      const user = await getControlUserByEmail(email);
      if (!user) {
        sendEnvelope(response, 404, null, "Kullanıcı bulunamadı.", "user_not_found", false);
        return;
      }
      sendEnvelope(response, 200, user, "Kullanıcı sorgusu tamamlandı.");
      return;
    }

    const entitlementMatch = pathname.match(/^\/api\/control\/tenants\/([^/]+)\/entitlements$/);
    if (entitlementMatch && request.method === "GET") {
      if (!assertInternalSecret(request, response)) return;
      if (!isUuid(entitlementMatch[1])) {
        sendEnvelope(response, 400, null, "Tenant bilgisi geçersiz.", "invalid_tenant_id", false);
        return;
      }
      const entitlements = await getTenantEntitlements(entitlementMatch[1]);
      if (!entitlements) {
        sendEnvelope(response, 404, null, "Tenant bulunamadı.", "tenant_not_found", false);
        return;
      }
      sendEnvelope(response, 200, entitlements, "Tenant yetkileri alındı.");
      return;
    }

    const userByEmailMatch = pathname.match(/^\/api\/control\/users\/by-email\/([^/]+)$/);
    if (userByEmailMatch && request.method === "GET") {
      if (!assertInternalSecret(request, response)) return;
      const user = await getControlUserByEmail(decodeURIComponent(userByEmailMatch[1]));
      if (!user) {
        sendEnvelope(response, 404, null, "Kullanıcı bulunamadı.", "user_not_found", false);
        return;
      }
      sendEnvelope(response, 200, user, "Kullanıcı sorgusu tamamlandı.");
      return;
    }

    if (request.method === "GET" && pathname === "/api/control/licenses/status") {
      if (!assertInternalSecret(request, response)) return;
      const email = requestUrl.searchParams.get("email") ?? undefined;
      const tenantId = requestUrl.searchParams.get("tenantId") ?? undefined;
      if (!email && !tenantId) {
        sendEnvelope(response, 400, null, "Sorgu bilgisi eksik.", "invalid_query", false);
        return;
      }
      if (tenantId && !isUuid(tenantId)) {
        sendEnvelope(response, 400, null, "Tenant bilgisi geçersiz.", "invalid_tenant_id", false);
        return;
      }
      sendEnvelope(response, 200, await getLicenseStatus({ email, tenantId }), "Lisans durumu alındı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/control/audit") {
      if (!assertInternalSecret(request, response)) return;
      const body = await readJsonBody<{
        action?: string;
        actorUserId?: string;
        metadata?: Record<string, unknown>;
        resourceId?: string;
        resourceType?: string;
        tenantId?: string;
      }>(request);
      if (!body?.action || !body.resourceType) {
        sendEnvelope(response, 400, null, "Audit bilgisi eksik.", "invalid_audit_payload", false);
        return;
      }
      await recordAudit({
        action: limitText(body.action, 120),
        actorUserId: body.actorUserId || null,
        ip: getDbClientIp(request),
        metadata: sanitizeAuditMetadata(body.metadata),
        resourceId: body.resourceId || null,
        resourceType: limitText(body.resourceType, 80),
        tenantId: body.tenantId || null,
        userAgent: limitText(String(request.headers["user-agent"] ?? ""), 300) || null,
      });
      sendEnvelope(response, 200, { received: true }, "Audit olayı alındı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/control/sso/start") {
      let result: Awaited<ReturnType<typeof createPanelAccessForUser>> | null = null;
      if (verifyControlSecret(readControlSecret(request))) {
        const body = await readJsonBody<{ email?: string }>(request);
        result = body?.email ? await createPanelAccessForEmail(body.email, getDbClientIp(request)) : null;
      } else {
        const session = getSession(request);
        if (session?.user.role === "customer") result = await createPanelAccessForUser(session.user, getDbClientIp(request));
      }
      if (!result) {
        sendEnvelope(response, 403, null, "SSO geçişi başlatılamadı.", "sso_start_denied", false);
        return;
      }
      sendEnvelope(response, 200, result, "SSO geçişi hazır.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/control/sso/exchange") {
      if (!assertInternalSecret(request, response)) return;
      const body = await readJsonBody<{ code?: string }>(request);
      const result = await exchangePanelAccessCode(String(body?.code ?? ""), getDbClientIp(request));
      if (!result.success) {
        sendEnvelope(response, 400, null, ssoExchangeErrorMessage(result.code), result.code, false);
        return;
      }
      sendEnvelope(response, 200, result.data, "SSO kodu doğrulandı.");
      return;
    }

    if (request.method === "POST" && pathname === "/api/account/plan-upgrades") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      const body = await readJsonBody<{ password?: string; planSlug?: string }>(request);
      const result = await requestPlanUpgrade({
        passwordConfirm: String(body?.password ?? ""),
        planSlug: normalizePlanSlug(body?.planSlug),
        tenantId,
        userId: session.user.id,
      });
      if (!result.ok) {
        sendEnvelope(response, 400, null, result.message ?? "Plan değişikliği oluşturulamadı.", result.code ?? "plan_change_failed", false);
        return;
      }
      if (!result.change) {
        sendEnvelope(response, 400, null, "Plan değişikliği oluşturulamadı.", "plan_change_failed", false);
        return;
      }
      const change = result.change;
      const mailSent = isEmailConfigured()
        ? await sendPlanUpgradeMail({
          currentPlanName: change.currentPlanName,
          customerEmail: result.customerEmail ?? session.user.email,
          newPlanName: change.newPlanName,
          startsAt: change.startsAt,
        }).then(() => true).catch(() => false)
        : false;
      sendEnvelope(response, 200, { ...change, mailSent }, "Plan değişikliği talebiniz alındı.");
      return;
    }

    const cancelPlanUpgradeMatch = pathname.match(/^\/api\/account\/plan-upgrades\/([^/]+)$/);
    if (cancelPlanUpgradeMatch && request.method === "DELETE") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;
      const result = await cancelPlanUpgrade({ changeId: cancelPlanUpgradeMatch[1] ?? "", tenantId, userId: session.user.id });
      if (!result.ok) {
        sendEnvelope(response, 400, null, result.message ?? "Lisans anahtarı yenilenemedi.", result.code ?? "license_renew_failed", false);
        return;
      }
      sendEnvelope(response, 200, { ok: true }, result.message);
      return;
    }

    const cancelLicenseMatch = pathname.match(/^\/api\/account\/licenses\/([^/]+)\/cancel$/);
    if (cancelLicenseMatch && request.method === "POST") {
      const session = requireSession(request, response, "customer");
      if (!session) return;
      const tenantId = requireCustomerTenant(session, response);
      if (!tenantId) return;

      const body = await readJsonBody<{ password?: string; confirmText?: string }>(request);
      const result = await cancelCustomerLicense({
        userId: session.user.id,
        tenantId,
        licenseId: cancelLicenseMatch[1],
        passwordConfirm: String(body?.password ?? ""),
        confirmText: String(body?.confirmText ?? ""),
      });

      if (!result.ok) {
        sendEnvelope(response, 400, null, result.message, result.code, false);
        return;
      }
      sendEnvelope(response, 200, { ok: true }, result.message);
      return;
    }

    const adminRevokeMatch = pathname.match(/^\/api\/admin\/licenses\/([^/]+)\/revoke$/);
    if (adminRevokeMatch && request.method === "POST") {
      const session = requireSession(request, response, "admin");
      if (!session) return;
      const result = await revokeAdminLicense(session.user.id, adminRevokeMatch[1] ?? "");
      if (!result.ok) {
        sendEnvelope(response, 400, null, result.message, result.code, false);
        return;
      }
      sendEnvelope(response, 200, { ok: true }, result.message);
      return;
    }

    const adminRenewMatch = pathname.match(/^\/api\/admin\/licenses\/([^/]+)\/renew$/);
    if (adminRenewMatch && request.method === "POST") {
      const session = requireSession(request, response, "admin");
      if (!session) return;
      const result = await renewAdminLicense(session.user.id, adminRenewMatch[1] ?? "");
      if (!result.ok) {
        sendEnvelope(response, 400, null, result.message ?? "Lisans anahtarı yenilenemedi.", result.code ?? "license_renew_failed", false);
        return;
      }
      if (!result.license) {
        sendEnvelope(response, 400, null, "Lisans anahtarı yenilenemedi.", "license_renew_failed", false);
        return;
      }
      const license = result.license;
      const mailSent = isEmailConfigured() && license.customerEmail
        ? await sendLicenseCreatedMail({
          customerEmail: license.customerEmail,
          expiresAt: license.expiresAt,
          licenseKey: license.fullKey,
          licenseType: license.licenseType,
          maskedKey: license.maskedKey,
          planName: license.planName,
        }).then(() => true).catch(() => false)
        : false;
      sendEnvelope(response, 200, { ...license, mailSent }, mailSent ? "Lisans anahtarı yenilendi ve e-posta gönderildi." : "Lisans anahtarı yenilendi.");
      return;
    }

    sendJson(response, 404, { status: "not_found", message: "Route not found." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const isCustomError = message.includes("aktif bir lisansı bulunuyor") || message.includes("başka bir lisans bulunuyor");
    const code = message === "invalid_plan" ? "invalid_plan" : (isCustomError ? "multiple_active_licenses_forbidden" : "server_error");
    sendEnvelope(response, code === "server_error" ? 500 : 400, null, isCustomError ? message : "İşlem tamamlanamadı. Lütfen daha sonra tekrar deneyin.", code, false);
  }
}

function normalizePlanSlug(value?: string) {
  if (value === "starter") return "baslangic";
  if (value === "professional") return "profesyonel";
  if (value === "enterprise") return "kurumsal";
  if (value === "baslangic" || value === "profesyonel" || value === "kurumsal" || value === "demo") return value;
  return "profesyonel";
}

function ssoExchangeErrorMessage(code: string) {
  const errors: Record<string, string> = {
    sso_code_invalid: "SSO geçiş kodu geçersiz.",
    sso_code_expired: "SSO geçiş kodunun süresi dolmuş.",
    sso_code_used: "SSO geçiş kodu daha önce kullanılmış.",
    active_license_required: "Shelfio sistemine gitmek için aktif bir lisans gereklidir.",
    license_payload_missing: "Lisans doğrulama bilgileri eksik.",
    license_expired: "Lisans süreniz dolmuştur.",
    tenant_missing: "Müşteri hesap bilgisi bulunamadı.",
  };
  return errors[code] || "SSO doğrulama hatası.";
}

function accountLicenseErrorMessage(code: string) {
  const errors: Record<string, string> = {
    invalid_license_key: "Geçerli bir lisans anahtarı girin.",
    license_not_found: "Lisans anahtarı bulunamadı.",
    license_inactive: "Bu lisans aktif değil.",
    license_email_mismatch: "Bu lisans farklı bir e-posta adresi için oluşturulmuş.",
    license_already_claimed: "Bu lisans başka bir hesaba bağlı.",
    license_already_active: "Bu lisans hesabınızda zaten aktif.",
    multiple_active_licenses_forbidden: "Bu müşterinin aktif bir lisansı bulunuyor. Yeni lisans oluşturmak için mevcut lisansı iptal edin.",
    store_limit_exceeded: "Mağaza lisansı limitiniz dolu. Daha fazla mağaza lisansı eklemek için planınızı yükseltin.",
  };
  return errors[code] || "Lisans işlemi başarısız.";
}



