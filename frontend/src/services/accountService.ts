import type {
  AccountInvoice,
  AccountLicense,
  AccountOverview,
  AccountStoresResult,
  BillingSummary,
  DataExportRequest,
  SupportRequestPayload,
  SupportTicketDetail,
  SupportTicket,
  StoreLicenseRequest,
} from "@/types/account";
import { apiRequest } from "@/services/apiClient";

export async function getAccountOverview(): Promise<AccountOverview> {
  return apiRequest<AccountOverview>("/account/me", { cache: "no-store" });
}

export async function getAccountLicenses(): Promise<AccountLicense[]> {
  return apiRequest<AccountLicense[]>("/account/licenses", { cache: "no-store" });
}

export async function activateAccountLicense(licenseKey: string): Promise<{ license: AccountLicense }> {
  return apiRequest<{ license: AccountLicense }>("/account/licenses/activate", {
    body: JSON.stringify({ licenseKey }),
    method: "POST",
  });
}

export async function getBillingSummary(): Promise<BillingSummary> {
  return apiRequest<BillingSummary>("/account/billing", { cache: "no-store" });
}

export async function getInvoices(): Promise<AccountInvoice[]> {
  return apiRequest<AccountInvoice[]>("/account/invoices", { cache: "no-store" });
}

export async function getStores(): Promise<AccountStoresResult> {
  return apiRequest<AccountStoresResult>("/account/stores", { cache: "no-store" });
}

export async function createStore(payload: { storeName: string; location: string }): Promise<{ id: string; storeName: string; location: string }> {
  return apiRequest<{ id: string; storeName: string; location: string }>("/account/stores", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  return apiRequest<SupportTicket[]>("/support-tickets", { cache: "no-store" });
}

export async function submitSupportRequest(
  payload: SupportRequestPayload,
): Promise<{ received: true; referenceId: string }> {
  return apiRequest<{ received: true; referenceId: string }>("/support-tickets", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function submitPublicSupportRequest(payload: {
  customerEmail: string;
  customerName: string;
  message: string;
  subject: string;
 }): Promise<{ received: true; referenceId: string }> {
  return apiRequest<{ received: true; referenceId: string }>("/support-tickets", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function getSupportTicket(id: string): Promise<SupportTicketDetail> {
  return apiRequest<SupportTicketDetail>(`/support-tickets/${id}`, { cache: "no-store" });
}

export async function sendSupportMessage(id: string, message: string): Promise<SupportTicketDetail> {
  return apiRequest<SupportTicketDetail>(`/support-tickets/${id}/messages`, {
    body: JSON.stringify({ message }),
    method: "POST",
  });
}

export async function cancelAccountLicense(id: string, payload: { password?: string; confirmText?: string }): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/account/licenses/${id}/cancel`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function requestAccountPlanUpgrade(payload: { password: string; planSlug: string }): Promise<{
  id: string;
  currentPlanName: string;
  newPlanName: string;
  newPlanSlug: string;
  startsAt: string;
}> {
  return apiRequest("/account/plan-upgrades", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function cancelAccountPlanUpgrade(id: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/account/plan-upgrades/${id}`, {
    method: "DELETE",
  });
}

export async function getPublicSupportTicket(id: string, token: string): Promise<SupportTicketDetail> {
  return apiRequest<SupportTicketDetail>(`/public/support-tickets/${id}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
}

export async function sendPublicSupportMessage(id: string, token: string, message: string): Promise<SupportTicketDetail> {
  return apiRequest<SupportTicketDetail>(`/public/support-tickets/${id}/messages?token=${encodeURIComponent(token)}`, {
    body: JSON.stringify({ message }),
    method: "POST",
  });
}

export async function getStoreLicenseRequests(): Promise<StoreLicenseRequest[]> {
  return apiRequest<StoreLicenseRequest[]>("/account/store-license-requests", { cache: "no-store" });
}

export async function createStoreLicenseRequest(payload: { requestedStoreName: string; note?: string }): Promise<StoreLicenseRequest> {
  return apiRequest<StoreLicenseRequest>("/account/store-license-requests", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function cancelStoreLicenseRequest(id: string): Promise<StoreLicenseRequest> {
  return apiRequest<StoreLicenseRequest>(`/account/store-license-requests/${id}/cancel`, {
    method: "PATCH",
  });
}

export async function getStoreLicenses(): Promise<AccountLicense[]> {
  return apiRequest<AccountLicense[]>("/account/store-licenses", { cache: "no-store" });
}

export async function getDataExportRequests(): Promise<DataExportRequest[]> {
  return apiRequest<DataExportRequest[]>("/account/data-exports", { cache: "no-store" });
}

export async function createDataExportRequest(payload: { licenseId: string; storeName?: string | null }): Promise<DataExportRequest> {
  return apiRequest<DataExportRequest>("/account/data-exports", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}
