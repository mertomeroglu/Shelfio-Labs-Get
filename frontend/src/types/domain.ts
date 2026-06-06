import type { BusinessType } from "@/services/checkoutService";
import type { SupportModule, SupportPriority } from "@/types/account";
import type { LicenseStatus } from "@/types/license";
import type { PlanId } from "@/types/plan";

export type TenantStatus = "active" | "pending" | "suspended";
export type StoreRecordStatus = "active" | "pending" | "inactive";
export type UserStatus = "active" | "pending" | "inactive";
export type SubscriptionStatus = "active" | "pending" | "past_due" | "cancelled";
export type BillingMode = "quote" | "subscription";

export type TenantRecord = {
  id: string;
  name: string;
  status: TenantStatus;
  planId: PlanId;
  createdAt: string;
};

export type StoreRecord = {
  id: string;
  tenantId: string;
  name: string;
  type: BusinessType;
  city: string;
  district: string;
  status: StoreRecordStatus;
};

export type LicenseRecord = {
  id: string;
  tenantId: string | null;
  planId: PlanId;
  status: LicenseStatus;
  startsAt: string | null;
  expiresAt: string | null;
  activatedAt: string | null;
  storeLimit: number | "unlimited";
  userLimit: number | "unlimited";
  enabledModules: string[];
};

export type UserRecord = {
  id: string;
  tenantId: string;
  storeId: string | null;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
};

export type SubscriptionRecord = {
  id: string;
  tenantId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  billingMode: BillingMode;
  currentPeriodStart: string;
  currentPeriodEnd: string;
};

export type SupportTicketRecord = {
  id: string;
  tenantId: string;
  subject: string;
  module: SupportModule;
  priority: SupportPriority;
  status: "open" | "answered" | "resolved";
  createdAt: string;
};
