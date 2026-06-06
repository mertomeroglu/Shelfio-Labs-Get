export type AccountLicenseStatus = "active" | "pending" | "expired" | "revoked";
export type InvoiceStatus = "paid" | "pending";
export type StoreStatus = "active" | "pending";

export type StoreLicenseRequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type DataExportStatus = "pending" | "processing" | "ready" | "failed" | "expired" | "rejected";

export type DataExportRequest = {
  id: string;
  customerTenantId: string;
  requestedByUserId: string;
  licenseId: string | null;
  externalLicenseId: string | null;
  externalTenantId: string | null;
  storeName: string;
  status: DataExportStatus;
  statusLabel: string;
  providerJobId: string | null;
  downloadExpiresAt: string | null;
  mailSentAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  customerName?: string | null;
  customerEmail?: string | null;
  tenantName?: string | null;
  maskedKey?: string | null;
};

export type StoreLicenseRequest = {
  id: string;
  tenantId: string;
  requestedByUserId: string;
  requestedByUserName?: string | null;
  requestedStoreName: string;
  note: string | null;
  status: StoreLicenseRequestStatus;
  baseLicenseId: string | null;
  generatedLicenseId: string | null;
  planId: string | null;
  planSlug: string | null;
  adminNote: string | null;
  decidedByUserId: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Admin view extensions
  tenantName?: string;
  customerEmail?: string;
  tenantStoreLimit?: number;
  tenantUsedStoreLicenses?: number;
};
export type SupportPriority = "Düşük" | "Orta" | "Yüksek";
export type SupportModule =
  | "Lisans"
  | "Aktivasyon"
  | "Fatura"
  | "POS"
  | "Stok"
  | "Tedarik"
  | "ESL"
  | "Mobil"
  | "Diğer";

export type AccountLicense = {
  id: string;
  licenseId: string;
  maskedKey: string;
  licenseType: "standard" | "demo" | "enterprise";
  isDemo: boolean;
  planName: string;
  planSlug: string;
  remainingDays: number | null;
  status: AccountLicenseStatus;
  activationStatus: string;
  startsAt: string;
  expiresAt: string;
  storeLimit: number | string;
  userLimit: number | string;
  enabledModules: string[];
  screenAccess?: string[];
  storeName?: string | null;
  parentLicenseId?: string | null;
  parentMaskedKey?: string | null;
  parentStoreName?: string | null;
  pendingPlanChange?: {
    id: string;
    newPlanName: string;
    newPlanSlug: string;
    startsAt: string;
  } | null;
};

export type AccountInvoice = {
  id: string;
  date: string;
  description: string;
  amountLabel: string;
  status: InvoiceStatus;
};

export type AccountStore = {
  id: string;
  businessName: string;
  storeName: string;
  location: string;
  status: StoreStatus;
  userCount: number | null;
  enabledModules: string[];
  activatedAt: string;
};

export type UsageStatus = "available" | "unavailable";

export type AccountStoresResult = {
  usageStatus: UsageStatus;
  currentStoreCount: number | null;
  currentUserCount: number | null;
  activeStoreCount: number | null;
  activeUserCount: number | null;
  usageLastSyncedAt: string | null;
  summaryText: string | null;
  stores: AccountStore[];
  storeLimit?: number | string | null;
  userLimit?: number | string | null;
};

export type SupportTicket = {
  customerEmail?: string;
  customerName?: string;
  id: string;
  shortReference?: number;
  subject: string;
  module: SupportModule;
  priority: SupportPriority;
  status: "Yeni" | "Yanıt bekliyor" | "Yanıtlandı" | "Çözüldü" | "Açık";
  unreadForCustomer?: boolean;
  updatedAt: string;
};

export type SupportMessage = {
  author: "customer" | "admin";
  body: string;
  createdAt: string;
  id: string;
};

export type SupportTicketDetail = SupportTicket & {
  messages: SupportMessage[];
};

export type SupportRequestPayload = {
  subject: string;
  module: SupportModule;
  priority: SupportPriority;
  message: string;
};

export type AccountOverview = {
  hasActiveLicense: boolean;
  planName: string;
  licenseStatus: AccountLicenseStatus;
  pendingPlanChange?: AccountLicense["pendingPlanChange"];
  storeLimit: number | string | null;
  userLimit: number | string | null;
  currentStoreCount: number | null;
  currentUserCount: number | null;
  activeStoreCount: number | null;
  activeUserCount: number | null;
  usageStatus: UsageStatus;
  usageLastSyncedAt: string | null;
  tenantName: string | null;
  adminEmail: string | null;
  storeUsage: string;
  userUsage: string;
  latestInvoiceStatus: InvoiceStatus | null;
  openSupportCount: number;
};

export type BillingSummary = {
  planName: string;
  invoiceStatus: InvoiceStatus | null;
  latestPaymentAt: string | null;
  paymentMethodLabel: string | null;
};
