import type { BusinessType } from "@/services/checkoutService";

export type Tenant = {
  id: string;
  name: string;
  storeCount: number;
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  tenant: Tenant;
};

export type TenantActivationInfo = {
  businessName: string;
  storeCount: number;
};

export type StoreActivationInfo = {
  storeName: string;
  storeType: BusinessType;
  city: string;
  district: string;
  phone?: string;
};

export type OwnerAccountInfo = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  termsAccepted: boolean;
};
