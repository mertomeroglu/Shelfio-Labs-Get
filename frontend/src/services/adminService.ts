import { apiRequest } from "@/services/apiClient";
import type { DataExportRequest, StoreLicenseRequest } from "@/types/account";

export type AdminLicenseStatus = "active" | "pending" | "revoked" | "expired";

export type AdminLicense = {
  activatedAt: string;
  businessName: string;
  createdAt: string;
  customerEmail: string;
  customerName: string;
  fullKey?: string | null;
  hasFullKey?: boolean;
  id: string;
  legacyKeyMessage?: string | null;
  licenseType: "standard" | "demo" | "enterprise";
  mailSent?: boolean;
  maskedKey: string;
  expiresAt: string;
  isDemo: boolean;
  planName: string;
  planSlug: string;
  remainingDays: number | null;
  status: AdminLicenseStatus;
  storeLimit: number;
  tenantId?: string | null;
  userLimit: number;
  parentLicenseId?: string | null;
  parentMaskedKey?: string | null;
  parentStoreName?: string | null;
  storeName?: string | null;
  licenseStructure?: "primary" | "additional_store";
};

export type AdminStats = {
  activeLicenses?: number;
  customers?: number;
  demoRequests: number;
  invoices?: number;
  newPurchases?: number;
  pendingActivations: number;
  recentActions: string[];
  supportTickets: number;
  totalLicenses: number;
};

export type AdminSupportStatus = "Yeni" | "Yanıt bekliyor" | "Yanıtlandı" | "Çözüldü";

export type AdminSupportTicket = {
  customerEmail: string;
  customerName: string;
  id: string;
  shortReference?: number;
  module: string;
  priority: string;
  source?: "customer_portal" | "public";
  status: AdminSupportStatus;
  subject: string;
  updatedAt: string;
};

export type AdminSupportTicketDetail = AdminSupportTicket & {
  messages: Array<{
    author: "customer" | "admin";
    body: string;
    createdAt: string;
    id: string;
  }>;
};

export type CreateLicensePayload = {
  businessName: string;
  customerEmail: string;
  customerName: string;
  licenseType: "standard" | "demo" | "enterprise";
  note?: string;
  planName: string;
  storeLimit: number;
  userLimit: number;
  validity: string;
};

export type AdminDemoRequest = {
  company: string;
  contact: string;
  phone?: string;
  createdAt: string;
  id: string;
  licenseId?: string | null;
  rejectionReason?: string | null;
  status: string;
  storeCount: number;
  referenceId?: string;
};

export type AdminCustomer = {
  email: string;
  id: string;
  name: string;
  phone?: string;
  planName: string;
  subscriptionStatus?: string;
  storeCount: number;
};

export type AdminDataExportRequest = DataExportRequest;

export async function getAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>("/admin/stats", { cache: "no-store" });
}

export async function getAdminLicenses(): Promise<AdminLicense[]> {
  return apiRequest<AdminLicense[]>("/admin/licenses", { cache: "no-store" });
}

export async function createAdminLicense(payload: CreateLicensePayload): Promise<AdminLicense> {
  return apiRequest<AdminLicense>("/admin/licenses", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function getAdminSupportTickets(): Promise<AdminSupportTicket[]> {
  return apiRequest<AdminSupportTicket[]>("/admin/support-tickets", { cache: "no-store" });
}

export async function getAdminSupportTicket(id: string): Promise<AdminSupportTicketDetail> {
  return apiRequest<AdminSupportTicketDetail>(`/admin/support-tickets/${id}`, { cache: "no-store" });
}

export async function sendAdminSupportMessage(id: string, message: string): Promise<AdminSupportTicketDetail> {
  return apiRequest<AdminSupportTicketDetail>(`/admin/support-tickets/${id}/messages`, {
    body: JSON.stringify({ message }),
    method: "POST",
  });
}

export async function updateAdminSupportStatus(id: string, status: AdminSupportStatus): Promise<AdminSupportTicketDetail> {
  return apiRequest<AdminSupportTicketDetail>(`/admin/support-tickets/${id}/status`, {
    body: JSON.stringify({ status }),
    method: "PATCH",
  });
}

export async function getAdminDemoRequests(): Promise<AdminDemoRequest[]> {
  return apiRequest<AdminDemoRequest[]>("/admin/demo-requests", { cache: "no-store" });
}

export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  return apiRequest<AdminCustomer[]>("/admin/customers", { cache: "no-store" });
}

export type CreateCustomerPayload = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  demoRequestId?: string;
  note?: string;
};

