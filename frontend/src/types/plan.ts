export type PlanId = "starter" | "professional" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  target: string;
  description: string;
  priceLabel: string;
  limitLabel: string;
  ctaLabel: string;
  features: string[];
  highlighted: boolean;
};

export type PlanComparisonRow = {
  feature: string;
  starter: string | boolean;
  professional: string | boolean;
  enterprise: string | boolean;
};
