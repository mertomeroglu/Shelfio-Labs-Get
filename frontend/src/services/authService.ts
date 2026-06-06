import type { CurrentUser } from "@/types/tenant";
import { getShelfioRedirectUrl } from "@/services/licenseService";
import { apiRequest } from "@/services/apiClient";

export type LoginRole = CurrentUser["role"];

export type RegisterPayload = {
  businessName: string;
  email: string;
  fullName: string;
  password: string;
  phone?: string;
};

export async function login(email: string, password: string, role: LoginRole): Promise<CurrentUser> {
  return apiRequest<CurrentUser>("/auth/login", {
    body: JSON.stringify({ email, password, role }),
    method: "POST",
  });
}

export async function register(payload: RegisterPayload): Promise<CurrentUser> {
  return apiRequest<CurrentUser>("/auth/register", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function logout(): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>("/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await apiRequest<CurrentUser>("/auth/me", {
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export async function requestPasswordReset(email: string): Promise<{ received: true }> {
  return apiRequest<{ received: true }>("/auth/forgot-password", {
    body: JSON.stringify({ email }),
    method: "POST",
  });
}

export async function resetPassword(token: string, password: string): Promise<{ updated: true }> {
  return apiRequest<{ updated: true }>("/auth/reset-password", {
    body: JSON.stringify({ password, token }),
    method: "POST",
  });
}

export function getPanelGatewayUrl() {
  return getShelfioRedirectUrl();
}
