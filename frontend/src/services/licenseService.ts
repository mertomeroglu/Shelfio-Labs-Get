import type {
  License,
  LicenseActivationPayload,
  LicenseActivationResult,
  LicenseValidationPayload,
  LicenseValidationResult,
} from "@/types/license";
import { apiRequest } from "@/services/apiClient";

export async function validateLicenseKey(
  payload: LicenseValidationPayload,
): Promise<LicenseValidationResult> {
  return apiRequest<LicenseValidationResult>("/license/validate", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function activateLicense(
  payload: LicenseActivationPayload,
): Promise<LicenseActivationResult> {
  return apiRequest<LicenseActivationResult>("/license/activate", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function getCurrentLicense(): Promise<License | null> {
  return apiRequest<License | null>("/license/current");
}

// Safe redirect helper. Never appends license keys or fake tokens to the URL.
export function getShelfioRedirectUrl() {
  return "/hesap/lisanslar";
}
