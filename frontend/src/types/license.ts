import type { OwnerAccountInfo, StoreActivationInfo, TenantActivationInfo } from "@/types/tenant";

export type LicenseStatus = "valid" | "active" | "pending" | "expired" | "revoked" | "already_activated" | "invalid";

export type LicensePlan = {
  id: string;
  planName: string;
  storeLimit: number | "unlimited";
  userLimit: number | "unlimited";
  enabledModules: string[];
};

export type License = {
  activatedAt: string | null;
  id: string;
  maskedKey?: string;
  licenseType: "standard" | "demo" | "enterprise";
  isDemo: boolean;
  status: LicenseStatus;
  plan: LicensePlan;
  tenantId: string | null;
  expiresAt: string | null;
  remainingDays: number | null;
};

export type LicenseValidationPayload = {
  licenseKey: string;
  ownerEmail: string;
};

export type LicenseValidationResult = {
  ok: boolean;
  status: LicenseStatus;
  message: string;
  activatedAt?: string | null;
  expiresAt?: string | null;
  isDemo?: boolean;
  licenseType?: "standard" | "demo" | "enterprise";
  plan?: LicensePlan;
  remainingDays?: number | null;
};

export type LicenseActivationPayload = {
  license: LicenseValidationPayload;
  tenant: TenantActivationInfo;
  store: StoreActivationInfo;
  owner: OwnerAccountInfo;
};

export type LicenseActivationResult = {
  ok: boolean;
  status: "activated" | "failed";
  message: string;
  license: License;
  redirectUrl: string;
};