export async function createAdminCustomer(payload: CreateCustomerPayload): Promise<AdminCustomer & { mailSent?: boolean }> {
  return apiRequest<AdminCustomer & { mailSent?: boolean }>("/admin/customers", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export type SendMailPayload = {
  email: string;
  subject: string;
  message: string;
};

export type AdminSentMailLog = {
  errorMessage?: string | null;
  id: string;
  message: string;
  recipient: string;
  sentAt: string;
  status: "success" | "failed";
  subject: string;
};

export async function sendAdminMail(payload: SendMailPayload): Promise<{ sent: boolean }> {
  return apiRequest<{ sent: boolean }>("/admin/send-mail", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function getAdminSentMailLogs(): Promise<AdminSentMailLog[]> {
  return apiRequest<AdminSentMailLog[]>("/admin/sent-mail-logs", { cache: "no-store" });
}

export async function revokeAdminLicense(id: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/admin/licenses/${id}/revoke`, {
    method: "POST",
  });
}

export async function renewAdminLicense(id: string): Promise<AdminLicense> {
  return apiRequest<AdminLicense>(`/admin/licenses/${id}/renew`, {
    method: "POST",
  });
}

export async function approveAdminDemoRequest(id: string): Promise<AdminLicense> {
  return apiRequest<AdminLicense>(`/admin/demo-requests/${id}/approve`, {
    method: "POST",
  });
}

export async function rejectAdminDemoRequest(id: string, reason?: string): Promise<{ ok: boolean; mailSent?: boolean }> {
  return apiRequest<{ ok: boolean; mailSent?: boolean }>(`/admin/demo-requests/${id}/reject`, {
    body: JSON.stringify({ reason }),
    method: "POST",
  });
}

export async function getAdminStoreLicenseRequests(): Promise<StoreLicenseRequest[]> {
  return apiRequest<StoreLicenseRequest[]>("/admin/store-license-requests", { cache: "no-store" });
}

export async function approveStoreLicenseRequest(
  id: string,
  payload: { adminNote?: string }
): Promise<{ ok: boolean; mailSent?: boolean; id: string; licenseKey: string; maskedKey: string }> {
  return apiRequest<{ ok: boolean; mailSent?: boolean; id: string; licenseKey: string; maskedKey: string }>(`/admin/store-license-requests/${id}/approve`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function rejectStoreLicenseRequest(
  id: string,
  payload: { adminNote?: string }
): Promise<{ ok: boolean; mailSent?: boolean }> {
  return apiRequest<{ ok: boolean; mailSent?: boolean }>(`/admin/store-license-requests/${id}/reject`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function getAdminDataExportRequests(): Promise<AdminDataExportRequest[]> {
  return apiRequest<AdminDataExportRequest[]>("/admin/data-exports", { cache: "no-store" });
}

export async function refreshAdminDataExportRequest(id: string): Promise<AdminDataExportRequest> {
  return apiRequest<AdminDataExportRequest>(`/admin/data-exports/${id}/status`, {
    method: "POST",
  });
}

export async function resendAdminDataExportMail(id: string): Promise<AdminDataExportRequest> {
  return apiRequest<AdminDataExportRequest>(`/admin/data-exports/${id}/resend-mail`, {
    method: "POST",
  });
}

export async function rejectDataExportRequest(id: string, reason?: string): Promise<AdminDataExportRequest> {
  return apiRequest<AdminDataExportRequest>(`/admin/data-exports/${id}/reject`, {
    body: JSON.stringify({ reason }),
    method: "POST",
  });
}

export async function retryAdminDataExportRequest(id: string): Promise<AdminDataExportRequest> {
  return apiRequest<AdminDataExportRequest>(`/admin/data-exports/${id}/retry`, {
    method: "POST",
  });
}
