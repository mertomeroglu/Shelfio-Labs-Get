import type { PlanId } from "@/types/plan";
import { apiRequest } from "@/services/apiClient";

export type DemoModuleInterest =
  | "Stok Takip"
  | "POS / Kasa"
  | "Tedarik & Satın Alma"
  | "Sipariş Önerileri"
  | "Raporlama"
  | "ESL"
  | "Mobil Operasyon";

export type BusinessType = "Market" | "Mini market" | "Zincir mağaza" | "Depolu satış noktası" | "Diğer";

export type DemoRequestPayload = {
  fullName: string;
  email: string;
  phone?: string;
  companyName: string;
  storeCount: number;
  businessType?: BusinessType;
  interestedModules: DemoModuleInterest[];
  message?: string;
  consentAccepted: boolean;
  website?: string;
};

export type PlanQuotePayload = DemoRequestPayload & {
  planId: PlanId;
};

export type CheckoutSession = {
  id: string;
  plan: {
    planName: string;
    priceLabel: string;
    storeLimit: number;
    userLimit: number;
  };
  planId: string;
  redirectUrl: string;
};

export type CheckoutCompletePayload = {
  billingEmail: string;
  billingName: string;
  cardName: string;
  cardNumber: string;
  checkoutReference?: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  plan: string;
};

export type CheckoutCompleteResult = {
  redirectUrl: string;
  plan: {
    planName: string;
    priceLabel: string;
  };
  license: {
    maskedKey: string;
    planName: string;
    status: string;
  };
};

export type RequestResult = {
  received: true;
  referenceId?: string;
};

export async function createCheckoutSession(planId: PlanId): Promise<CheckoutSession> {
  return apiRequest<CheckoutSession>("/checkout/session", {
    body: JSON.stringify({ planId }),
    method: "POST",
  });
}

export async function completeCheckout(payload: CheckoutCompletePayload): Promise<CheckoutCompleteResult> {
  return apiRequest<CheckoutCompleteResult>("/checkout/complete", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function requestDemo(payload: DemoRequestPayload): Promise<RequestResult> {
  return apiRequest<RequestResult>("/demo-requests", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function requestPlanQuote(planId: PlanId, payload: DemoRequestPayload): Promise<RequestResult> {
  return apiRequest<RequestResult>("/plan-quotes", {
    body: JSON.stringify({ ...payload, planId }),
    method: "POST",
  });
}

